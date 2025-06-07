import { DISCORD_CHANNELS_SYNCHRONOUS_MESSAGES_SERVICE } from "../../../app/dependency-injection.js";

export async function create(room, message) {
    return await DISCORD_CHANNELS_SYNCHRONOUS_MESSAGES_SERVICE.createSynchronousMessage(room.options["discordThreadId"], message);
}