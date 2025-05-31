import { BATTLE_TYPES, SEND_TYPES, TEAM_TYPES, GENERATIONS } from "../../models/battle-room.js";
import { BadRequestError } from "../../utils/BadRequestError.js";

export const MIN_TEAM_SIZE = 1;
export const MAX_TEAM_SIZE = 6;

export class CreateBattleRoomRequest {
    ownerId;
    playerIds;
    teamSize;
    generation;
    sendType;
    teamType;
    battleType;
    itemsAllowed;
    legendsAllowed;

    isValid() {
        return isValidTeamSize(this.teamSize)
            && isValidGeneration(this.generation)
            && isValidSendType(this.sendType)
            && isValidTeamType(this.teamType)
            && isValidBattleType(this.battleType);
    }
}

function isValidTeamSize(teamSize) {
    return teamSize >= MIN_TEAM_SIZE && teamSize <= MAX_TEAM_SIZE;
}

function isValidGeneration(generation) {
    if (generation == null || !GENERATIONS.find(type => type.toLowerCase() === generation.trim().toLowerCase())) {
        throw new BadRequestError (`${generation} is not a valid generation. Valid generations: ${GENERATIONS}`);
    }
    else {
        return true;
    }
}

function isValidSendType(sendType) {
    if (sendType == null || !SEND_TYPES.find(type => type.toLowerCase() === sendType.trim().toLowerCase())) {
        throw new BadRequestError (`${sendType} is not a valid send type. Valid send types: ${SEND_TYPES}`);
    }
    else {
        return true;
    }
}

function isValidTeamType(teamType) {
    if (teamType == null || !TEAM_TYPES.find(type => type.toLowerCase() === teamType.trim().toLowerCase())) {
        throw new BadRequestError (`${teamType} is not a valid team type. Valid team types: ${TEAM_TYPES}`);
    }
    else {
        return true;
    }
}

function isValidBattleType(battleType) {
    if (battleType == null || !BATTLE_TYPES.find(type => type.toLowerCase() === battleType.trim().toLowerCase())) {
        throw new BadRequestError (`${battleType} is not a valid battle type. Valid battle types: ${BATTLE_TYPES}`);
    }
    else {
        return true;
    }
}