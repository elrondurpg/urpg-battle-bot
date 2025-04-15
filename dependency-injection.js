import { InMemoryBattleStore } from "./infrastructure/data/InMemoryBattleStore.js";
import { BattleService } from "./domain/battles/BattleService.js";
import { TestBattleStore } from "./infrastructure/data/TestBattleStore.js";
import { DiscordMessageService } from "./infrastructure/discord/message-service.js";
export const BATTLE_DATA = process.env.USE_TEST_DATA == 'true'
    ? new TestBattleStore()
    : new InMemoryBattleStore();
export const BATTLE_SERVICE = new BattleService();
export const MESSAGE_SERVICE = new DiscordMessageService();