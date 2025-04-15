import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import * as ValidationRules from '../../utils/ValidationRules.js';
import { BATTLE_THREAD_TAG } from "../../constants.js";
import { BATTLE_SERVICE } from "../../dependency-injection.js";
import { BadRequestError } from "../../utils/BadRequestError.js";

export const displayStats = (req, res) => {
    return displayDiscordStats(req, res);
}

async function displayDiscordStats(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let battle = BATTLE_SERVICE.get(battleId);
        if (battle.trainers.has(userId)) {
            if (battle.trainers.get(userId).pokemon.size > 0) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL,
                        content: battle.printTrainer(userId)
                    }
                });
            }
            else {
                throw new BadRequestError("Kauri's words echoed... There's a time and place for everything, but not now.");
            }
        }
        else {
            throw new BadRequestError("You are not involved in this battle!");
        }
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