import * as DISCORD from "../../discord-gateway.js";
export async function update(appId, commands) {
    const endpoint = `applications/${appId}/commands`;

    try {
        await DISCORD.put(endpoint, commands);
    } catch (err) {
        if (err.message.includes("You are being rate limited.")) {
            let error = JSON.parse(err.message);
            setTimeout(function () { update(appId, commands) }, error.retry_after * 1000);
        }
        else throw err;
    }
}