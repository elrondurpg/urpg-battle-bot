import * as DISCORD from "../../discord-gateway.js";

export async function create(channelId, name) {
    const threadEndpoint = `/channels/${channelId}/threads`;
    const body = { 
            name: name, 
            type: 11 
    };
    return await DISCORD.post(threadEndpoint, body);
}

export async function getAll(channelId) {
    const endpoint = `/channels/${channelId}/archived/public`;
    return await DISCORD.get(endpoint);
}