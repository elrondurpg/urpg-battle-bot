import { onCreateBattle } from './create-battle-interaction.js';
import { joinBattle } from './join-interaction.js';
import { sendLeadOptions, chooseLead } from './lead-interaction.js';
import { chooseMove } from './move-interaction.js';
import { sendPokemon } from './send-interaction.js';
import { displayStats } from './stats-interaction.js';
import { switchPokemon, choosePokemon } from './switch-interaction.js';

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
    target: sendLeadOptions
  },
  {
    name: 'stats',
    target: displayStats
  },
  {
    name: 'move',
    target:chooseMove
  },
  {
    name: 'switch',
    target:switchPokemon
  },
  {
    name: 'msg_switch_choice_',
    target:choosePokemon
  },
  {
    name: 'msg_lead_choice_',
    target:chooseLead
  }
];