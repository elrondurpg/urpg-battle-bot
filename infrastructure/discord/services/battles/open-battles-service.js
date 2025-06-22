import { capitalize, shorten } from "../../../../utils.js";
import { CONFIG_DATA, CONSUMER_DATA, DISCORD_GUILD_CHANNELS_SERVICE } from "../../../app/dependency-injection.js";
import { createSynchronousMessage, deleteSynchronousMessage, editSynchronousMessage } from "../channels/synchronous-messages-service.js";
import { DiscordConstants } from '../../discord-constants.js';

const _lastMessageByConsumerId = new Map();
const _openBattlesByConsumerId = new Map();

export async function init(rooms) {
    let consumerIds = new Set();

    for (let room of rooms) {
        if (room.getNumPlayersNeeded() > 0) {
            let consumerId = room.consumerId;
            consumerId.add(consumerId);

            if (!_openBattlesByConsumerId.get(consumerId)) {
                _openBattlesByConsumerId.set(consumerId, []);
            }
            _openBattlesByConsumerId.get(consumerId).push(room);
        }
    }

    // Performance of this loop could be improved by instead 
    // getting the consumer IDs of all guilds first
    // and putting them into a map by guildId

    for(let consumerId of consumerIds) {
        let battleSearchChannelName = await getBattleSearchChannelNameByConsumerId(consumerId);
        let consumer = await CONSUMER_DATA.getById(consumerId);
        let guildId = consumer.platformSpecificId;
        let battleSearchChannel = await getBattleSearchChannelForGuild(guildId, battleSearchChannelName);
        let content = await buildOpenBattleMessageForConsumer(consumerId);
        let message = await createSynchronousMessage(battleSearchChannel.id, content);
        _lastMessageByConsumerId.set(consumerId, message.id);
    }
}

export async function createOpenBattleMessage(room) {
    let consumerId = room.consumerId;

    if (!_openBattlesByConsumerId.get(consumerId)) {
        _openBattlesByConsumerId.set(consumerId, []);
    }
    _openBattlesByConsumerId.get(consumerId).push(room);

    let battleSearchChannelName = await getBattleSearchChannelNameByConsumerId(consumerId);
    let consumer = await CONSUMER_DATA.getById(consumerId);
    let guildId = consumer.platformSpecificId;
    let battleSearchChannel = await getBattleSearchChannelForGuild(guildId, battleSearchChannelName);
    if (_lastMessageByConsumerId.get(consumerId)) {
        await deleteSynchronousMessage(battleSearchChannel.id, _lastMessageByConsumerId.get(consumerId));
        _lastMessageByConsumerId.delete(consumerId);
    }

    let content = await buildOpenBattleMessageForConsumer(consumerId);
    let message = await createSynchronousMessage(battleSearchChannel.id, content);
    _lastMessageByConsumerId.set(consumerId, message.id);
}

export async function deleteOpenBattleMessage(room) {
    let consumerId = room.consumerId;
    let lastMessageId = _lastMessageByConsumerId.get(consumerId);
    if (lastMessageId) {
        let battleSearchChannelName = await getBattleSearchChannelNameByConsumerId(consumerId);
        let consumer = await CONSUMER_DATA.getById(consumerId);
        let guildId = consumer.platformSpecificId;
        let battleSearchChannel = await getBattleSearchChannelForGuild(guildId, battleSearchChannelName);
        if (_openBattlesByConsumerId.get(consumerId)) {
            _openBattlesByConsumerId.set(consumerId, _openBattlesByConsumerId.get(consumerId).filter(knownRoom => knownRoom.id != room.id));
        }
        if (_openBattlesByConsumerId.get(consumerId).length > 0) {
            let content = await buildOpenBattleMessageForConsumer(consumerId);
            await editSynchronousMessage(battleSearchChannel.id, lastMessageId, content);
        }
        else {
            await editSynchronousMessage(battleSearchChannel.id, lastMessageId, "There are no battles waiting for players! Use \`/create-battle\` to create your own!");
            _lastMessageByConsumerId.delete(consumerId);
            _openBattlesByConsumerId.delete(consumerId);
        }
    }
}

async function buildOpenBattleMessageForConsumer(consumerId) {
    let message = "***Players Looking for Opponents***\n";
    for (let battle of _openBattlesByConsumerId.get(consumerId)) {
        let battleMessage = getBattleMessage(battle);
        if (battleMessage) {
            message += battleMessage;
        }
    }
    return message;
}

function getBattleMessage(room) {
    if (room.getNumPlayersNeeded() > 0) {
        let owner = shorten(Array.from(room.trainers.values()).find(trainer => room.ownerId == trainer.id).name);
        let generation = capitalize(room.rules.generation);
        let sendType = capitalize(room.rules.sendType);
        let teamType = capitalize(room.rules.teamType);
        let battleType = capitalize(room.rules.battleType);
        let rules = shorten(`${room.rules.numPokemonPerTrainer}v${room.rules.numPokemonPerTrainer} ${generation} ${sendType} ${teamType} ${battleType}\n`);
        return `${owner} ${rules} <#${room.options["discordThreadId"]}>\n`;
    }
}

async function getBattleSearchChannelNameByConsumerId(consumerId) {
    return await CONFIG_DATA.get(consumerId, DiscordConstants.BATTLE_SEARCH_CHANNEL_NAME_PROPERTY_NAME);
}

async function getBattleSearchChannelForGuild(guildId, channelName) {
    let channels = await DISCORD_GUILD_CHANNELS_SERVICE.getAll(guildId);
    return channels.find(channel => channel.name == channelName);
}