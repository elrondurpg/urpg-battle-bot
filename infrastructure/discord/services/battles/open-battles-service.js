import { capitalize, shorten } from "../../../../utils.js";
import { CONFIG_SERVICE, DISCORD_GUILD_CHANNELS_SERVICE } from "../../../app/dependency-injection.js";
import { createSynchronousMessage, deleteSynchronousMessage } from "../channels/synchronous-messages-service.js";

const _lastMessageByGuildId = new Map();
const _openBattlesByGuildId = new Map();

export function init(guildId, rooms) {

}

export async function createOpenBattleMessage(room) {
    let guildId = room.options['discordGuildId'];

    if (!_openBattlesByGuildId.get(guildId)) {
        _openBattlesByGuildId.set(guildId, []);
    }
    _openBattlesByGuildId.get(guildId).push(room);

    let battleSearchChannel = await getBattleSearchChannel(guildId);
    if (_lastMessageByGuildId.get(guildId)) {
        await deleteSynchronousMessage(battleSearchChannel.id, _lastMessageByGuildId.get(guildId));
        _lastMessageByGuildId.delete(guildId);
    }

    let content = await getOpenBattleMessageForGuild(guildId);
    let response = await createSynchronousMessage(battleSearchChannel.id, content);
    let message = await response.json();
    _lastMessageByGuildId.set(guildId, message.id);
}

export function del(room) {
    let guildId = room.options['discordGuildId'];
    if (_lastMessageByGuildId.get(guildId)) {
        
    }
}

async function getOpenBattleMessageForGuild(guildId) {
    let message = "***Players Looking for Opponents***\n";
    for (let battle of _openBattlesByGuildId.get(guildId)) {
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

async function getBattleSearchChannel(guildId) {
    let channels = await DISCORD_GUILD_CHANNELS_SERVICE.read(guildId);
    return channels.find(channel => channel.name == CONFIG_SERVICE.getBattleSearchChannelName());
}