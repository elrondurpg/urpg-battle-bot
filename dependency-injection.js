import { InMemoryBattleStore } from "./infrastructure/battles/InMemoryBattleStore.js";
import { BattleService } from "./domain/battles/BattleService.js";
import { TestBattleStore } from "./infrastructure/battles/TestBattleStore.js";
import { DiscordMessageService } from "./infrastructure/messages/message-service.js";
export const BATTLE_DATA = process.env.USE_TEST_DATA == 'true'
    ? new TestBattleStore()
    : new InMemoryBattleStore();
export const BATTLE_SERVICE = new BattleService();
export const MESSAGE_SERVICE = new DiscordMessageService();