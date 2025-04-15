export const sendCommand = {
    name: 'send',
    description: 'Send a Pokémon for the first time this battle.',
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        type: 3,
        name: 'species',
        description: 'Choose the species to send. Must be sendable on Pokémon Showdown.',
        required: true
      },
      {
        type: 3,
        name: 'gender',
        description: 'Choose the gender of your Pokémon. Must be valid for that Pokémon.',
        choices: createGenderChoices(),
        required: true
      },
      {
        type: 3,
        name: 'ability',
        description: 'Choose the ability of your Pokémon. Must be valid for that Pokémon.',
        required: true
      },
      {
        type: 3,
        name: 'item',
        description: 'Choose the held item of your Pokémon.',
        required: false
      },
      {
        type: 3, 
        name: 'hidden-power',
        description: 'Choose the type for Hidden Power',
        required: false
      },
      {
        type: 3, 
        name: 'tera-type',
        description: 'Choose the type for Terastallization',
        required: false
      },
      {
        type: 3, 
        name: 'conversion-type',
        description: 'Choose the type for Conversion',
        required: false
      }
    ]
  };

  function createGenderChoices() {
      const choices = [ "M", "F", "N" ];
      const result = [];
  
      for (let choice of choices) {
        result.push({
          name: choice,
          value: choice.toLowerCase(),
          });
      }
  
      return result;
  }