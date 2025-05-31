import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { getInvalidChannelMessage, getOptionValue } from '../utils.js';
import { BATTLE_THREAD_TAG } from '../../../constants.js';
import { BATTLE_ROOM_SERVICE } from '../../app/dependency-injection.js';
import { PokemonRequest } from '../../../models/pokemon-request.js';
import { BadRequestError } from '../../../utils/BadRequestError.js';

export const sendPokemon = (req, res) => {
    return sendPokemonInDiscord(req, res)
}

async function sendPokemonInDiscord(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    const roomId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    if (channelName.substr(0, 12) !== BATTLE_THREAD_TAG) {
        return getInvalidChannelMessage(res);
    }

    try {
        let options = req.body.data.options;

        let pokemon = new PokemonRequest();
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