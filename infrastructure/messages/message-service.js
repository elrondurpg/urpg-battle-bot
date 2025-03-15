import { DiscordRequest } from "../../utils.js";

export async function sendTextMessage(channelId, content) {
    const endpoint = `/channels/${channelId}/messages`
    const options = {
        method: 'POST',
        body: { 
            content: content
        }
    }
    const response = await DiscordRequest(endpoint, options);
    return await response.json();
}

export async function editMessageWithFollowup(token, data) {
    const endpoint = `/webhooks/${process.env.APP_ID}/${token}/messages/@original`;
    const options = {
        method: 'PATCH',
        body: data
    }
    const response = await DiscordRequest(endpoint, options);
    return await response.json();
}