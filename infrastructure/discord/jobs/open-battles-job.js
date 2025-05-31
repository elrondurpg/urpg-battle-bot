import { BATTLE_ROOM_SERVICE, CONFIG_SERVICE, DISCORD_GUILD_CHANNELS_SERVICE, DISCORD_CHANNELS_MESSAGES_SERVICE } from "../../app/dependency-injection.js";
import { capitalize, shorten } from "../../../utils.js";

export function register() {
    setInterval(run, process.env.OPEN_BATTLE_TIMEOUT);
}

async function run() {
    let battles = await BATTLE_ROOM_SERVICE.getAll();
    let battlesByGuild = mapBattlesByGuild(battles);

    for (let guildId of battlesByGuild.keys()) {
        sendOpenBattleMessageForGuild(guildId, battlesByGuild)
    }
}

function mapBattlesByGuild(battles) {
    let battlesByGuild = new Map();
    for (let [id, battle] of battles) {
        let guildId = battle.options["discordGuildId"];
        if (guildId) {
            if (!battlesByGuild.has(guildId)) {
                battlesByGuild.set(guildId, []);
            }
            battlesByGuild.get(guildId).push(battle);
        }
    }
    return battlesByGuild;
}

async function sendOpenBattleMessageForGuild(guildId, battlesByGuild) {
    let message = "***Players Looking for Opponents***\n";
    let found = false;
    for (let battle of battlesByGuild.get(guildId)) {
        let battleMessage = getBattleMessage(battle);
        if (battleMessage) {
            found = true;
            message += battleMessage;
        }
    }

    let battleSearchChannel = await getBattleSearchChannel(guildId);

    if (found && battleSearchChannel) {
        DISCORD_CHANNELS_MESSAGES_SERVICE.create(battleSearchChannel.id, message);
    }
}

function getBattleMessage(battle) {
    if (battle.getNumPlayersNeeded() > 0) {
        let owner = shorten(Array.from(battle.trainers.values()).find(trainer => battle.ownerId == trainer.id).name);
        let generation = capitalize(battle.rules.generation);
        let sendType = capitalize(battle.rules.sendType);
        let teamType = capitalize(battle.rules.teamType);
        let battleType = capitalize(battle.rules.battleType);
        let rules = shorten(`${battle.rules.numPokemonPerTrainer}v${battle.rules.numPokemonPerTrainer} ${generation} ${sendType} ${teamType} ${battleType}\n`);
        return `${owner} ${rules} <#${battle.options["discordThreadId"]}>\n`;
    }
}

async function getBattleSearchChannel(guildId) {
    let channels = await DISCORD_GUILD_CHANNELS_SERVICE.read(guildId);
    return channels.find(channel => channel.name == CONFIG_SERVICE.getBattleSearchChannelName());
}