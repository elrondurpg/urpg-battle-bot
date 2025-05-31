import * as DISCORD from "../../discord-gateway.js";

export async function read(guildId) {
    const channelsEndpoint = `/guilds/${guildId}/channels`;
    let channelsResponse = await DISCORD.get(channelsEndpoint);
    return await channelsResponse.json();
}