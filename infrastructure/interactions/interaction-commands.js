import { onCreateBattle } from './battles/create-battle-interaction.js';
import { joinBattle } from './battles/join-interaction.js';

export const commands = [
  {
    name: 'create-battle',
    target: onCreateBattle
  },
  {
    name: 'join',
    target: joinBattle
  }
];