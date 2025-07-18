import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_ROOM_SERVICE, CONFIG_DATA, CONSUMER_DATA } from '../../app/dependency-injection.js';
import { BadRequestError } from "../../../utils/bad-request-error.js";
import { getInvalidChannelMessage, getPokemonChoicesByPosition } from "../discord-utils.js";
import { DiscordConstants } from "../discord-constants.js";

export const switchPokemon = (req, res) => {
    return switchDiscordPokemon(req, res);
}

export const choosePokemon = (req, res) => {
    return chooseDiscordPokemon(req, res);
}

async function switchDiscordPokemon(req, res) {
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
        if (room) {
            let pokemonById = getPokemonChoicesByPosition(roomId, userId, (pokemon => !pokemon.isActive && !pokemon.fainted));
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
                        content: 'Which Pokémon will you switch in?',
                        flags: InteractionResponseFlags.EPHEMERAL,
                        components: [
                            {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.STRING_SELECT,
                                    custom_id: `msg_switch_choice_${roomId}_${userId}`,
                                    options: options,
                                },
                            ],
                            },
                        ],
                    },
                });
            }
            else {
                if (room.rules.numPokemonPerTrainer > 1) {
                    throw new BadRequestError("You have no benched Pokémon with the will to fight!");
                }
                else {
                    throw new BadRequestError("You have no benched Pokémon!");
                }
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

async function chooseDiscordPokemon(req, res) {
    const { data } = req.body;
    
    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    if (channelName.substr(0, battleThreadTag.length) !== battleThreadTag) {
        return getInvalidChannelMessage(res);
    }

    const info = data.custom_id.replace('msg_switch_choice_', '');
    const tokens = info.split("_");
    let room = await BATTLE_ROOM_SERVICE.get(tokens[0]);
    let trainerId = tokens[1];
    
    try {
        await BATTLE_ROOM_SERVICE.chooseSwitch(room.id, trainerId, data.values[0]);
        res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Switch set!`,
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