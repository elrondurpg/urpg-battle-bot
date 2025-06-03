export const sendMoveCommand = {
    name: 'move',
    description: 'Choose a move',
    type: 1,
    integration_types: [0],
    contexts: [0],
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
        name: 'mega-evolve',
        description: 'Mega-Evolve your Pokémon',
        required: false
      },
      {
        type: 5,
        name: 'ultra-burst',
        description: 'Power up your Pokémon with Ultra Burst',
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