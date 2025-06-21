import { DISCORD_CHANNELS_MESSAGES_SERVICE } from "../../../app/dependency-injection.js";
import * as DISCORD from "../../discord-gateway.js";

const _waitsByChannelId = new Map();

export async function createSynchronousMessage(channelId, content) {
    try {
        if (DISCORD_CHANNELS_MESSAGES_SERVICE.next(channelId)) {
            return new Promise((res, rej) => {
                setTimeout(async function() {
                    res(await createSynchronousMessage(channelId, content));
                }, 500);
            });
        }
        else {
            let response = await sendTextMessage(channelId, content);
            return response;
        }
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            return new Promise((res, rej) => {
                setTimeout(async function() {
                    res(await createSynchronousMessage(channelId, content));
                }, error.retry_after * 1000);
            });
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