import { BATTLE_ROOM_DATA, BATTLE_ROOM_SERVICE } from "../../app/dependency-injection.js"

export function register() {
    setInterval(run, 43200000);
}

async function run() {
    let rooms = await BATTLE_ROOM_SERVICE.getAll();
    let roomsByGuild = new Map();
    for (let [id, room] of rooms) {
        let guild = room.options["discordGuildId"];
        if (guild) {
            if (!roomsByGuild.has(guild)) {
                roomsByGuild.set(guild, []);
            }
            roomsByGuild.get(guild).push(room);
        }
    }

    for (let guild of roomsByGuild.keys()) {
        for (let room of roomsByGuild.get(guild)) {
            let now = process.hrtime.bigint();
            
            if (now - room.lastActionTime > BigInt(parseInt(process.env.ARCHIVE_BATTLE_TIMEOUT) * 1000000)) {
                BATTLE_ROOM_DATA.archive(room);
            }
        }
    }
}