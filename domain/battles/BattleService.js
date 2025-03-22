import { Battle, BattleRules } from "../../entities/battles.js";
import { BATTLE_DATA } from "../../dependency-injection.js";
import { Trainer } from "../../entities/trainer.js";
import { BadRequestError } from "../../utils/BadRequestError.js";
import * as Showdown from "urpg-battle-bot-calc";

export class BattleService {

    create(request) {
        if (request.isValid()) {
            return createBattle(request);
        }
    }

    get(battleId) {
        return BATTLE_DATA.get(battleId);
    }
    
    addPlayer(battleId, trainerId) {
        let battle = BATTLE_DATA.get(battleId);

        if (battle.started) {
            throw new BadRequestError(`Couldn't add you to this battle. It's already started!`);
        }

        if (battle.getNumPlayersNeeded() > 0 && !battle.trainers.has(trainerId)) {
            let trainer = new Trainer();
            trainer.id = trainerId;
            battle.trainers.set(trainerId, trainer);

            for (let team of battle.teams) {
                if (team.length < battle.rules.numTrainersPerTeam) {
                    team.push(trainer);
                    break;
                }
            }
        }
        else if (battle.trainers.has(trainerId)) {
            throw new BadRequestError(`You're already in this battle!`);
        }
        else if (battle.getNumPlayersNeeded() > 0) {
            throw new BadRequestError(`Couldn't add you to this battle. It's already full!`);
        }

        return BATTLE_DATA.save(battle);
    }

    addPokemon(battleId, trainerId, pokemon) {
        pokemon.species = pokemon.species.trim();
        pokemon.ability = pokemon.ability.trim();
        pokemon.gender = pokemon.gender.trim();
        if (pokemon.hiddenPowerType != undefined) {
            pokemon.hiddenPowerType = pokemon.hiddenPowerType.trim();
        }
        if (pokemon.item != undefined) {
            pokemon.item = pokemon.item.trim();
        }

        let battle = BATTLE_DATA.get(battleId);
        if (battle.trainers.has(trainerId)) {
            let trainer = battle.trainers.get(trainerId);
            if (battle.awaitingChoices.has(trainerId) && battle.awaitingChoices.get(trainerId).type == "send") {
                let speciesName = pokemon.species.toLowerCase();    
                const species = Showdown.default.Dex.species.get(speciesName);

                if (!isValidSpecies(species)) {
                    throw new BadRequestError(`There is no Pokémon named ${pokemon.species}!`);
                }
                else {
                    pokemon.species = species.name;
                }

                if (isBattleOnlyForm(species)) {
                    throw new BadRequestError(`${pokemon.species} can't be sent in battle!`);
                }

                if (battle.rules.speciesClause && hasTrainerSentSpeciesAlready(trainer, species)) {
                    throw new BadRequestError("The Species Clause prevents you from sending another Pokémon of that species!");
                }

                if (!battle.rules.legendsAllowed && isLegendary(species)) {
                    throw new BadRequestError(`Can't send ${pokemon.species} when legendary Pokémon are not allowed!`);
                }

                if (!isPokemonValidGenderForSpecies(pokemon, species)) {
                    if (species.gender != '') {
                        throw new BadRequestError(`${pokemon.species} must have gender '${species.gender}'!`);
                    }
                    else {
                        throw new BadRequestError(`${pokemon.species} must have a gender!`);
                    }
                }
                else {
                    pokemon.gender = pokemon.gender.toUpperCase();
                }

                let ability = Showdown.default.Dex.abilities.get(pokemon.ability);
                if (!isValidAbility(ability)) {
                    throw new BadRequestError(`There is no ability named ${pokemon.ability}!`);
                }

                if (!isAbilityValidForSpecies(ability.name, species)) {
                    throw new BadRequestError(`${pokemon.species} can't have the ability ${pokemon.ability}!`);
                }
                else {
                    pokemon.ability = ability.name;
                }

                if (pokemon.hiddenPowerType != undefined && !isHiddenPowerTypeValid(pokemon.hiddenPowerType)) {
                    throw new BadRequestError(`Hidden Power type ${pokemon.hiddenPowerType} does not exist!`);
                }
                else if (pokemon.hiddenPowerType != undefined) {
                    pokemon.hiddenPowerType = pokemon.hiddenPowerType.toUpperCase();
                }

                if (!battle.rules.itemsAllowed && pokemon.item != undefined) {
                    throw new BadRequestError(`Held items are not allowed in this battle!`);
                }

                let item = Showdown.default.Dex.items.get(pokemon.item);
                if (pokemon.item != undefined && !isItemValid(item)) {
                    throw new BadRequestError(`There is no held item named ${pokemon.item}!`);
                }
                else if (pokemon.item != undefined) {
                    pokemon.item = item.name;
                }

                /*if (pokemon.item != undefined && !isItemUserValid(pokemon.item, species)) {
                    throw new BadRequestError(`${pokemon.item} can't be held by ${pokemon.species}!`);
                }*/

                pokemon.id = trainer.pokemonIndex++;
                trainer.pokemon.set(pokemon.id, pokemon);
                if (battle.awaitingChoices.get(trainerId).quantity > 1) {
                    battle.awaitingChoices.get(trainerId).quantity--;
                }
                else {
                    battle.awaitingChoices.delete(trainer.id);
                }
                return battle;
            }
            else {
                throw new BadRequestError("Kauri's words echoed... There's a time and place for everything, but not now.");
            }
        }
        else {
            throw new BadRequestError("You are not involved in this battle!");
        }
    }

