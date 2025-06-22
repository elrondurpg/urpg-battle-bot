import { BATTLE_ROOM_DATA } from "../../infrastructure/app/dependency-injection.js";
import { addPokemon } from "./add-pokemon-service.js";
import { createBattleRoom } from "./create-battle-room-service.js";
import { chooseLead } from "./choose-lead-service.js";
import { chooseMove } from "./choose-move-service.js";
import { chooseSwitch } from "./choose-switch-service.js";
import { addPlayer } from "./add-player-service.js";
import { getStats } from "./get-stats-service.js";
import { forfeit } from "./forfeit-service.js";
import { completeBattle } from "./complete-battle-service.js";

export class BattleRoomService {

    async create(request) {
        if (request.isValid()) {
            return await createBattleRoom(request);
        }
    }
    
    async addPlayer(roomId, trainerId, trainerName) {
        return await addPlayer(roomId, trainerId, trainerName);
    }

    async get(roomId) {
        return await BATTLE_ROOM_DATA.get(roomId);
    }

    async getAll() {
        return await BATTLE_ROOM_DATA.getAll();
    }

    async completeBattle(roomId, winnerName) {
        return await completeBattle(roomId, winnerName);
    }

    async addPokemon(roomId, trainerId, pokemon) {
        return await addPokemon(roomId, trainerId, pokemon);
    }

    async chooseLead(roomId, trainerId, lead) {
        return await chooseLead(roomId, trainerId, lead);
    }

    async chooseMove(roomId, trainerId, request) {
        return await chooseMove(roomId, trainerId, request);
    }

    async chooseSwitch(roomId, trainerId, pokemonId) {
        return await chooseSwitch(roomId, trainerId, pokemonId);
    }

    async getStats(roomId, trainerId) {
        return await getStats(roomId, trainerId);
    }

    async forfeit(roomId, trainerId) {
        return await forfeit(roomId, trainerId);
    }
}