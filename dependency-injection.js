import { InMemoryBattleStore } from "./infrastructure/battles/InMemoryBattleStore.js";
import { BattleService } from "./domain/battles/battleService.js";
export const BATTLE_DATA = new InMemoryBattleStore();
export const BATTLE_SERVICE = new BattleService();