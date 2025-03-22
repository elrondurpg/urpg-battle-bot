import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BattleIdCollisionError } from '../../../entities/battles.js';
import { createPublicThread } from '../../threads/thread-service.js';
import { BATTLE_SERVICE } from '../../../dependency-injection.js';
import { CreateBattleRequest } from '../../../domain/battles/CreateBattleRequest.js';
import { BadRequestError } from '../../../utils/BadRequestError.js';
import { getOptionValue } from '../../../commands.js';
import { capitalize } from '../../../utils.js';
import { BATTLE_THREAD_TAG } from '../../../constants.js';
import { MESSAGE_SERVICE } from '../../../dependency-injection.js';

export const onCreateBattle = (req, res) => {
    try {
        return createDiscordBattle(req, res);
    } catch (err) {
        if (err instanceof BattleIdCollisionError) {
            return sendMessageOnBattleIdCollision(res);
        }
    }
}

async function createDiscordBattle(req, res) {
    const channelName = req.body.channel.name;
    if ("battle-search" != channelName) {
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `This server has limited the use of /create-battle to the #battle-search channel.`
            }
        });
    }
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    let request = new CreateBattleRequest();
    request.ownerId = userId;
    
    let options = req.body.data.options;
    request.teamSize = getOptionValue(options, 'team-size');
    request.generation = getOptionValue(options, 'generation');
    request.sendType = getOptionValue(options, 'send-type');
    request.teamType = getOptionValue(options, 'team-type');
    request.battleType = getOptionValue(options, 'battle-type');
    request.itemsAllowed = getOptionValue(options, 'items-allowed');

    try {
        let battle = BATTLE_SERVICE.create(request);
        if (req.body.member.user.nick != undefined) {
            battle.trainers.get(userId).name = req.body.member.nick;
        }
        else {
            battle.trainers.get(userId).name = req.body.member.user.global_name;
        }
        const channelId = req.body.channel.id;
        const threadName = `${BATTLE_THREAD_TAG}${battle.id}`;
        let thread = await createPublicThread(channelId, threadName);
        let options = {
            threadId: thread.id
        }
        await MESSAGE_SERVICE.sendMessage(getBattleThreadInitialMessageContent(battle), options);
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Created a battle room!`
            }
        });
    } catch (err) {
        let message = err instanceof BadRequestError 
            ? err.message 
            : 'A battle could not be created from the provided data.';

        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: message
            }
        });
    }
}

function sendMessageOnBattleIdCollision(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `Couldn't create the requested battle room. Please try again.`,
        }
    });
}

function getBattleThreadInitialMessageContent(battle) {
    let message = `Battle room created by <@${battle.ownerId}>\n\n`;
    message += "**Rules**\n";
    let generation = capitalize(battle.rules.generation);
    let sendType = capitalize(battle.rules.sendType);
    let teamType = capitalize(battle.rules.teamType);
    let battleType = capitalize(battle.rules.battleType);
    message += `${battle.rules.numPokemonPerTrainer}v${battle.rules.numPokemonPerTrainer} ${generation} ${sendType} ${teamType} ${battleType}\n`;

    if (battle.rules.itemsAllowed) {
        message += "Helds ON\n";
    }

    let simpleClauseMessage = getSimpleClauseMessage(battle.rules);
    if (simpleClauseMessage != undefined) {
        message += simpleClauseMessage + "\n";
    }

    if (battle.rules.worldCoronationClause == true) {
        message += "World Coronation Series rules ON";
    }
    else {
        let gimmickMessage = getGimmickMessage(battle.rules);
        if (gimmickMessage != undefined) {
            message += gimmickMessage;
        }
    }

    let numPlayersNeeded = battle.getNumPlayersNeeded();
    if (numPlayersNeeded == 1) {
        message += `\n\n**Looking for ${battle.getNumPlayersNeeded()} opponent!**\n`;
    }
    else if (numPlayersNeeded > 1) {
        message += `\n\n**Looking for ${battle.getNumPlayersNeeded()} opponents!**\n`;
    }
    if (numPlayersNeeded > 0) {
        message += "Use the \`/join\` command to join this battle.";
    }

    return message;
}

function getSimpleClauseMessage(rules) {
    let simpleClauses = [];
    if (rules.ohkoClause == true) {
        simpleClauses.push("OHKO");
    }
    if (rules.accClause == true) {
        simpleClauses.push("ACC");
    }
    if (rules.evaClause == true) {
        simpleClauses.push("EVA");
    }
    if (rules.sleepClause == true) {
        simpleClauses.push("Sleep");
    }
    if (rules.freezeClause == true) {
        simpleClauses.push("Freeze");
    }
    if (rules.speciesClause == true) {
        simpleClauses.push("Species");
    }
    if (rules.itemsAllowed && rules.itemClause) {
        simpleClauses.push("Item");
    }
    if (simpleClauses.length > 0) {
        let simpleClauseMessage = "";
        for (let i = 0; i < simpleClauses.length; i++) {
            simpleClauseMessage += simpleClauses[i];
            if (i < simpleClauses.length - 1) {
                simpleClauseMessage += "/";
            }
        }
        return simpleClauseMessage + " Clauses ON";
    }
    else {
        return undefined;
    }
}

function getGimmickMessage(rules) {
    let clauses = [];
    if (rules.megasAllowed == true) {
        clauses.push("Mega Evolution");
    }
    if (rules.zmovesAllowed == true) {
        clauses.push("Z-Moves");
    }
    if (rules.dynamaxAllowed == true) {
        clauses.push("Dynamax");
    }
    if (rules.teraAllowed == true) {
        clauses.push("Terastallization");
    }
    if (clauses.length > 0) {
        let message = "";
        for (let i = 0; i < clauses.length; i++) {
            message += clauses[i];
            if (i < clauses.length - 1) {
                message += ", ";
            }
        }
        return message + " ALLOWED";
    }
    else {
        return undefined;
    }
}