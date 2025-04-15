import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BATTLE_SERVICE } from '../../dependency-injection.js';
import { BATTLE_THREAD_TAG } from '../../constants.js';
import * as ValidationRules from '../../utils/ValidationRules.js';
import { BadRequestError } from '../../utils/BadRequestError.js';
import { MESSAGE_SERVICE } from '../../dependency-injection.js';

export const joinBattle = (req, res) => {
    return joinDiscordBattle(req, res)
}

async function joinDiscordBattle(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    if (ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }
    try {
        let battle = BATTLE_SERVICE.addPlayer(battleId, userId);
        if (battle.trainers.has(userId)) {
            if (req.body.member.user.nick != undefined) {
                battle.trainers.get(userId).name = req.body.member.nick;
            }
            else {
                battle.trainers.get(userId).name = req.body.member.user.global_name;
            }
            sendSuccessMessage(res, userId);
            let options = {
                threadId: req.body.channel.id
            }
            MESSAGE_SERVICE.sendMessage(getBattleStartMessage(battle), options);
            battle.awaitingChoices = new Map();
            for (let trainer of battle.trainers.values()) {
                battle.awaitingChoices.set(trainer.id, {
                    type: "send",
                    quantity: battle.rules.numPokemonPerTrainer
                });
            }
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

function sendSuccessMessage(res, userId) {
    res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `<@${userId}> joined the battle!`
        }
    });
}

function getBattleStartMessage(battle) {
    let message = "**Battle Start**\n\n";

    message += `<@${battle.teams[0][0].id}> vs. <@${battle.teams[1][0].id}>\n\n`;

    message += `**Each player must send ${battle.rules.numPokemonPerTrainer} Pokémon!**\n`;
    message += "Use \`/send\` to send a Pokémon. Your team will be hidden from your opponent";
    if (battle.rules.numTeams > 2 || battle.rules.numTrainersPerTeam > 1) {
        message += "s";
    }
    message += battle.rules.teamType == "full" 
        ? ".\n"
        : " until all sends have been received.\n";
    return message;
}