import { BATTLE_ROOM_DATA, BATTLE_SERVICE } from "../../infrastructure/app/dependency-injection.js";
import { BadRequestError } from "../../utils/BadRequestError.js";
import * as BATTLE_VALIDATOR from "./battle-validations.js";

export async function chooseSwitch(roomId, trainerId, pokemonId) {
    let room = await BATTLE_ROOM_DATA.get(roomId);
    BATTLE_VALIDATOR.validateBattleRoom(room);
    BATTLE_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);

    let trainer = BATTLE_SERVICE.get(roomId).trainers.find(trainer => trainer.id == trainerId);
    BATTLE_VALIDATOR.validateTrainerWaitingForChoiceType(trainer, "move", "switch");

    let activePokemon = trainer.active[0];
    if (activePokemon && activePokemon.trapped) {
        throw new BadRequestError("**You are trapped and cannot switch!**");
    }

    room.lastActionTime = process.hrtime.bigint();
    await BATTLE_SERVICE.switchPokemon(room.id, trainer.id, pokemonId);
    await BATTLE_ROOM_DATA.save(room);
}