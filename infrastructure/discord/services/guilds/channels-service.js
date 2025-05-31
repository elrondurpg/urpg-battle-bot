import * as DISCORD from "../../rest-gateway.js";

export async function read(guildId) {
    const channelsEndpoint = `/guilds/${guildId}/channels`;
    let channelsResponse = await DISCORD.get(channelsEndpoint);
    return await channelsResponse.json();
}