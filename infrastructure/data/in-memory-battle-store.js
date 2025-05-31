import { BattleIdCollisionError } from "../../models/battle-room.js";
import * as Showdown from "urpg-battle-bot-calc";


export class InMemoryBattleStore {
    _battles = new Map();

    get(id) {
        return this._battles.get(BigInt(id));
    }

    getAll() {
        return this._battles;
    }
    
    create(battle) {
        battle.id = process.hrtime.bigint();
        if (!this._battles.get(battle.id)) {
            this._battles.set(battle.id, battle);
        }
        else {
            throw new BattleIdCollisionError();
        }
        return battle;
    }

    save(battle) {
        return battle;
    }

    saveAll() {
        let showdown = Showdown;
        for (let [id, battle] of this._battles) {
            console.log(battle);
        }
    }

    delete(battle) {
        this._battles.delete(battle.id);
    }
}