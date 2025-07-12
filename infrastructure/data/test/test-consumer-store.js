import { Consumer } from "../../../models/consumer.js";
import { DISCORD_PLATFORM_NAME } from "../../discord/discord-constants.js";

export class TestConsumerStore {
    _consumersById = new Map();
    _consumersByPlatformName = new Map();

    constructor() {
        const consumer = new Consumer();
        consumer.id = 1;
        consumer.platformId = 1;
        consumer.platform = DISCORD_PLATFORM_NAME;
        consumer.platformSpecificId = process.env.TEST_GUILD_ID;
        consumer.numCompletedBattles = 0;

        this._consumersById.set(consumer.id, consumer);
        this._consumersByPlatformName.set(DISCORD_PLATFORM_NAME, new Map());
        this._consumersByPlatformName.get(DISCORD_PLATFORM_NAME).set(consumer.platformSpecificId, consumer);
    }

    async getById(consumerId) {
        return this._consumersById.get(consumerId);
    }
        
    async getByPlatformAndPlatformSpecificId(platformName, platformSpecificId) {
        return this._consumersByPlatformName.get(platformName).get(platformSpecificId);
    }

    async incrementNumCompletedBattles(consumerId) {
        const consumer = this._consumersById.get(consumerId);
        consumer.numCompletedBattles++;
        return consumer;
    }
}