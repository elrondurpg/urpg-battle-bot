import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_THREAD_TAG } from "../../constants.js";
import { BATTLE_SERVICE } from "../../dependency-injection.js";
import * as ValidationRules from '../../utils/ValidationRules.js';
import { BadRequestError } from "../../utils/BadRequestError.js";

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

    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let battle = await BATTLE_SERVICE.get(battleId);
        if (!battle || !battle.started || battle.ended) {
            throw new BadRequestError(`Can't forfeit. There's no battle in progress!`);
        }
        if (!battle.trainers.has(userId)) {
            throw new BadRequestError("You are not involved in this battle!");
        }
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
                                custom_id: `msg_forfeit_choice_${battle.id}_${userId}`,
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
        const info = data.custom_id.replace('msg_forfeit_choice_', '');
        const tokens = info.split("_");
        let battle = await BATTLE_SERVICE.get(tokens[0]);
        let trainerId = tokens[1];

        battle.stream.sendForfeit(trainerId);
    }
}