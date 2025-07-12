import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { getInvalidChannelMessage, getOptionValue } from '../discord-utils.js';
import { BATTLE_ROOM_SERVICE, CONFIG_DATA, CONSUMER_DATA } from '../../app/dependency-injection.js';
import { BadRequestError } from '../../../utils/bad-request-error.js';
import { AddPokemonRequest } from '../../../domain/battles/add-pokemon-request.js';
import { DiscordConstants } from '../discord-constants.js';

export const sendPokemon = (req, res) => {
    return sendPokemonInDiscord(req, res)
}

async function sendPokemonInDiscord(req, res) {
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
        let options = req.body.data.options;

        let pokemon = new AddPokemonRequest();
        pokemon.species = getOptionValue(options, "species");
        pokemon.gender = getOptionValue(options, "gender");
        pokemon.ability = getOptionValue(options, "ability");
        pokemon.hiddenPowerType = getOptionValue(options, "hidden-power");
        pokemon.item = getOptionValue(options, "item");
        pokemon.teraType = getOptionValue(options, "tera-type");
        pokemon.conversionType = getOptionValue(options, "conversion-type");

        let room = await BATTLE_ROOM_SERVICE.addPokemon(roomId, userId, pokemon);
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: getSuccessMessage(room, userId)
            }
        });
    } catch (err) {
        if (err instanceof BadRequestError) {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: err.message,
                    flags: InteractionResponseFlags.EPHEMERAL
                }
            });
        }
        else {
            console.log(err);
        }
    }
}

function getSuccessMessage(battle, trainerId) {
    let trainer = battle.trainers.get(trainerId);
    let pokemon = trainer.pokemon;
    let remainingPokemon = battle.rules.numPokemonPerTrainer - pokemon.size;
    if (remainingPokemon > 0) {
        return  `Pokémon sent! You must send ${remainingPokemon} more Pokémon!`;
    }
    else {
        return `Pokémon sent! You've sent all your Pokémon!`;
    }
}