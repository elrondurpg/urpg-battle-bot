import { MySqlBattleStore } from "../data/MySqlBattleStore.js";
import { TestBattleStore } from "../data/TestBattleStore.js";
import * as config from "../../config.js";
import { BattleRoomService } from "../../domain/battles/battle-room-service.js";
export const BATTLE_ROOM_DATA = getBattleStore();
export const BATTLE_ROOM_SERVICE = new BattleRoomService();
export const CONFIG_SERVICE = config;

export * as INACTIVE_BATTLES_JOB from "../discord/jobs/inactive-battles-job.js";
export * as OPEN_BATTLES_JOB from "../discord/jobs/open-battles-job.js";

export * as DISCORD_APPLICATION_COMMANDS_SERVICE from "../discord/services/applications/commands-service.js";
export * as DISCORD_CHANNELS_MESSAGES_SERVICE from "../discord/services/channels/messages-service.js";
export * as DISCORD_CHANNELS_THREADS_SERVICE from "../discord/services/channels/threads-service.js";
export * as DISCORD_GUILD_CHANNELS_SERVICE from "../discord/services/guilds/channels-service.js";
import * as discordServicesBattlesMessageService from "../discord/services/battles/messages-service.js";
import * as testMessageService from "../../test/TestMessageService.js";
export let BATTLES_MESSAGES_SERVICE;
if (process.env.USE_TEST_MESSAGES === 'true') {
    BATTLES_MESSAGES_SERVICE = testMessageService;
}
else {
    BATTLES_MESSAGES_SERVICE = discordServicesBattlesMessageService;
}

export * as BATTLE_SERVICE from "../showdown/services/battles/battle-service.js";

export * as SPECIES_SERVICE from "../showdown/services/dex/species-service.js";
export * as ABILITY_SERVICE from "../showdown/services/dex/ability-service.js";
export * as ITEM_SERVICE from "../showdown/services/dex/item-service.js";
export * as MOVE_SERVICE from "../showdown/services/dex/move-service.js";
export * as TYPE_SERVICE from "../showdown/services/dex/type-service.js";
export * as BATTLES_POKEMON_SERVICE from "../showdown/services/battles/pokemon/pokemon-service.js";

function getBattleStore() {
    if (process.env.USE_TEST_DATA === 'true') {
        return new TestBattleStore();
    }
    else {
        return new MySqlBattleStore();
    }
}