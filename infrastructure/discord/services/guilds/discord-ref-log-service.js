import { CONFIG_DATA, CONSUMER_DATA, DISCORD_CHANNELS_MESSAGES_SERVICE, DISCORD_CHANNELS_SYNCHRONOUS_MESSAGES_SERVICE, DISCORD_CHANNELS_THREADS_SERVICE, DISCORD_GUILD_CHANNELS_SERVICE } from "../../../app/dependency-injection.js";
import { DiscordConstants } from "../../discord-constants.js";
import { DISCORD_GUILDS_THREADS_SERVICE } from "./threads-service.js";

export * as DISCORD_REF_LOG_SERVICE from "./discord-ref-log-service.js";

export async function create(battleCompletion) {
    let room = battleCompletion.room;
    let consumerId = room.consumerId;
    let consumer = await CONSUMER_DATA.getById(consumerId);
    let guildId = consumer.platformSpecificId;

    // Method performance can be improved by getting all properties for this consumer
    // Instead of making a DB request for each config property
    let refLogForumName = await CONFIG_DATA.get(consumer.id, DiscordConstants.REF_LOG_CHANNEL_NAME_PROPERTY_NAME);
    let refLogThreadName = await CONFIG_DATA.get(consumer.id, DiscordConstants.REF_LOG_THREAD_NAME_PROPERTY_NAME);

    let channels = await DISCORD_GUILD_CHANNELS_SERVICE.getAll(guildId);
    let refLogForum = channels.find(channel => channel.name == refLogForumName);

    let refLogThread = undefined;
    const activeThreads = await DISCORD_GUILDS_THREADS_SERVICE.getAll(guildId);
    if (activeThreads && activeThreads.threads) {
        refLogThread = activeThreads.threads.find(thread => thread.name == refLogThreadName);
        if (!refLogThread) {
            const publicArchivedThreads = await DISCORD_CHANNELS_THREADS_SERVICE.getAll(refLogForum.id); 
            if (publicArchivedThreads && publicArchivedThreads.threads) {
                refLogThread = publicArchivedThreads.threads.find(thread => thread.name == refLogThreadName);
            }
        }
    }

    if (refLogThread) {
        let message = buildBattleCompletionMessage(battleCompletion);
        let createdMessage = await DISCORD_CHANNELS_SYNCHRONOUS_MESSAGES_SERVICE.createSynchronousMessage(refLogThread.id, message);
        if (createdMessage) {
            let createdMessageUrl = `https://discord.com/channels/${guildId}/${refLogThread.id}/${createdMessage.id}`;
            DISCORD_CHANNELS_MESSAGES_SERVICE.create(room.options['discordThreadId'], "**Log**: " + createdMessageUrl);
        }
    }
}

function buildBattleCompletionMessage(battleCompletion) {
    let message = `**#${battleCompletion.battleNum}**\n\n`;
    message += battleCompletion.room.getRulesMessage() + "\n\n";
    for (let winner of battleCompletion.winners) {
        message += buildTeamMessage(winner) + "\n";
    }
    for (let loser of battleCompletion.losers) {
        message += buildTeamMessage(loser) + "\n";
    }
    message += "\n";
    for (let winner of battleCompletion.winners) {
        message += `<@${winner.userId}> wins and gets \$${winner.payment}\n`;
    }
    for (let loser of battleCompletion.losers) {
        message += `<@${loser.userId}> loses and gets \$${loser.payment}\n\n`;
    }
    
    message += `Thread: <#${battleCompletion.room.options['discordThreadId']}>`;
    return message;
}

function buildTeamMessage(participant) {
    let message = `**${participant.name}**: `;
    for (let i = 0; i < participant.pokemon.length; i++) {
        let pokemon = participant.pokemon[i];
        if (pokemon.nickname) {
            message += pokemon.nickname + " the ";
        }
        message += pokemon.species + " " + pokemon.gender;
        if (i < participant.pokemon.length - 1) {
            message += ", ";
        }
    }
    return message;
}