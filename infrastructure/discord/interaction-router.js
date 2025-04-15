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
  else if (type === InteractionType.MESSAGE_COMPONENT) {
    const name = data.custom_id;
    for (const command of commands) {
      if (command.name != undefined && name.startsWith(command.name)) {
        return command.target;
      }
    }
  }

}