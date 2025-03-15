import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BATTLE_SERVICE } from '../../../dependency-injection.js';
import { PlayerAlreadyAddedError } from '../../../domain/battles/battleService.js';
import { BATTLE_THREAD_TAG } from '../../../constants.js';
import { sendTextMessage } from '../../messages/message-service.js';

export const joinBattle = (req, res) => {
    return joinDiscordBattle(req, res)
}

async function joinDiscordBattle(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    if (channelName.substr(0, 12) !== BATTLE_THREAD_TAG) {
        return getInvalidChannelMessage(res);
    }
    try {
        let battle = BATTLE_SERVICE.addPlayer(battleId, userId);
        let playerAdded = false;
        for (let id of battle.playerIds) {
            if (id == userId) {
                playerAdded = true;
            }
        }
        if (playerAdded) {
            let successMessage = getSuccessMessage(res, userId);
            const channelId = req.body.channel.id;
            sendTextMessage(channelId, getBattleStartMessage(battle));
        }
        else {
            if (battle.started) {
                return getBattleAlreadyStartedMessage(res);
            }
            else {
                return getBattleAlreadyFullMessage(res);
            }
        }
    } catch (err) {
        if (err instanceof PlayerAlreadyAddedError) {
            return getPlayerAlreadyAddedMessage(res);
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

function getSuccessMessage(res, userId) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `<@${userId}> joined the battle!`
        }
    });
}

function getBattleStartMessage(battle) {
    let message = "**Battle Start**\n\n";

    message += `<@${battle.teams[0][0]}> vs. <@${battle.teams[1][0]}>\n\n`;

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

function getBattleAlreadyStartedMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `Couldn't add you to this battle. It's already started!`
        }
    });
}

function getBattleAlreadyFullMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `Couldn't add you to this battle. It's already full!`
        }
    });
}

function getPlayerAlreadyAddedMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `You're already in this battle!`
        }
    });
}