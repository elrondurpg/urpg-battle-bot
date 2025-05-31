import { InteractionType } from 'discord-interactions';
import { onCreateBattleRoom } from './interactions/create-battle-interaction.js';
import { forfeitBattle, requestForfeitConfirmation } from './interactions/ff-interaction.js';
import { displayHelp } from './interactions/help-interaction.js';
import { joinBattle } from './interactions/join-interaction.js';
import { sendLeadOptions, chooseLead } from './interactions/lead-interaction.js';
import { choosePokemonForLearnset, displayLearnset } from './interactions/learnset-interaction.js';
import { chooseMove } from './interactions/move-interaction.js';
import { sendPokemon } from './interactions/send-interaction.js';
import { displayStats } from './interactions/stats-interaction.js';
import { switchPokemon, choosePokemon } from './interactions/switch-interaction.js';

const commands = [
  {
    name: 'create-battle',
    target: onCreateBattleRoom
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
    name: 'help',
    target: displayHelp
  },
  {
    name: 'ff',
    target: requestForfeitConfirmation
  },
  {
    name: 'lead',
    target: sendLeadOptions
  },
  {
    name: 'learnset',
    target: choosePokemonForLearnset
  },
  {
    name: 'stats',
    target: displayStats
  },
  {
    name: 'move',
    target: chooseMove
  },
  {
    name: 'switch',
    target: switchPokemon
  },
  {
    name: 'msg_switch_choice_',
    target: choosePokemon
  },
  {
    name: 'msg_lead_choice_',
    target: chooseLead
  },
  {
    name: 'msg_learnset_choice_',
    target: displayLearnset
  },
  {
    name: 'msg_forfeit_choice_',
    target: forfeitBattle
  }
];

export function getDiscordInteractionRoute(req) {
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