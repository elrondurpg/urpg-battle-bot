import { BATTLE_ROOM_DATA, BATTLE_SERVICE } from "../../infrastructure/app/dependency-injection.js";
import * as BATTLE_ROOM_VALIDATOR from "./battle-validations.js";

export async function getStats(roomId, trainerId) {
    let message = "";

    let room = await BATTLE_ROOM_DATA.get(roomId);
    BATTLE_ROOM_VALIDATOR.validateBattleRoom(room);
    BATTLE_ROOM_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);

    let battle = await BATTLE_SERVICE.get(roomId);
    let trainer = battle.trainers.find(trainer => trainer.id == trainerId);
    message += getTrainerStats(trainer);

    Array.from(battle.trainers.values())
        .filter(opponent => opponent.id != trainerId)
        .sort((a, b) => a.name < b.name ? -1 : 1)
        .forEach(opponent => message += getOpponentStats(room, opponent));

    return message;
}

function getOpponentStats(room, trainer) {
    let message = `**${trainer.name}'s Team**\n\`\`\`\n`;
    let team = Array.from(trainer.pokemon.values());

    let teamType = room.rules.teamType.toLowerCase();

    for (let pokemon of team) { 
        if (shouldDisplayIllusion(pokemon)) {
            pokemon = pokemon.illusion;
        }
        else if (teamType == "preview" || shouldDisplayBenchedPokemon(pokemon)) {
            message += getPokemonDisplayName(pokemon) + "\n";
        }
        else {
            message += "???\n";
        }
    }
    return message + "\`\`\`";
}

function getTrainerStats(trainer) {
    let message = `**${trainer.name}'s Team**\n\`\`\``;
    let team = Array.from(trainer.pokemon.values());

    let activePokemon = team.filter(pokemon => pokemon.isActive);
    if (activePokemon) {
        message += "\nActive Pokémon\n";
        message += "--------------\n";

        for (let pokemon of activePokemon) {
            message += getPokemonFullStats(pokemon);
        }
    }

    let benchedPokemon = team.filter(pokemon => !pokemon.isActive);
    if (benchedPokemon && benchedPokemon.length > 0) {
        message += "Benched Pokémon\n";
        message += "---------------\n";

        for (let pokemon of benchedPokemon) {
            message += getPokemonFullStats(pokemon);
        }
    }
    return message + "\`\`\`";
}

function shouldDisplayIllusion(pokemon) {
    return pokemon.isActive && pokemon.illusion && !pokemon.illusionRevealed;
}

function shouldDisplayBenchedPokemon(pokemon) {
    let shouldDisplayLastIllusion = !pokemon.isActive && !pokemon.revealed && pokemon.previouslySwitchedIn && !pokemon.illusionRevealed;
    if (shouldDisplayLastIllusion && pokemon.lastIllusion) {
        return false;
    }
    else {
        return pokemon.isActive || pokemon.previouslySwitchedIn || pokemon.revealed;
    } 
}

function getPokemonDisplayName(pokemon) {
    let message = "";
    let isAltered = pokemon.species != pokemon.originalSpecies;
    let isAlternateForm = pokemon.baseSpecies && pokemon.baseSpecies == pokemon.originalSpecies;
    if (pokemon.name != pokemon.species && (pokemon.baseSpecies == undefined || pokemon.name != pokemon.baseSpecies)) {
        message += `${pokemon.name} the `
    }
    message += `${pokemon.species}`;
    message += `${isAltered && !isAlternateForm ? ` [base: ${pokemon.originalSpecies}]` : ''}`;
    message += `${pokemon.gender ? " " + pokemon.gender : ""}`;
    message += `${pokemon.fainted ? " [FNT]" : ""}`;
    return message;
}

function getPokemonFullStats(pokemon) {
    let message = "";
    message += getPokemonDisplayName(pokemon);

    message += `, ${pokemon.ability}`;
    message += `${pokemon.item ? ` @ ${pokemon.item}` : ""}`;

    if (!pokemon.fainted) {
        let hpPercent = (pokemon.hp / pokemon.maxhp * 100).toFixed(2) + '%';
        message += ` ${hpPercent}`;
    }

    let first = true;
    let boosts = [ "Attack", "Defense", "Special Attack", "Special Defense", "Speed", "Accuracy", "Evasion" ];
    for (let stat of boosts) {
        let boost = pokemon.boosts[stat];
        if (boost && boost != 0) {
            if (first) {
                message += " ";
                first = false;
            }
            if (boost > 0) {
                message += `[${stat}+${boost}]`;
            }
            else {
                message += `[${stat}${boost}]`;
            }
        }
    }
        
    if (pokemon.status) {
        if (first) {
            message += " ";
            first = false;
        }
        message += `[${pokemon.status.toUpperCase()}]`;
    }
            
    for (let status of Object.keys(pokemon.volatiles)) {
        if (first) {
            message += " ";
            first = false;
        }
        let tag = status;
        message += `[${tag}]`;
    }
        
    if (pokemon.terastallized) {
        if (first) {
            message += " ";
            first = false;
        }
        message += `[Tera: ${pokemon.terastallized}]`;
    }

    message += "\n";
    
    if (pokemon.hpType) {
        message += `-> Hidden Power type: ${pokemon.hpType}\n`;
    }
    if (pokemon.teraType) {
        message += `-> Tera type: ${pokemon.teraType}\n`;
    }
    if (pokemon.conversionType) {
        message += `-> Conversion type: ${pokemon.conversionType}\n`;
    }
    if (pokemon.useGmaxForm) {
        message += `-> Gigantamax Form Enabled\n`;
    }
    message += "\n";

    return message;
}