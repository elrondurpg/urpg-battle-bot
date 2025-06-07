import { createSynchronousMessage, deleteSynchronousMessage } from "../channels/synchronous-messages-service.js";

export async function createSendExpectMessageForTeamPreview(room, trainerId, numPokemonToSend) {
    let content = getSendExpectMessageForTeamPreview(room, trainerId, numPokemonToSend);
    let message = await createSynchronousMessage(room.options['discordThreadId'], content);
    room.expectedActions.set(trainerId, message.id);
}

export async function createSendExpectMessageForFullTeam(room, trainerId, numPokemonToSend) {
    let content = getSendExpectMessageForFullTeam(room, trainerId, numPokemonToSend);
    let message = await createSynchronousMessage(room.options['discordThreadId'], content);
    room.expectedActions.set(trainerId, message.id);
}

export async function createLeadExpectMessage(room, trainerId) {
    let content = getLeadExpectMessage(trainerId);
    let message = await createSynchronousMessage(room.options['discordThreadId'], content);
    room.expectedActions.set(trainerId, message.id);
}

export async function createMoveExpectMessage(room, trainerId, turnNumber) {
    let content = getMoveExpectMessage(trainerId, turnNumber);
    let message = await createSynchronousMessage(room.options['discordThreadId'], content);
    room.expectedActions.set(trainerId, message.id);
}

export async function createSwitchExpectMessage(room, trainerId) {
    let content = getSwitchExpectMessage(trainerId);
    let message = await createSynchronousMessage(room.options['discordThreadId'], content);
    room.expectedActions.set(trainerId, message.id);
}

export async function deleteExpectMessage(room, trainerId) {
    let lastMessageId = room.expectedActions.get(trainerId);
    if (lastMessageId) {
        deleteSynchronousMessage(room.options['discordThreadId'], lastMessageId);
        room.expectedActions.delete(trainerId);
    }
}

function getSendExpectMessageForTeamPreview(room, trainerId, numPokemonToSend) {
    let message = `**<@${trainerId}>: You must send ${numPokemonToSend} Pokémon!**\n`;
    message += "Use \`/send\` to send a Pokémon. Your team will be hidden from your opponent";
    if (room.rules.numTeams > 2 || room.rules.numTrainersPerTeam > 1) {
        message += "s";
    }
    message += " until all sends have been received.\n";
    return message;
}

function getSendExpectMessageForFullTeam(room, trainerId, numPokemonToSend) {
    let message = `**<@${trainerId}>: You must send ${numPokemonToSend} Pokémon!**\n`;
    message += "Use \`/send\` to send a Pokémon. Your team will be hidden from your opponent";
    if (room.rules.numTeams > 2 || room.rules.numTrainersPerTeam > 1) {
        message += "s";
    }
    message += ".\n";
    return message;
}

function getLeadExpectMessage(trainerId) {
    let message = `**<@${trainerId}>: Choose your lead Pokémon!**\n`;
    message += "Use `/lead` to submit your choice.\n";
    message += "Use `/help` to view other available commands.\n";
    return message;
}

function getMoveExpectMessage(trainerId, turnNumber) {
    let message = `**<@${trainerId}>: Select your action for turn ${turnNumber}!**\n`;
    message += "Use `/move` to choose a move.\n";
    message += "Use `/switch` to switch Pokémon.\n";
    message += "Use `/help` to view other available commands.\n";
    return message;
}

function getSwitchExpectMessage(trainerId) {
    let message = `**<@${trainerId}>: Choose which Pokémon to switch in!**\n`;
    message += "Use `/switch` to submit your choice.\n";
    message += "Use `/help` to view other available commands.\n";
    return message;
}