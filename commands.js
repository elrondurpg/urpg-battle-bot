import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';
import { createBattleCommand } from './commands/create-battle.js';
import { joinCommand } from './commands/join.js';

export const commands = [
  createBattleCommand,
  joinCommand
];

export function getOptionValue(options, name) {
  for (let option of options) {
    if (option.name === name) {
      return option.value;
    }
  }
}

InstallGlobalCommands(process.env.APP_ID, commands);
