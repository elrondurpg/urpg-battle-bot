import * as DISCORD from "../../discord-gateway.js";

const firstItems = new Map();
const lastItems = new Map();

export async function create(channelId, message) {
    let item = { message: message, channelId: channelId };
    if (!firstItems.get(channelId)) {
        firstItems.set(channelId, item);
        lastItems.set(channelId, item);
        setTimeout(function() {
            sendNextMessage(channelId);
        }, 0);
    }
    else {
        lastItems.get(channelId).next = item;
        lastItems.set(channelId, item);
    }
}
    
async function sendNextMessage(channelId) {
    try {
        let firstItem = firstItems.get(channelId);
        let response = await sendTextMessage(firstItem.channelId, firstItem.message);
        let headers = response.headers;
        let remaining = headers.get("X-RateLimit-Remaining");
        let resetAfter = headers.get("X-RateLimit-Reset-After");
        let wait = 500;
        if (remaining == 0) {
            wait = resetAfter * 1000 + 1;
        }
        if (firstItem.next != undefined) {
            firstItems.set(channelId, firstItem.next);
            setTimeout(function() {
                sendNextMessage(channelId);
            }, wait);
        }
        else { 
            firstItems.delete(channelId);
            lastItems.delete(channelId);
        }
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            setTimeout(function() {
                sendNextMessage(channelId);
            }, error.retry_after * 1000);
        }
        else throw err;
    }
}

async function sendTextMessage(channelId, content) {
    const endpoint = `/channels/${channelId}/messages`
    const body = {
        content: content
    }
    return await DISCORD.post(endpoint, body);
}