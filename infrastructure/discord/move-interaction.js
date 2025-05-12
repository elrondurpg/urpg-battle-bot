import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import { getOptionValue } from "../../commands.js";
import { BATTLE_THREAD_TAG } from "../../constants.js";
import { BATTLE_SERVICE } from "../../dependency-injection.js";
import * as ValidationRules from '../../utils/ValidationRules.js';
import { BadRequestError } from "../../utils/BadRequestError.js";
import { ChooseMoveRequest } from "../../domain/battles/ChooseMoveRequest.js";

export const chooseMove = (req, res) => {
    return chooseDiscordMove(req, res);
}

async function chooseDiscordMove(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let options = req.body.data.options;
        let request = new ChooseMoveRequest();
        request.move = getOptionValue(options, "move");
        request.shouldDynamax = getOptionValue(options, "dynamax");
        request.shouldMegaEvolve = getOptionValue(options, "mega-evolve");
        request.shouldUltraBurst = getOptionValue(options, "ultra-burst");
        request.shouldTerastallize = getOptionValue(options, "terastallize");
        request.shouldZMove = getOptionValue(options, "z-move");
        let battle = await BATTLE_SERVICE.chooseMove(battleId, userId, request);
        
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Move set!`
            }
        });
        await battle.stream.sendMove(userId);
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

function getInvalidChannelMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: "This is not a battle thread!",
            flags: InteractionResponseFlags.EPHEMERAL
        }
    });
}