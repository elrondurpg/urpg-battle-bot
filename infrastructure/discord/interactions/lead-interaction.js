import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_THREAD_TAG } from "../../../constants.js";
import { BATTLE_ROOM_SERVICE } from '../../app/dependency-injection.js';
import * as ValidationRules from '../../../utils/validation-rules.js';
import { BadRequestError } from "../../../utils/bad-request-error.js";
import { getInvalidChannelMessage, getPokemonChoices } from "../discord-utils.js";

export const sendLeadOptions = (req, res) => {
    return sendDiscordLeadOptions(req, res);
}

export const chooseLead = (req, res) => {
    return chooseDiscordLead(req, res);
}

async function sendDiscordLeadOptions(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const roomId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let pokemonById = getPokemonChoices(roomId, userId);
        let options = [];
        for (let [key, value] of pokemonById) {
            let option = {
                label: value,
                value: key
            };
            options.push(option);
        }
        if (pokemonById.size > 0) {
            await res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Which Pokémon will you send first?',
                    flags: InteractionResponseFlags.EPHEMERAL,
                    components: [
                        {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.STRING_SELECT,
                                custom_id: `msg_lead_choice_${roomId}_${userId}`,
                                options: options,
                            },
                        ],
                        },
                    ],
                },
            });
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
        console.log(err);
    }
}

async function chooseDiscordLead(req, res) {
    const { data } = req.body;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const info = data.custom_id.replace('msg_lead_choice_', '');
    const tokens = info.split("_");
    let room = await BATTLE_ROOM_SERVICE.get(tokens[0]);
    let trainerId = tokens[1];
    try {
        await BATTLE_ROOM_SERVICE.chooseLead(room.id, trainerId, data.values[0]);

        res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Lead set!`,
                components: []
            }
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