import { InteractionResponseFlags, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { BATTLE_ROOM_SERVICE, BATTLE_SERVICE, CONFIG_DATA, CONSUMER_DATA } from '../../app/dependency-injection.js';
import { BadRequestError } from "../../../utils/bad-request-error.js";
import { getInvalidChannelMessage, getPokemonChoicesById } from "../discord-utils.js";
import { DiscordConstants } from "../discord-constants.js";

export const choosePokemonForLearnset = (req, res) => {
    return choosePokemonForDiscordLearnset(req, res);
}

export const displayLearnset = (req, res) => {
    return displayDiscordLearnset(req, res);
}

async function choosePokemonForDiscordLearnset(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
    
    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    if (channelName.substr(0, battleThreadTag.length) !== battleThreadTag) {
        return getInvalidChannelMessage(res);
    }

    const roomId = String(channelName).slice(battleThreadTag.length);
    try {
        let battle = await BATTLE_ROOM_SERVICE.get(roomId);
        if (battle) {
            let pokemonById = getPokemonChoicesById(roomId, userId);
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
                                    custom_id: `msg_learnset_choice_${roomId}_${userId}`,
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
    
    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    if (channelName.substr(0, battleThreadTag.length) !== battleThreadTag) {
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
        return message + "\`\`\`" + pokemon.moves.map(move => move.name.trim()).sort().join(", ") + "\`\`\`\n";
}