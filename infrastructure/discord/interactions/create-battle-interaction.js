import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BattleIdCollisionError } from '../../../models/battle-room.js';
import { BATTLE_ROOM_DATA, BATTLE_ROOM_SERVICE, BATTLES_MESSAGES_SERVICE, CONFIG_DATA, CONSUMER_DATA, DISCORD_CHANNELS_THREADS_SERVICE } from '../../app/dependency-injection.js';
import { CreateBattleRoomRequest } from '../../../domain/battles/create-battle-room-request.js';
import { BadRequestError } from '../../../utils/bad-request-error.js';
import { getOptionValue } from '../discord-utils.js';
import { createOpenBattleMessage } from '../services/battles/open-battles-service.js';
import { DiscordConstants } from '../discord-constants.js';

export const onCreateBattleRoom = (req, res) => {
    try {
        return createDiscordBattleRoom(req, res);
    } catch (err) {
        if (err instanceof BattleIdCollisionError) {
            return sendMessageOnBattleIdCollision(res);
        }
    }
}

async function createDiscordBattleRoom(req, res) {
    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleSearchChannelName = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_SEARCH_CHANNEL_NAME_PROPERTY_NAME);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    if (channelName != battleSearchChannelName) {
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `This server has limited the use of /create-battle to the #${battleSearchChannelName} channel.`
            }
        });
    }
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    let request = new CreateBattleRoomRequest();
    request.ownerId = userId;
    
    let options = req.body.data.options;
    request.teamSize = getOptionValue(options, 'team-size');
    request.generation = getOptionValue(options, 'generation');
    request.sendType = getOptionValue(options, 'send-type');
    request.teamType = getOptionValue(options, 'team-type');
    request.battleType = getOptionValue(options, 'battle-type');
    request.itemsAllowed = getOptionValue(options, 'items-allowed');

    try {
        let room = await BATTLE_ROOM_SERVICE.create(request);
        if (req.body.member.user.nick != undefined) {
            room.trainers.get(userId).name = req.body.member.nick;
        }
        else {
            room.trainers.get(userId).name = req.body.member.user.global_name;
        }
        const channelId = req.body.channel.id;
        const threadName = `${battleThreadTag}${room.id}`;
        let thread = await DISCORD_CHANNELS_THREADS_SERVICE.create(channelId, threadName);
        room.consumerId = consumer.id;
        room.options['discordThreadId'] = thread.id;
        await BATTLES_MESSAGES_SERVICE.create(room, room.getOpenRoomMessage());
        await BATTLE_ROOM_DATA.save(room);
        createOpenBattleMessage(room);
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Created a battle room!`
            }
        });
    } catch (err) {
        console.log(err.message);
        let message = err instanceof BadRequestError 
            ? err.message 
            : 'A battle room could not be created from the provided data.';

        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: message
            }
        });
    }
}

function sendMessageOnBattleIdCollision(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `Couldn't create the requested battle room. Please try again.`,
        }
    });
}