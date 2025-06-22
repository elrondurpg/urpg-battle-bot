import { DISCORD_REF_LOG_SERVICE } from "./services/guilds/discord-ref-log-service.js";

export * as DISCORD_PRESENTATION_SERVICE from "./discord-presentation-service.js";

export async function doWin(battleCompletion) {
    await DISCORD_REF_LOG_SERVICE.create(battleCompletion);
}