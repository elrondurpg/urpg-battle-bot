import * as DISCORD from "../../discord-gateway.js";

export async function createSynchronousMessage(channelId, message) {
    try {
        return await sendTextMessage(channelId, message);
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            return await setTimeout(async function() {
                return await create(channelId, message);
            }, error.retry_after * 1000);
        }
        if (err.message.includes("Unknown Channel")) {
            console.log("ERROR: attempted to send a message in an unknown channel: " + channelId);
        }
        else throw err;
    }
}

export async function deleteSynchronousMessage(channelId, messageId) {
    const endpoint = `/channels/${channelId}/messages/${messageId}`;
    return await DISCORD.del(endpoint);
}

async function sendTextMessage(channelId, content) {
    const endpoint = `/channels/${channelId}/messages`
    const body = {
        content: content
    }
    return await DISCORD.post(endpoint, body);
}