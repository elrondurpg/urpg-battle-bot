import { Battle, BattleRules } from "../../entities/battles.js";
import { BATTLE_DATA } from "../../dependency-injection.js";
import { Trainer } from "../../entities/trainer.js";
import { BadRequestError } from "../../utils/BadRequestError.js";

export class BattleService {
    create(request) {
        if (request.isValid()) {
            return createBattle(request);
        }
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

    addPokemon(battleId, playerId, pokemon) {
        let battle = BATTLE_DATA.get(battleId);
        if (battle.trainers.has(playerId)) {
            let trainer = battle.trainers.get(playerId);
            
            if (trainer.pokemon.size < battle.rules.numPokemonPerTrainer) {
                if (battle.rules.speciesClause) {
                    for (let existingPokemon of trainer.pokemon.values()) {
                        if (pokemon.species == existingPokemon.species) {
                            throw new BadRequestError("The Species Clause prevents you from sending another Pokémon of that species!");
                        }
                    }
                }
                if (isValidPokemon()) {
                    pokemon.id = battle.pokemonIndex++;
                    trainer.pokemon.set(pokemon.id, pokemon);
                    console.log(trainer.pokemon);
                    return battle;
                }
            }
            else {
                throw new BadRequestError("You have already sent the required number of Pokémon!");
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

    rules.generation = request.generation.trim().toLowerCase();
    /*if (rules.generation == "standard") {
        rules.megasAllowed = true;
        rules.zmovesAllowed = true;
        rules.dynamaxAllowed = true;
        rules.teraAllowed = true;
        rules.worldCoronationClause = true;
    }*/
    rules.sendType = request.sendType.trim().toLowerCase();
    rules.teamType = request.teamType.trim().toLowerCase();
    
    if (request.itemsAllowed != undefined) {
        rules.itemsAllowed = request.itemsAllowed;
    }

    rules.battleType = request.battleType.trim().toLowerCase();
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

function isValidPokemon(pokemon) {
    return true;
}