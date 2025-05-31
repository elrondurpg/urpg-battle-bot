import { InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions';
import { getDiscordInteractionRoute } from '../../discord/router.js';

export function registerInteractionsResource(expressApp) {
    expressApp.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), handle);
}

async function handle(req, res) {
    let route = getDiscordInteractionRoute(req);
    if (route) {
        return await route(req, res);
    }
    else {
        return res.send({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
    }
}