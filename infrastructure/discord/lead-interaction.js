import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_THREAD_TAG } from "../../constants.js";
import { BATTLE_SERVICE } from "../../dependency-injection.js";
import * as ValidationRules from '../../utils/ValidationRules.js';
import { BadRequestError } from "../../utils/BadRequestError.js";

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

    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let battle = await BATTLE_SERVICE.get(battleId);
        if (battle) {
            let pokemonById = battle.getTrainerPokemonById(userId);
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
                                    custom_id: `msg_lead_choice_${battleId}_${userId}`,
                                    options: options,
                                },
                            ],
                            },
                        ],
                    },
                });
            }
        }
        else {
            throw new BadRequestError(`There's no battle happening in this thread. Any previous battle in this thread has finished!`);
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

    res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `Lead set!`,
            components: []
        }
    });

    const info = data.custom_id.replace('msg_lead_choice_', '');
    const tokens = info.split("_");
    let battle = await BATTLE_SERVICE.get(tokens[0]);
    let trainerId = tokens[1];

    await BATTLE_SERVICE.chooseLead(battle.id, trainerId, data.values[0]);
    await battle.stream.sendLead(trainerId);
}