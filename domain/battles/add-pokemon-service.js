import { ABILITY_SERVICE, BATTLE_ROOM_DATA, ITEM_SERVICE, MOVE_SERVICE, SPECIES_SERVICE, TYPE_SERVICE, BATTLE_SERVICE, PLAYER_EXPECTED_ACTION_SERVICE } from "../../infrastructure/app/dependency-injection.js";
import { BadRequestError } from "../../utils/bad-request-error.js";
import * as BATTLE_VALIDATOR from "./battle-validations.js";

const BATTLE_ONLY_FORMS = [ "Mega", "Gmax", "Mega-X", "Mega-Y", "Rainy", "Snowy", "Primal",
    "Sunshine", "Origin", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", 
    "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", 
    "Fairy", "Zen", "Black", "White" , "Pirouette", "Douse", "Shock", "Burn", "Chill",
    "Bond", "Ash", "Blade", "Neutral", "Complete", "School", "Busted", "Totem", "Busted-Totem",
    "Meteor", "Dusk-Mane", "Dawn-Wings", "Ultra", "Gulping", "Gorging", "Noice", "Hangry",
    "Crowned", "Eternamax", "Shadow", "Hero", "Wellspring", "Hearthflame", "Cornerstone", 
    "Terastal", "Stellar", "Alola-Totem", "Cosplay", "Sunny", "Galar-Zen", "Low-Key-Gmax",
    "Rapid-Strike-Gmax", "Teal-Tera", "Wellspring-Tera", "Hearthflame-Tera", "Cornerstone-Tera"
];

const INVALID_HP_TYPES = [ "fairy", "normal", "stellar" ];

export async function addPokemon(battleId, trainerId, pokemon) {
    trimInput(pokemon);

    let room = await BATTLE_ROOM_DATA.get(battleId);
    BATTLE_VALIDATOR.validateBattleRoom(room);
    BATTLE_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);

    let trainer = room.trainers.get(trainerId);
    validateTrainerNeedsPokemon(trainer, room);

    let species = SPECIES_SERVICE.get(pokemon.species);
    validateSpecies(pokemon, species, room, trainer);
    pokemon.species = species.name;

    validateGender(pokemon, species);
    pokemon.gender = pokemon.gender.toUpperCase();

    let ability = ABILITY_SERVICE.get(pokemon.ability);
    validateAbility(pokemon, species, ability);
    pokemon.ability = ability.name;

    if (pokemon.hiddenPowerType) {
        validateHiddenPowerType(pokemon.hiddenPowerType);
        pokemon.hiddenPowerType = pokemon.hiddenPowerType.toUpperCase();
    }

    if (pokemon.item) {
        let item = ITEM_SERVICE.get(pokemon.item);
        validateItem(room, item);
        pokemon.item = item.name;
    }

    if (pokemon.teraType) {
        let teraType = TYPE_SERVICE.get(pokemon.teraType);
        validateTeraType(teraType, species);
        pokemon.teraType = species.name.toLowerCase().startsWith("terapagos") ? "Stellar"
            : teraType.name;
    }

    if (pokemon.conversionType) {
        let conversionType = TYPE_SERVICE.get(pokemon.conversionType);
        validateConversionType(conversionType, species);
        pokemon.conversionType = conversionType.name;
    }

    pokemon.id = trainer.pokemonIndex++;
    trainer.pokemon.set(pokemon.id, pokemon);
    room.lastActionTime = process.hrtime.bigint();
    let numPokemonToSend = room.rules.numPokemonPerTrainer - trainer.pokemon.size;
    if (numPokemonToSend == 0) {
        PLAYER_EXPECTED_ACTION_SERVICE.deleteExpectMessage(room, trainerId);
    }
    let waitingForSends = Array.from(room.trainers.values()).some(trainer => trainer.pokemon.size < room.rules.numPokemonPerTrainer);
    if (room.rules.teamType.toLowerCase() != "open" && !waitingForSends) {
        await BATTLE_SERVICE.create(room);
    }
    return await BATTLE_ROOM_DATA.save(room);
}

function validateTrainerNeedsPokemon(trainer, room) {
    if (trainer.pokemon.size >= room.rules.numPokemonPerTrainer) {
        throw new BadRequestError("You've already sent all your Pokémon!");
    }
}

function trimInput(pokemon) {
    pokemon.species = pokemon.species.trim();
    pokemon.ability = pokemon.ability.trim();
    pokemon.gender = pokemon.gender.trim();
    if (pokemon.hiddenPowerType != undefined) {
        pokemon.hiddenPowerType = pokemon.hiddenPowerType.trim();
    }
    if (pokemon.item != undefined) {
        pokemon.item = pokemon.item.trim();
    }
    if (pokemon.teraType) {
        pokemon.teraType = pokemon.teraType.trim();
    }
    if (pokemon.conversionType) {
        pokemon.conversionType = pokemon.conversionType.trim();
    }
}

