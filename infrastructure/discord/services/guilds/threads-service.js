import * as DISCORD from "../../discord-gateway.js";

export * as DISCORD_GUILDS_THREADS_SERVICE from "./threads-service.js";

export async function getAll(guildId) {
    const endpoint = `/guilds/${guildId}/threads/active`;
    return await DISCORD.get(endpoint);
}