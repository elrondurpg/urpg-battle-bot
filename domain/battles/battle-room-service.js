import { BATTLE_ROOM_DATA } from "../../infrastructure/app/dependency-injection.js";
import { addPokemon } from "./add-pokemon-service.js";
import { createBattleRoom } from "./create-battle-room-service.js";
import { chooseLead } from "./choose-lead-service.js";
import { chooseMove } from "./choose-move-service.js";
import { chooseSwitch } from "./choose-switch-service.js";
import { addPlayer } from "./add-player-service.js";
import { getStats } from "./get-stats-service.js";
import { forfeit } from "./forfeit-service.js";

export class BattleRoomService {

    async create(request) {
        if (request.isValid()) {
            return await createBattleRoom(request);
        }
    }
    
    async addPlayer(battleId, trainerId, trainerName) {
        return await addPlayer(battleId, trainerId, trainerName);
    }

    async get(battleId) {
        return await BATTLE_ROOM_DATA.get(battleId);
    }

    async getAll() {
        return await BATTLE_ROOM_DATA.getAll();
    }

    async endBattle(battleId) {
        let battle = await BATTLE_ROOM_DATA.get(battleId);
        await BATTLE_ROOM_DATA.delete(battle);
    }

    async addPokemon(battleId, trainerId, pokemon) {
        return await addPokemon(battleId, trainerId, pokemon);
    }

    async chooseLead(battleId, trainerId, lead) {
        return await chooseLead(battleId, trainerId, lead);
    }

    async chooseMove(battleId, trainerId, request) {
        return await chooseMove(battleId, trainerId, request);
    }

    async chooseSwitch(battleId, trainerId, pokemonId) {
        return await chooseSwitch(battleId, trainerId, pokemonId);
    }

    async getStats(battleId, trainerId) {
        return await getStats(battleId, trainerId);
    }

    async forfeit(battleId, trainerId) {
        return await forfeit(battleId, trainerId);
    }
}