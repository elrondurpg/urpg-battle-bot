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

async function editMessageWithFollowup(token, originalMessageId, data) {
    const endpoint = `/webhooks/${process.env.APP_ID}/${token}/messages/${originalMessageId}`;
    const options = {
        method: 'PATCH',
        body: data
    }
    const response = await DiscordRequest(endpoint, options);
    return await response.json();
}

let firstItems = new Map();
let lastItems = new Map();

export class DiscordMessageService {

    async sendMessage(message, options) {
        let item = { message: message, threadId: options.threadId, type: 'create' };
        if (!firstItems.get(options.threadId)) {
            firstItems.set(options.threadId, item);
            lastItems.set(options.threadId, item);
            setTimeout(function() {
                clearQueue(options.threadId);
            }, 0);
        }
        else {
            lastItems.get(options.threadId).next = item;
            lastItems.set(options.threadId, item);
        }
    }
}
    
async function clearQueue(threadId) {
    try {
        let response;
        let firstItem = firstItems.get(threadId);
        if (firstItem.type == 'create') {
            response = await sendTextMessage(firstItem.threadId, firstItem.message);
        }
        let headers = response.headers;
        let remaining = headers.get("X-RateLimit-Remaining");
        let resetAfter = headers.get("X-RateLimit-Reset-After");
        let wait = 500;
        if (remaining == 0) {
            wait = resetAfter * 1000 + 1;
        }
        if (firstItem.next != undefined) {
            firstItems.set(threadId, firstItem.next);
            setTimeout(function() {
                clearQueue(threadId);
            }, wait);
        }
        else { 
            firstItems.delete(threadId);
            lastItems.delete(threadId);
        }
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            setTimeout(function() {
                clearQueue(threadId);
            }, error.retry_after * 1000);
        }
        else throw err;
    }
}