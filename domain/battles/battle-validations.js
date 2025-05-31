import { BadRequestError } from "../../utils/BadRequestError.js";

export function validateBattleRoom(room) {
    if (!room) {
        throw new BadRequestError(`There's no battle happening in this thread. Any previous battle in this thread has finished!`);
    }
}

export function validateBattleRoomHasTrainer(battle, trainerId) {
    if (!battle.trainers.has(trainerId)) {
        throw new BadRequestError("You are not involved in this battle!");
    }
}

export function validateBattleRoomDoesntHaveTrainer(battle, trainerId) {
    if (battle.trainers.has(trainerId)) {
        throw new BadRequestError("You are already involved in this battle!");
    }
}

export function validateTrainerWaitingForChoiceType(trainer, ...choiceType) {
    if (!trainer.awaitingChoice || !choiceType.some(type => trainer.awaitingChoice.type == type)) {
        throw new BadRequestError("Kauri's words echoed... There's a time and place for everything, but not now.");
    }
}