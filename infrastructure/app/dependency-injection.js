import { MySqlBattleStore } from "../data/mysql/mysql-battle-store.js";

import * as MYSQL_CONFIG_DATA from "../data/mysql/mysql-consumer-properties-store.js";
import { TestConsumerPropertiesStore } from "../data/test/test-consumer-properties-store.js";
export const CONFIG_DATA = process.env.USE_TEST_DATA === 'true' ? new TestConsumerPropertiesStore() : MYSQL_CONFIG_DATA;

import * as MYSQL_CONSUMER_DATA from "../data/mysql/mysql-consumer-store.js";
import { TestConsumerStore } from "../data/test/test-consumer-store.js";
export const CONSUMER_DATA = process.env.USE_TEST_DATA === 'true' ? new TestConsumerStore() : MYSQL_CONSUMER_DATA;

import { TestBattleStore } from "../data/test/test-battle-store.js";
import { BattleRoomService } from "../../domain/battles/battle-room-service.js";
export const BATTLE_ROOM_DATA = getBattleStore();
export const BATTLE_ROOM_SERVICE = new BattleRoomService();

export * as INACTIVE_BATTLES_JOB from "../discord/jobs/inactive-battles-job.js";
export * as OPEN_BATTLES_SERVICE from "../discord/services/battles/open-battles-service.js";
export * as PLAYER_EXPECTED_ACTION_SERVICE from "../discord/services/battles/player-expected-actions-service.js";

export * as DISCORD_APPLICATION_COMMANDS_SERVICE from "../discord/services/applications/commands-service.js";
export * as DISCORD_CHANNELS_MESSAGES_SERVICE from "../discord/services/channels/messages-service.js";
export * as DISCORD_CHANNELS_SYNCHRONOUS_MESSAGES_SERVICE from "../discord/services/channels/synchronous-messages-service.js";
export * as DISCORD_CHANNELS_THREADS_SERVICE from "../discord/services/channels/threads-service.js";
export * as DISCORD_GUILD_CHANNELS_SERVICE from "../discord/services/guilds/channels-service.js";
import * as discordServicesBattlesMessageService from "../discord/services/battles/messages-service.js";
import * as discordServicesBattlesSynchronousMessagesService from "../discord/services/battles/synchronous-messages-service.js";
import * as testMessageService from "../../test/TestMessageService.js";
export let BATTLES_MESSAGES_SERVICE;
if (process.env.USE_TEST_MESSAGES === 'true') {
    BATTLES_MESSAGES_SERVICE = testMessageService;
}
else {
    BATTLES_MESSAGES_SERVICE = discordServicesBattlesMessageService;
}
export let BATTLES_SYNCHRONOUS_MESSAGES_SERVICE;
if (process.env.USE_TEST_MESSAGES === 'true') {
    BATTLES_SYNCHRONOUS_MESSAGES_SERVICE = testMessageService;
}
else {
    BATTLES_SYNCHRONOUS_MESSAGES_SERVICE = discordServicesBattlesSynchronousMessagesService;
}

export * as BATTLE_SERVICE from "../showdown/services/battles/battle-service.js";

export * as SPECIES_SERVICE from "../showdown/services/dex/species-service.js";
export * as ABILITY_SERVICE from "../showdown/services/dex/ability-service.js";
export * as ITEM_SERVICE from "../showdown/services/dex/item-service.js";
export * as MOVE_SERVICE from "../showdown/services/dex/move-service.js";
export * as TYPE_SERVICE from "../showdown/services/dex/type-service.js";

function getBattleStore() {
    if (process.env.USE_TEST_DATA === 'true') {
        return new TestBattleStore();
    }
    else {
        return new MySqlBattleStore();
    }
}