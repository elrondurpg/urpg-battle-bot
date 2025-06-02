import { GENERATIONS, BATTLE_TYPES, SEND_TYPES, TEAM_TYPES } from '../../../models/battle-room.js';

export const createBattleCommand = {
    name: 'create-battle',
    description: 'Create a battle thread',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
      {
        type: 4,
        name: 'team-size',
        description: 'Choose the number of Pokémon per team',
        choices: createTeamSizeChoices(),
        required: true
      },
      {
        type: 3,
        name: 'generation',
        description: 'Choose the generation of battle',
        choices: createGenerationChoices(),
        required: true
      },
      {
        type: 3,
        name: 'send-type',
        description: 'Choose whether moves will be sent publicly or privately',
        choices: createSendTypeChoices(),
        required: true
      },
      {
        type: 3,
        name: 'team-type',
        description: 'Choose when Pokémon teams will be chosen and revealed',
        choices: createTeamTypeChoices(),
        required: true
      },
      {
        type: 3,
        name: 'battle-type',
        description: 'Choose the type of battle',
        choices: createBattleTypes(),
        required: true
      },
      {
        type: 5,
        name: 'items-allowed',
        description: 'Choose whether held items can be used',
        required: false
      }
    ]
  };

function createBattleTypes() {
    const choices = BATTLE_TYPES;
    const battleChoices = [];

    for (let choice of choices) {
        battleChoices.push({
        name: choice,
        value: choice.toLowerCase(),
        });
    }

    return battleChoices;
}

function createGenerationChoices() {
    const choices = GENERATIONS;
    const result = [];

    for (let choice of choices) {
        result.push({
        name: choice,
        value: choice.toLowerCase(),
        });
    }

    return result;
}

function createSendTypeChoices() {
    const choices = SEND_TYPES;
    const result = [];

    for (let choice of choices) {
        result.push({
        name: choice,
        value: choice.toLowerCase(),
        });
    }

    return result;
}

function createTeamTypeChoices() {
    const choices = TEAM_TYPES;
    const result = [];

    for (let choice of choices) {
        result.push({
        name: choice,
        value: choice.toLowerCase(),
        });
    }

    return result;
}

function createTeamSizeChoices() {
    const choices = [ 6, 5, 4, 3, 2, 1 ];
    const result = [];

    for (let choice of choices) {
        result.push({
        name: `${choice}`,
        value: choice,
        });
    }

    return result;
}