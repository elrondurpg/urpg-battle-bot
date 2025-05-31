import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_THREAD_TAG } from "../../../constants.js";
import { BATTLE_ROOM_SERVICE } from '../../app/dependency-injection.js';
import * as ValidationRules from '../../../utils/ValidationRules.js';
import { BadRequestError } from "../../../utils/BadRequestError.js";
import { getInvalidChannelMessage } from "../utils.js";
import * as BATTLE_ROOM_VALIDATOR from "../../../domain/battles/battle-validations.js";

export const requestForfeitConfirmation = (req, res) => {
    return requestDiscordForfeitConfirmation(req, res);
}

export const forfeitBattle = (req, res) => {
    return forfeitDiscordBattle(req, res);
}

async function requestDiscordForfeitConfirmation(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const roomId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let room = await BATTLE_ROOM_SERVICE.get(roomId);
        BATTLE_ROOM_VALIDATOR.validateBattleRoom(room);
        BATTLE_ROOM_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);
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

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
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