    chooseLead(battleId, trainerId, index) {
        let battle = BATTLE_DATA.get(battleId);
        if (battle.trainers.has(trainerId)) {
            if (battle.awaitingChoices.has(trainerId) && battle.awaitingChoices.get(trainerId).type == "lead") {
                if (index > 0 && index <= battle.rules.numPokemonPerTrainer) {
                    let trainer = battle.trainers.get(trainerId);
                    trainer.activePokemon = index;
                    battle.awaitingChoices.delete(trainerId);
                    return battle;
                }
                else {
                    if (battle.rules.numPokemonPerTrainer == 1) {
                        throw new BadRequestError(`You must send Pokémon #1 as your lead!`);
                    }
                    else {
                        throw new BadRequestError(`You must choose a lead from Pokémon #1 - ${battle.rules.numPokemonPerTrainer}!`);
                    }
                }
            }
            else {
                throw new BadRequestError("Kauri's words echoed... There's a time and place for everything, but not now.");
            }
        }
        else {
            throw new BadRequestError("You are not involved in this battle!");
        }
    }

    chooseMove(battleId, trainerId, request) {
        let battle = BATTLE_DATA.get(battleId);
        if (battle.trainers.has(trainerId)) {
            let trainer = battle.trainers.get(trainerId);
            if (battle.awaitingChoices.has(trainerId) && battle.awaitingChoices.get(trainerId).type == "move") {                
                // if move exists          
                let moveName = request.move.replace(/[^A-Za-z0-9]/, "").toLowerCase();      
                const move = Showdown.default.Dex.moves.get(moveName);
                if (!isMoveValid(move)) {
                    throw new BadRequestError(`There is no move named ${moveName}!`);
                }

                if (move.isZ != false) {
                    throw new BadRequestError(`To use a Z-Move, use \`/move\` to choose the base move and submit \`z-move = True\`!`);
                }

                let activePokemon = trainer.getActivePokemon();
                const species = Showdown.default.Dex.species.get(activePokemon.species);
                if (species.battleOnly != undefined) {
                    species = Showdown.default.Dex.species.get(species.battleOnly);
                }

                let speciesName = species.name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase();
                let learnset = Showdown.default.Dex.dataCache.Learnsets[speciesName].learnset;
                let knownMoves = new Set();
                if (learnset != undefined) {
                    knownMoves = [...knownMoves, ...Object.keys(learnset)];
                }
                if (species.changesFrom != undefined) {
                    let changesFromSpeciesName = species.changesFrom.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase();
                    let changesFromLearnset = Showdown.default.Dex.dataCache.Learnsets[changesFromSpeciesName].learnset;

                    if (changesFromLearnset != undefined) {
                        knownMoves = [...knownMoves, ...Object.keys(changesFromLearnset)];

                        let changesFromSpecies = Showdown.default.Dex.species.get(changesFromSpeciesName);
                        let currSpecies = changesFromSpecies;
                        while (currSpecies.prevo) {
                            let prevo = Showdown.default.Dex.species.get(currSpecies.prevo);
                            let prevoName = prevo.name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
                            let prevoLearnset = Showdown.default.Dex.dataCache.Learnsets[prevoName].learnset;
                            if (prevoLearnset != undefined) {
                                knownMoves = [...knownMoves, ...Object.keys(changesFromLprevoLearnsetearnset)];
                            }
                            currSpecies = prevo;
                        }
                    }
                }
                else {
                    let currSpecies = species;
                    while (currSpecies.prevo) {
                        let prevo = Showdown.default.Dex.species.get(currSpecies.prevo);
                        let prevoName = prevo.name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
                        let prevoLearnset = Showdown.default.Dex.dataCache.Learnsets[prevoName].learnset;
                        if (prevoLearnset != undefined) {
                            knownMoves = [...knownMoves, ...Object.keys(prevoLearnset)];
                        }
                        currSpecies = prevo;
                    }
                }

                let mimicMove = trainer.getActivePokemon().mimicMove;
                if (mimicMove != undefined) {
                    mimicMove = mimicMove.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase();
                }
                if (!knownMoves.includes(moveName) && mimicMove != moveName) {
                    throw new BadRequestError(`${activePokemon.species} can't learn ${move.name}!`);
                }

                let choices = [ 
                    request.shouldDynamax, 
                    request.shouldGigantamax,
                    request.shouldMegaEvolve,
                    request.shouldTerastallize,
                    request.shouldZmove
                ];
                if (choices.filter(Boolean).length > 1) {
                    throw new BadRequestError(`You can only choose one of the following per turn: Dynamax, Gigantamax, Mega Evolve, Terastallize, Use Z-Move!`);
                }
                // if pokemon should dynamax 
                    // if trainer has already dynamaxed
                    // if world coronation series and trainer has already mega evolved, terastallized, or z-moved

                // if pokemon should gigantamax 
                    // if trainer has already dynamaxed
                    // if world coronation series and trainer has already mega evolved, terastallized, or z-moved

                // if pokemon should mega evolve 
                    // if trainer has already mega evolved
                    // if world coronation series and trainer has already dynamaxed, terastallized, or z-moved

                // if pokemon should terastallize 
                    // if trainer has already terastallized
                    // if world coronation series and trainer has already dynamaxed, mega evolved, or z-moved

                // if pokemon should z-move 
                    // if trainer has already z-moved
                    // if world coronation series and trainer has already dynamaxed, mega evolved, or terastallized


                trainer.move = moveName;
                battle.awaitingChoices.delete(trainerId);
                return battle;
            }
            else {
                throw new BadRequestError("Kauri's words echoed... There's a time and place for everything, but not now.");
            }
        }
        else {
            throw new BadRequestError("You are not involved in this battle!");
        }
    }


}

