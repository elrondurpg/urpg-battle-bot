import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BATTLE_ROOM_SERVICE, BATTLES_MESSAGES_SERVICE, CONFIG_DATA, CONSUMER_DATA } from '../../app/dependency-injection.js';
import { BadRequestError } from '../../../utils/bad-request-error.js';
import { getInvalidChannelMessage } from '../discord-utils.js';
import { deleteOpenBattleMessage } from '../services/battles/open-battles-service.js';
import { DiscordConstants } from '../discord-constants.js';

export const joinBattle = (req, res) => {
    return joinDiscordBattle(req, res)
}

async function joinDiscordBattle(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    const roomId = String(channelName).slice(battleThreadTag.length);
    if (channelName.substr(0, battleThreadTag.length) !== battleThreadTag) {
        return getInvalidChannelMessage(res);
    }
    try {
        let name = req.body.member.user.global_name;
        let room = await BATTLE_ROOM_SERVICE.addPlayer(roomId, userId, name);
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `<@${userId}> joined the battle!`
            }
        });        
        if (room.getNumPlayersNeeded() == 0) {
            await BATTLES_MESSAGES_SERVICE.create(room, room.getBattleStartMessage());
            room.sendWaitingForSendsMessages();
            deleteOpenBattleMessage(room);
        }
    } catch (err) {
        if (err instanceof BadRequestError) {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.EPHEMERAL,
                    content: err.message
                }
            });
        }
    }
}