import { createBattleCommand } from '../commands/create-battle.js';
import { joinCommand } from '../commands/join.js';
import { sendCommand } from '../commands/send.js';
import { helpCommand } from '../commands/help.js';
import { leadCommand } from '../commands/lead.js';
import { learnsetCommand } from '../commands/learnset.js';
import { statsCommand } from '../commands/stats.js';
import { sendMoveCommand } from '../commands/move.js';
import { switchCommand } from '../commands/switch.js';
import { forfeitCommand } from '../commands/ff.js';
import { DISCORD_APPLICATION_COMMANDS_SERVICE } from '../../app/dependency-injection.js';

const commands = [
    createBattleCommand,
    joinCommand,
    sendCommand,
    helpCommand,
    forfeitCommand,
    leadCommand,
    learnsetCommand,
    statsCommand,
    sendMoveCommand,
    switchCommand
];

export function registerInstallCommandsJob() {
    run();
}

async function run() {
    let appId = process.env.APP_ID;
    if (appId) {
        DISCORD_APPLICATION_COMMANDS_SERVICE.update(appId, commands);
    }
}