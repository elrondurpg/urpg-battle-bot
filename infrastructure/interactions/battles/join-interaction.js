import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BATTLE_SERVICE } from '../../../dependency-injection.js';
import { PlayerAlreadyAddedError } from '../../../domain/battles/battleService.js';
import { BATTLE_THREAD_TAG } from '../../../constants.js';

export const joinBattle = (req, res) => {
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
            return getSuccessMessage(res, userId);
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
        flags: InteractionResponseFlags.EPHEMERAL,
        data: {
            content: "This is not a battle thread!"
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

function getBattleAlreadyStartedMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        flags: InteractionResponseFlags.EPHEMERAL,
        data: {
            content: `Couldn't add you to this battle. It's already started!`
        }
    });
}

function getBattleAlreadyFullMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        flags: InteractionResponseFlags.EPHEMERAL,
        data: {
            content: `Couldn't add you to this battle. It's already full!`
        }
    });
}

function getPlayerAlreadyAddedMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        flags: InteractionResponseFlags.EPHEMERAL,
        data: {
            content: `You're already in this battle!`
        }
    });
}