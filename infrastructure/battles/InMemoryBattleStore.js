import { BattleIdCollisionError } from "../../entities/battles.js";


export class InMemoryBattleStore {
    _battles = new Map();

    get(id) {
        return this._battles.get(BigInt(id));
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
}