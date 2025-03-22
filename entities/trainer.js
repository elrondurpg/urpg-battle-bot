export class Trainer {
    id;
    pokemon = new Map();
    pokemonIndex = 1;
    activePokemon = 1;
    move;
    statuses = [];
    pokemonByPosition = new Map();

    getActivePokemon() {
        return this.pokemon.get(parseInt(this.activePokemon));
    }
}