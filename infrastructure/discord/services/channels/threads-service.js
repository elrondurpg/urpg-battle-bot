import * as DISCORD from "../../rest-gateway.js";

export async function create(channelId, name) {
    const threadEndpoint = `/channels/${channelId}/threads`;
    const body = { 
            name: name, 
            type: 11 
    };
    const threadResponse = await DISCORD.post(threadEndpoint, body);
    return await threadResponse.json();
}