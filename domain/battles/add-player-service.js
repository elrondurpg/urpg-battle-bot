import { BATTLE_ROOM_DATA } from "../../infrastructure/app/dependency-injection.js";
import { BadRequestError } from "../../utils/bad-request-error.js";
import * as BATTLE_VALIDATOR from "./battle-validations.js";
import { AddPlayerRequest } from "./add-player-request.js";

export async function addPlayer(battleId, trainerId, trainerName) {
    let room = await BATTLE_ROOM_DATA.get(battleId);
    BATTLE_VALIDATOR.validateBattleRoom(room);
    BATTLE_VALIDATOR.validateBattleRoomDoesntHaveTrainer(room, trainerId);

    if (room.getNumPlayersNeeded() > 0 && !room.trainers.has(trainerId)) {
        let trainer = new AddPlayerRequest();
        trainer.id = trainerId;
        trainer.name = trainerName;
        room.trainers.set(trainerId, trainer);

        for (let team of room.teams) {
            if (team.length < room.rules.numTrainersPerTeam) {
                team.push(trainer.id);
                break;
            }
        }
    }
    else if (room.trainers.has(trainerId)) {
        throw new BadRequestError(`You're already in this battle!`);
    }
    else if (room.getNumPlayersNeeded() > 0) {
        throw new BadRequestError(`Couldn't add you to this battle. It's already full!`);
    }

    room.lastActionTime = process.hrtime.bigint();
    return await BATTLE_ROOM_DATA.save(room);
}