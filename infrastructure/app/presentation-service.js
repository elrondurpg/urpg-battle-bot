import { DiscordConstants } from "../discord/discord-constants.js";
import { DISCORD_PRESENTATION_SERVICE } from "../discord/discord-presentation-service.js";

export * as PRESENTATION_SERVICE from "./presentation-service.js";

export async function doWin(battleCompletion) {
    switch(battleCompletion.platform) {
        case DiscordConstants.DISCORD_PLATFORM_NAME: await DISCORD_PRESENTATION_SERVICE.doWin(battleCompletion); return;
    }
}