function validateSpecies(pokemon, species, room, trainer) {
    if (!species) {
        throw new BadRequestError(`There is no Pokémon named ${pokemon.species}!`);
    }

    if (BATTLE_ONLY_FORMS.includes(species.forme)) {
        throw new BadRequestError(`${pokemon.species} can't be sent in battle!`);
    }

    if (room.rules.speciesClause && hasTrainerSentSpeciesAlready(trainer, species)) {
        throw new BadRequestError("The Species Clause prevents you from sending another Pokémon of that species!");
    }

    if (!room.rules.legendsAllowed && isLegendary(species)) {
        throw new BadRequestError(`Can't send ${pokemon.species} when legendary Pokémon are not allowed!`);
    }
}

function hasTrainerSentSpeciesAlready(trainer, species) {
    for (let existingPokemon of trainer.pokemon.values()) {
        let existingSpecies = SPECIES_SERVICE.get(existingPokemon.species);
        let natDexNumMatches = existingSpecies.num == species.num;
        let typesMatch = existingSpecies.types.every(type => species.types.includes(type));
        let statsMatch = existingSpecies.hp == species.hp
            && existingSpecies.atk == species.atk
            && existingSpecies.def == species.def
            && existingSpecies.spa == species.spa
            && existingSpecies.spd == species.spd
            && existingSpecies.spe == species.spe;
        if (natDexNumMatches && typesMatch && statsMatch) {
            return true;
        }
    }
    return false;
}

function isLegendary(species) {
    if (species.baseSpecies != undefined) {
        species = SPECIES_SERVICE.get(species.baseSpecies);
    }
    return species.tags.includes("Restricted Legendary") 
        || species.tags.includes("Mythical")
        || species.tags.includes("Ultra Beast")
        || species.tags.includes("Sub-Legendary");
}

function validateGender(pokemon, species) {
    if (!isGenderValidForSpecies(pokemon.gender, species)) {
        if (species.gender != '') {
            throw new BadRequestError(`${pokemon.species} must have gender '${species.gender}'!`);
        }
        else {
            throw new BadRequestError(`${pokemon.species} must have a gender!`);
        }
    }
}

function isGenderValidForSpecies(gender, species) {
    gender = gender.toLowerCase();
    let expectedGender = species.gender.toLowerCase();

    if (expectedGender == '' && (gender == 'm' || gender == 'f')) {
        return true;
    }
    else if (expectedGender == gender) {
        return true;
    }
    else {
        return false;
    }
}


function validateAbility(pokemon, species, ability) {
    if (!isAbilityValidForSpecies(ability.name, species)) {
        throw new BadRequestError(`${pokemon.species} can't have the ability ${ability.name}!`);
    }
}

function isAbilityValidForSpecies(ability, species) {
    let validInCurrentGen = Object.values(species.abilities).map(name => name.toLowerCase()).includes(ability.toLowerCase());
    if (validInCurrentGen) {
        return true;
    } 

    let previousGens = [ 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8'];
    for (let gen of previousGens) {
        let previousGenSpecies = SPECIES_SERVICE.getForGen(species.name, gen);
        let validInPrevGen = Object.values(previousGenSpecies.abilities).map(name => name.toLowerCase()).includes(ability.toLowerCase());
        if (validInPrevGen) {
            return true;
        } 
    }

    return false;
}

function validateHiddenPowerType(typeName) {
    let type = TYPE_SERVICE.get(typeName);
    if (INVALID_HP_TYPES.includes(typeName.toLowerCase())) {
        throw new BadRequestError(`Hidden Power type ${typeName} does not exist!`);
    }
}

function validateItem(room, trainer, item) {
    if (!room.rules.itemsAllowed) {
        throw new BadRequestError(`Held items are not allowed in this battle!`);
    }

    if (room.rules.itemClause && hasTrainerSentItemAlready(trainer, item)) {
        throw new BadRequestError("The Item Clause prevents you from sending another Pokémon holding that item!");
    }
}

function hasTrainerSentItemAlready(trainer, item) {
    if (trainer.pokemon) {
        for (let existingPokemon of trainer.pokemon.values()) {
            if (existingPokemon.item) {
                let existingItem = ITEM_SERVICE.get(existingPokemon.item);
                if (existingItem.id == item.id) {
                    return true;
                }
            }
        }
    }
    return false;
}

function validateTeraType(type, species) {
    if (species.name.toLowerCase().startsWith("terapagos") && type.name.toLowerCase() != 'stellar') {
        throw new BadRequestError("Terapagos can only have Tera Type = Stellar!");
    }
    if (species.name.toLowerCase().startsWith("ogerpon")) {
        throw new BadRequestError("Ogerpon's Tera Type depends on its form and cannot be set now!");
    }
}

function validateConversionType(type, species) {
    if (!species.learnset.some(moveName => {
        let move = MOVE_SERVICE.get(moveName);
        return move.type.toLowerCase() == pokemon.conversionType;
    })) {
        throw new BadRequestError(`${species.name} can't have Conversion Type = ${type.name} because it doesn't learn a move of that type! (from: Conversion Type)`);
    }
}