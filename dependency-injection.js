import { BattleService } from "./domain/battles/BattleService.js";
import { TestBattleStore } from "./infrastructure/data/TestBattleStore.js";
import { DiscordMessageService } from "./infrastructure/discord/DiscordMessageService.js";
import * as config from "./config.js";
import { MySqlBattleStore } from "./infrastructure/data/MySqlBattleStore.js";
export const BATTLE_DATA = getBattleStore();
export const BATTLE_SERVICE = new BattleService();
export const MESSAGE_SERVICE = new DiscordMessageService();
export const CONFIG_SERVICE = config;

function getBattleStore() {
    if (process.env.USE_TEST_DATA === 'true') {
        return new TestBattleStore();
    }
    else {
        return new MySqlBattleStore();
    }
}