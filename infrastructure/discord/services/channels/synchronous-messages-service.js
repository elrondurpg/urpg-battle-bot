import * as DISCORD from "../../discord-gateway.js";

export async function createSynchronousMessage(channelId, content) {
    try {
        return await sendTextMessage(channelId, content);
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            return await setTimeout(async function() {
                return await create(channelId, content);
            }, error.retry_after * 1000);
        }
        if (err.message.includes("Unknown Channel")) {
            console.log("ERROR: attempted to send a message in an unknown channel: " + channelId);
        }
        else throw err;
    }
}

export async function editSynchronousMessage(channelId, messageId, content) {
    const endpoint = `/channels/${channelId}/messages/${messageId}`;
    const body = {
        content: content
    }
    return await DISCORD.patch(endpoint, body);
}

export async function deleteSynchronousMessage(channelId, messageId) {
    const endpoint = `/channels/${channelId}/messages/${messageId}`;
    return await DISCORD.del(endpoint);
}

async function sendTextMessage(channelId, content) {
    const endpoint = `/channels/${channelId}/messages`;
    const body = {
        content: content
    }
    return await DISCORD.post(endpoint, body);
}