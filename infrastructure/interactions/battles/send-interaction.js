import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { getOptionValue } from '../../../commands.js';
import { BATTLE_THREAD_TAG } from '../../../constants.js';
import { BATTLE_SERVICE } from '../../../dependency-injection.js';
import { Pokemon } from '../../../entities/pokemon.js';
import { BadRequestError } from '../../../utils/BadRequestError.js';

export const sendPokemon = (req, res) => {
    return sendPokemonInDiscord(req, res)
}

async function sendPokemonInDiscord(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    if (channelName.substr(0, 12) !== BATTLE_THREAD_TAG) {
        return getInvalidChannelMessage(res);
    }

    try {
        let options = req.body.data.options;

        let pokemon = new Pokemon();
        pokemon.species = getOptionValue(options, "species");
        pokemon.gender = getOptionValue(options, "gender");
        pokemon.ability = getOptionValue(options, "ability");
        pokemon.hiddenPowerType = getOptionValue(options, "hidden-power-type");
        pokemon.item = getOptionValue(options, "item");

        let battle = BATTLE_SERVICE.addPokemon(battleId, userId, pokemon);
        console.log(battle);
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