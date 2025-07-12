export class TestConsumerPropertiesStore {
    _propertiesByConsumerId = new Map();

    constructor() {
        this._propertiesByConsumerId.set(1, new Map());
        this._propertiesByConsumerId.get(1).set("battleSearchChannelName", "📢battle-search");
        this._propertiesByConsumerId.get(1).set("battleThreadTag", "battle-room-");
        this._propertiesByConsumerId.get(1).set("refLogChannelName", "referee-logs");
        this._propertiesByConsumerId.get(1).set("refLogThreadName", "URPG Battle Bot Logs");
    }

    async get(consumerId, propertyName) {
        return this._propertiesByConsumerId.get(consumerId).get(propertyName);
    }
}