function createBattle(request) {
    let battle = new Battle();

    battle.ownerId = request.ownerId;
    let owner = new Trainer();
    owner.id = battle.ownerId;
    battle.trainers.set(battle.ownerId, owner);

    let rules = new BattleRules();

    rules.generation = request.generation.toLowerCase();
    /*if (rules.generation == "standard") {
        rules.megasAllowed = true;
        rules.zmovesAllowed = true;
        rules.dynamaxAllowed = true;
        rules.teraAllowed = true;
        rules.worldCoronationClause = true;
    }*/
    rules.sendType = request.sendType.toLowerCase();
    rules.teamType = request.teamType.toLowerCase();
    
    if (request.itemsAllowed != undefined) {
        rules.itemsAllowed = request.itemsAllowed;
    }

    rules.battleType = request.battleType.toLowerCase();
    if (rules.battleType == "singles") {
        rules.numTeams = 2;
        rules.numTrainersPerTeam = 1;
    }
    /*else if (battleType == "doubles") {
        rules.battleType = "Doubles";
        rules.numTeams = 2;
        rules.numTrainersPerTeam = 1;
    }
    else if (battleType == "ffa") {
        rules.battleType = "FFA";
        rules.numTrainersPerTeam = 1;
    }*/

    for (let i = 0; i < rules.numTeams; i++) {
        battle.teams.push([]);
    }
    battle.teams[0].push(owner);

    rules.numPokemonPerTrainer = request.teamSize;

    battle.rules = rules;

    return BATTLE_DATA.create(battle);
}

