import * as DISCORD from "../../discord-gateway.js";

export async function read(guildId) {
    const channelsEndpoint = `/guilds/${guildId}/channels`;
    return await DISCORD.get(channelsEndpoint);
}