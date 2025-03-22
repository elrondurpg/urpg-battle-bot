import { onCreateBattle } from './battles/create-battle-interaction.js';
import { joinBattle } from './battles/join-interaction.js';
import { chooseLead } from './battles/lead-interaction.js';
import { chooseMove } from './battles/move-interaction.js';
import { sendPokemon } from './battles/send-interaction.js';
import { displayStats } from './battles/stats-interaction.js';

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
  },
  {
    name: 'lead',
    target: chooseLead
  },
  {
    name: 'stats',
    target: displayStats
  },
  {
    name: 'move',
    target:chooseMove
  }
];