function hasTrainerSentSpeciesAlready(trainer, species) {
    for (let existingPokemon of trainer.pokemon.values()) {
        let existingSpecies = Showdown.default.Dex.species.get(existingPokemon.species);
        let natDexNumMatches = existingSpecies.num == species.num;
        let typesMatch = existingSpecies.types.every(type => species.types.includes(type));
        let statsMatch = existingSpecies.baseStats.hp == species.baseStats.hp
            && existingSpecies.baseStats.atk == species.baseStats.atk
            && existingSpecies.baseStats.def == species.baseStats.def
            && existingSpecies.baseStats.spa == species.baseStats.spa
            && existingSpecies.baseStats.spd == species.baseStats.spd
            && existingSpecies.baseStats.spe == species.baseStats.spe;
        if (natDexNumMatches && typesMatch && statsMatch) {
            return true;
        }
    }
    return false;
}

function isValidSpecies(species) {
    return species != undefined 
        && (species.isNonstandard == null || species.isNonstandard == 'Past');
}

function isBattleOnlyForm(species) {
    return BATTLE_ONLY_FORMS.includes(species.forme);
}

function isPokemonValidGenderForSpecies(pokemon, species) {
    let gender = pokemon.gender.toLowerCase();
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

function isLegendary(species) {
    if (species.baseSpecies != undefined) {
        species = Showdown.default.Dex.species.get(species.baseSpecies);
    }
    return species.tags.includes("Restricted Legendary") 
        || species.tags.includes("Mythical")
        || species.tags.includes("Ultra Beast")
        || species.tags.includes("Sub-Legendary");
}

function isValidAbility(ability) {
    return ability.exists && !ability.isNonstandard;
}

function isAbilityValidForSpecies(ability, species) {
    let validInCurrentGen = Object.values(species.abilities).map(name => name.toLowerCase()).includes(ability.toLowerCase());
    if (validInCurrentGen) {
        return true;
    } 

    let previousGens = [ 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8'];
    for (let gen of previousGens) {
        let previousGenSpecies = Showdown.default.Dex.mod(gen).species.get(species.name);
        let validInPrevGen = Object.values(previousGenSpecies.abilities).map(name => name.toLowerCase()).includes(ability.toLowerCase());
        if (validInPrevGen) {
            return true;
        } 
    }

    return false;
}

function isHiddenPowerTypeValid(hiddenPowerType) {
    let type = Showdown.default.Dex.types.get(hiddenPowerType);
    let invalidHpTypes = [ "fairy", "normal", "stellar" ];
    return type.exists && !invalidHpTypes.includes(hiddenPowerType.toLowerCase());
}

function isItemValid(item) {
    return item.exists 
        && (item.isNonstandard == null || item.isNonstandard == 'Past');
}

function isItemUserValid(itemName, species) {
    let item = Showdown.default.Dex.items.get(itemName);
    return item.itemUser == undefined 
        || item.itemUser == species.name 
        || (species.otherFormes != undefined && species.otherFormes.some(form => item.itemUser.includes(form)));
}

function isMoveValid(move) {
    return move.exists && (move.isNonstandard == null || move.isNonstandard == 'Past');
}

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