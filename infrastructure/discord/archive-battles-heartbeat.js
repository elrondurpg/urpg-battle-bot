import { BATTLE_DATA, BATTLE_SERVICE } from "../../dependency-injection.js";

export async function sendArchiveBattlesHeartbeat() {
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
        for (let battle of battlesByGuild.get(guild)) {
            let now = process.hrtime.bigint();
            
            if (now - battle.lastAction > BigInt(parseInt(process.env.ARCHIVE_BATTLE_TIMEOUT) * 1000000)) {
                BATTLE_DATA.archive(battle);
            }
        }
    }
}