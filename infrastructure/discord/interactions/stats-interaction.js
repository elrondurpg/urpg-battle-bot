import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import * as ValidationRules from '../../../utils/ValidationRules.js';
import { BATTLE_THREAD_TAG } from "../../../constants.js";
import { BATTLE_ROOM_SERVICE } from '../../app/dependency-injection.js';
import { BadRequestError } from "../../../utils/BadRequestError.js";
import { getInvalidChannelMessage } from "../utils.js";

export const displayStats = (req, res) => {
    return displayDiscordStats(req, res);
}

async function displayDiscordStats(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const roomId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let stats = await BATTLE_ROOM_SERVICE.getStats(roomId, userId);
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: stats
            }
        });
    } catch (err) {
        if (err instanceof BadRequestError) {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.EPHEMERAL,
                    content: err.message
                }
            });
        }
        console.log(err);
    }
}