import { DiscordRequest } from "../../utils.js";

export async function createPublicThread(parentChannelId, name) {
    const threadEndpoint = `/channels/${parentChannelId}/threads`;
    const options = {
        method: 'POST',
        body: { 
            name: name, 
            type: 11 
        }
    }
    const threadResponse = await DiscordRequest(threadEndpoint, options);
    return await threadResponse.json();
}