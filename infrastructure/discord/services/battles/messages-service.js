import { DISCORD_CHANNELS_MESSAGES_SERVICE } from "../../../app/dependency-injection.js";

export async function create(room, message) {
    await DISCORD_CHANNELS_MESSAGES_SERVICE.create(room.options["discordThreadId"], message);
}