import { BATTLE_ROOM_DATA, BATTLE_SERVICE, BATTLES_MESSAGES_SERVICE } from "../../infrastructure/app/dependency-injection.js";
import * as BATTLE_VALIDATOR from "./battle-validations.js";

export async function forfeit(roomId, trainerId) {
    let room = await BATTLE_ROOM_DATA.get(roomId);
    BATTLE_VALIDATOR.validateBattleRoom(room);
    BATTLE_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);

    let trainer = BATTLE_SERVICE.get(roomId).trainers.find(trainer => trainer.id == trainerId);
    let response = await BATTLE_SERVICE.forfeit(room.id, trainer.id);
    if (response) {
        BATTLES_MESSAGES_SERVICE.create(room, `${trainer.name} concedes.`);
    }
    return response;
}