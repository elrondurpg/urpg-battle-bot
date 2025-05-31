import { BATTLE_ROOM_DATA } from "../../infrastructure/app/dependency-injection.js";
import { BattleRoom, BattleRules } from "../../models/battle-room.js";
import { AddPlayerRequest } from "./add-player-request.js";

export async function createBattleRoom(request) {
    let room = new BattleRoom();

    room.ownerId = request.ownerId;
    let owner = new AddPlayerRequest();
    owner.id = room.ownerId;
    room.trainers.set(room.ownerId, owner);

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
        room.teams.push([]);
    }
    room.teams[0].push(owner.id);

    rules.numPokemonPerTrainer = request.teamSize;

    room.rules = rules;

    let result = await BATTLE_ROOM_DATA.create(room);
    result.lastActionTime = process.hrtime.bigint();
    return result;
}