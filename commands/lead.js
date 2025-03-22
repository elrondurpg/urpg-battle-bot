export const leadCommand = {
    name: 'lead',
    description: 'Choose which Pokémon to send first in battle',
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
        {
            type: 4,
            name: 'pokemon-number',
            description: 'The number of the Pokémon to send',
            required: true
        }
    ]
}