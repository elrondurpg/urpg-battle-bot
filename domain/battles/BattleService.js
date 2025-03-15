import { Battle, BattleRules } from "../../entities/battles.js";
import { BATTLE_DATA } from "../../dependency-injection.js";

export class PlayerAlreadyAddedError extends Error {}

export class BattleService {
    create(request) {
        if (request.isValid()) {
            return createBattle(request);
        }
    }
    
    addPlayer(battleId, playerId) {
        let battle = BATTLE_DATA.get(battleId);

        if (battle.getNumPlayersNeeded() > 0 && !battle.playerIds.includes(playerId)) {
            battle.playerIds.push(playerId);

            for (let team of battle.teams) {
                if (team.length < battle.rules.numTrainersPerTeam) {
                    team.push(playerId);
                    break;
                }
            }
        }
        else if (battle.playerIds.includes(playerId)) {
            throw new PlayerAlreadyAddedError();
        }

        return BATTLE_DATA.save(battle);
    }
}

function createBattle(request) {
    let battle = new Battle();

    battle.ownerId = request.ownerId;
    battle.playerIds.push(battle.ownerId);

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
    battle.teams[0].push(battle.ownerId);

    rules.numPokemonPerTrainer = request.teamSize;

    battle.rules = rules;

    return BATTLE_DATA.create(battle);
}