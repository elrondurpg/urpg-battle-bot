import { BATTLE_ROOM_DATA, BATTLE_SERVICE } from "../../infrastructure/app/dependency-injection.js";
import { BadRequestError } from "../../utils/bad-request-error.js";
import * as BATTLE_ROOM_VALIDATOR from "./battle-validations.js";

export async function chooseLead(roomId, trainerId, lead) {
    let room = await BATTLE_ROOM_DATA.get(roomId);
    BATTLE_ROOM_VALIDATOR.validateBattleRoom(room);
    BATTLE_ROOM_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);

    let trainer = BATTLE_SERVICE.get(roomId).trainers.find(trainer => trainer.id == trainerId);
    BATTLE_ROOM_VALIDATOR.validateTrainerWaitingForChoiceType(trainer, "lead");
    if (lead > 0 && lead <= room.rules.numPokemonPerTrainer) {
        room.lastActionTime = process.hrtime.bigint();
        let order = `${lead}`;
        for (let i = 1; i < room.rules.numPokemonPerTrainer + 1; i++) {
            if (i != lead) {
                order += i;
            }
        }
        await BATTLE_SERVICE.chooseLead(room.id, trainer.id, order);
        return await BATTLE_ROOM_DATA.save(room);
    }
    else {
        if (room.rules.numPokemonPerTrainer == 1) {
            throw new BadRequestError(`You must send Pokémon #1 as your lead!`);
        }
        else {
            throw new BadRequestError(`You must choose a lead from Pokémon #1 - ${room.rules.numPokemonPerTrainer}!`);
        }
    }
}