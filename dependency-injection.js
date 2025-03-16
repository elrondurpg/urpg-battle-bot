import { InMemoryBattleStore } from "./infrastructure/battles/InMemoryBattleStore.js";
import { BattleService } from "./domain/battles/battleService.js";
import { TestBattleStore } from "./infrastructure/battles/TestBattleStore.js";
export const BATTLE_DATA = process.env.USE_TEST_DATA 
    ? new TestBattleStore()
    : new InMemoryBattleStore();
export const BATTLE_SERVICE = new BattleService();