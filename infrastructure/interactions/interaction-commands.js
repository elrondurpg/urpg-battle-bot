import { sendCommand } from '../../commands/send.js';
import { onCreateBattle } from './battles/create-battle-interaction.js';
import { joinBattle } from './battles/join-interaction.js';
import { sendPokemon } from './battles/send-interaction.js';

export const commands = [
  {
    name: 'create-battle',
    target: onCreateBattle
  },
  {
    name: 'join',
    target: joinBattle
  },
  {
    name: 'send',
    target: sendPokemon
  }
];