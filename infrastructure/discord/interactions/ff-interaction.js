import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_ROOM_SERVICE, CONFIG_DATA, CONSUMER_DATA } from '../../app/dependency-injection.js';
import { BadRequestError } from "../../../utils/bad-request-error.js";
import { getInvalidChannelMessage } from "../discord-utils.js";
import * as BATTLE_ROOM_VALIDATOR from "../../../domain/battles/battle-validations.js";
import { DiscordConstants } from "../discord-constants.js";

export const requestForfeitConfirmation = (req, res) => {
    return requestDiscordForfeitConfirmation(req, res);
}

export const forfeitBattle = (req, res) => {
    return forfeitDiscordBattle(req, res);
}

async function requestDiscordForfeitConfirmation(req, res) {
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
        let room = await BATTLE_ROOM_SERVICE.get(roomId);
        BATTLE_ROOM_VALIDATOR.validateBattleRoom(room);
        BATTLE_ROOM_VALIDATOR.validateBattleRoomHasTrainer(room, userId);
        let options = [
            {
                label: "Yes",
                value: true
            },
            {
                label: "No",
                value: false
            }
        ];
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Are you sure you want to forfeit?',
                flags: InteractionResponseFlags.EPHEMERAL,
                components: [
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.STRING_SELECT,
                                custom_id: `msg_forfeit_choice_${room.id}_${userId}`,
                                options: options,
                            },
                        ],
                    },
                ],
            },
        });
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
        console.log(err);
    }
}

async function forfeitDiscordBattle(req, res) {
    const { data } = req.body;
    
    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    if (channelName.substr(0, battleThreadTag.length) !== battleThreadTag) {
        return getInvalidChannelMessage(res);
    }

    let response = data.values[0];
    let responseMessage = response === 'True' ? 'Forfeit confirmed.' : 'Decided not to forfeit.';

    res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: responseMessage,
            components: []
        }
    });

    if (response === 'True') {
        const input = data.custom_id.replace('msg_forfeit_choice_', '');
        const tokens = input.split("_");
        BATTLE_ROOM_SERVICE.forfeit(tokens[0], tokens[1]);
    }
}