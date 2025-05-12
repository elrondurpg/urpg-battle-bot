import { BATTLE_SERVICE, CONFIG_SERVICE, MESSAGE_SERVICE } from "../../dependency-injection.js";
import { capitalize, DiscordRequest } from "../../utils.js";

export async function sendOpenBattlesHeartbeat() {
    let message = "***Players Looking for Opponents***\n";
    let battles = await BATTLE_SERVICE.getAll();
    let battlesByGuild = new Map();
    for (let [id, battle] of battles) {
        let guild = battle.options["discordGuildId"];
        if (guild) {
            if (!battlesByGuild.has(guild)) {
                battlesByGuild.set(guild, []);
            }
            battlesByGuild.get(guild).push(battle);
        }
    }

    for (let guild of battlesByGuild.keys()) {
        let found = false;
        for (let battle of battlesByGuild.get(guild)) {
            if (!battle.started && !battle.ended && battle.getNumPlayersNeeded() > 0) {
                found = true;
                let owner = shorten(Array.from(battle.trainers.values()).find(trainer => battle.ownerId == trainer.id).name);
                let generation = capitalize(battle.rules.generation);
                let sendType = capitalize(battle.rules.sendType);
                let teamType = capitalize(battle.rules.teamType);
                let battleType = capitalize(battle.rules.battleType);
                let rules = shorten(`${battle.rules.numPokemonPerTrainer}v${battle.rules.numPokemonPerTrainer} ${generation} ${sendType} ${teamType} ${battleType}\n`);
                message += `${owner} ${rules} <#${battle.options["discordThreadId"]}>\n`;
            }
        }

        const channelsEndpoint = `/guilds/${guild}/channels`;
        const channelsOptions = {
            method: 'GET'
        }
        let channelsResponse = await DiscordRequest(channelsEndpoint, channelsOptions);
        let channels = await channelsResponse.json();
        let battleSearchChannel = channels.find(channel => channel.name == CONFIG_SERVICE.getBattleSearchChannelName());

        if (found && battleSearchChannel) {
            const messageOptions = {
                threadId: battleSearchChannel.id
            }
            MESSAGE_SERVICE.sendMessageWithOptions(message, messageOptions);
        }
    }
}

function shorten(s) {
    if (s) {
        if (s.length > 20) {
            return s.substr(0, 17) + "...";
        }
        else {
            for (let i = s.length; i < 20; i++) {
                s = s.concat(" ");
            }
            return s;
        }
    }
}