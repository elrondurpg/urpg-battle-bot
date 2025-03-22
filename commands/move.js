export const sendMoveCommand = {
    name: 'move',
    description: 'Choose a move',
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        type: 3,
        name: 'move',
        description: 'Choose the move to use',
        required: true
      },
      {
        type: 5,
        name: 'dynamax',
        description: 'Dynamax your Pokémon',
        required: false
      },
      {
        type: 5,
        name: 'gigantamax',
        description: 'Gigantamax your Pokémon',
        required: false
      },
      {
        type: 5,
        name: 'mega-evolve',
        description: 'Mega-Evolve your Pokémon',
        required: false
      },
      {
        type: 5,
        name: 'terastallize',
        description: 'Terastallize your Pokémon',
        required: false
      },
      {
        type: 5,
        name: 'z-move',
        description: 'Use a Z-Move',
        required: false
      }
    ]
  };