import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import { getOptionValue } from "../../../commands.js";
import { BATTLE_THREAD_TAG } from "../../../constants.js";
import { BATTLE_SERVICE } from "../../../dependency-injection.js";
import * as ValidationRules from '../../../utils/ValidationRules.js';
import { BadRequestError } from "../../../utils/BadRequestError.js";
import { streams } from "../../streams/stream-manager.js";

export const chooseLead = (req, res) => {
    return chooseDiscordLead(req, res);
}

async function chooseDiscordLead(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }

    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    try {
        let options = req.body.data.options;
        let index = getOptionValue(options, "pokemon-number");

        let battle = BATTLE_SERVICE.chooseLead(battleId, userId, index);
        
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Lead set!`
            }
        });

        let allLeadsChosen = true;
        for (let trainer of battle.trainers.values()) {
            if (trainer.activePokemon == undefined) {
                allLeadsChosen = false;
            }
        }
        if (allLeadsChosen) {
            let stream = streams.get(battle.id);
            stream.sendLeads();
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