import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_THREAD_TAG } from "../../../constants.js";
import { BATTLE_ROOM_SERVICE, BATTLE_SERVICE } from '../../app/dependency-injection.js';
import * as ValidationRules from '../../../utils/validation-rules.js';
import { BadRequestError } from "../../../utils/bad-request-error.js";
import { getInvalidChannelMessage, getPokemonChoices } from "../discord-utils.js";

export const choosePokemonForLearnset = (req, res) => {
    return choosePokemonForDiscordLearnset(req, res);
}

export const displayLearnset = (req, res) => {
    return displayDiscordLearnset(req, res);
}

async function choosePokemonForDiscordLearnset(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let battle = await BATTLE_ROOM_SERVICE.get(battleId);
        if (battle) {
            let pokemonById = getPokemonChoices(battleId, userId);
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
                        content: 'Which Pokémon\'s learnset would you like to display?',
                        flags: InteractionResponseFlags.EPHEMERAL,
                        components: [
                            {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.STRING_SELECT,
                                    custom_id: `msg_learnset_choice_${battleId}_${userId}`,
                                    options: options,
                                },
                            ],
                            },
                        ],
                    },
                });
            }
            else {
                throw new BadRequestError("You have no Pokémon in this battle!");
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
    }
}

async function displayDiscordLearnset(req, res) {
    const { data } = req.body;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const info = data.custom_id.replace('msg_learnset_choice_', '');
    const tokens = info.split("_");
    let room = await BATTLE_ROOM_SERVICE.get(tokens[0]);
    let trainerId = tokens[1];
    
    try {
        res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: getPokemonLearnset(room.id, trainerId, data.values[0]),
                components: []
            }
        });
    } catch (err) {
        if (err instanceof BadRequestError) {
            return res.send({
                type: InteractionResponseType.UPDATE_MESSAGE,
                data: {
                    flags: InteractionResponseFlags.EPHEMERAL,
                    content: err.message,
                    components: []
                }
            });
        }
    }
}

function getPokemonLearnset(battleId, trainerId, pokemonId) {
        let message = "";

        let battle = BATTLE_SERVICE.get(battleId);
        let trainer = battle.trainers.find(trainer => trainer.id == trainerId);
        let pokemon = trainer.pokemon.find(pokemon => pokemon.id == pokemonId);
        if (pokemon.name != pokemon.species && (pokemon.baseSpecies == undefined || pokemon.name != pokemon.baseSpecies)) {
            message += `${pokemon.name} the `
        }
        message += `**${pokemon.species}'s Moves**\n`;
        return message + "\`\`\`" + pokemon.moves.map(move => move.name).sort().join(", ") + "\`\`\`\n";
}