import { DiscordRequest } from "../../utils.js";

async function sendTextMessage(channelId, content) {
    const endpoint = `/channels/${channelId}/messages`
    const options = {
        method: 'POST',
        body: { 
            content: content
        }
    }
    return await DiscordRequest(endpoint, options);
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

let firstItem;
let lastItem;

export class DiscordMessageService {

    async sendMessage(message, options) {
        let item = { message: message, threadId: options.threadId };
        if (!firstItem) {
            firstItem = item;
            lastItem = firstItem;
            setTimeout(clearQueue, 0);
        }
        else {
            lastItem.next = item;
            lastItem = item;
        }
    }
}
    
async function clearQueue() {
    try {
        let response = await sendTextMessage(firstItem.threadId, firstItem.message);
        let headers = response.headers;
        let remaining = headers.get("X-RateLimit-Remaining");
        let resetAfter = headers.get("X-RateLimit-Reset-After");
        let wait = 500;
        if (remaining == 0) {
            wait = resetAfter * 1000 + 1;
        }
        if (firstItem.next != undefined) {
            firstItem = firstItem.next;
            setTimeout(clearQueue, wait);
        }
        else { 
            firstItem = undefined;
            lastItem = undefined;
        }
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            setTimeout(clearQueue, error.retry_after * 1000);
        }
        else throw err;
    }
}