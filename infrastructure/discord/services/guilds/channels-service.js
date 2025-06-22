import * as DISCORD from "../../discord-gateway.js";

export async function getAll(guildId) {
    const channelsEndpoint = `/guilds/${guildId}/channels`;
    return await DISCORD.get(channelsEndpoint);
}