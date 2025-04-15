export class Trainer {
    id;
    pokemon = new Map();
    pokemonIndex = 1;
    activePokemon = 1;
    move;
    switch;
    statuses = [];
    pokemonByPosition = new Map();
    name;
    mega;
    ultra;
    zmove;
    dynamax;
    terastallize;
    max;
    hasDynamaxed = false;
    hasMegaEvolved = false;
    hasTerastallized = false;
    hasUsedZMove = false;
    position;
    lastChoiceType;

    getActivePokemon() {
        return this.pokemon.get(parseInt(this.activePokemon));
    }
}