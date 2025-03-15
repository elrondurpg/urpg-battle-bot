import { InteractionType } from 'discord-interactions';
import { commands } from './interaction-commands.js';

export function getRoute(req) {
  const { id, type, data } = req.body;

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    for (const command of commands) {
      if (command.name != undefined && command.name === name) {
        return command.target;
      }
    }
  }

}