export const pokemonLongRegex = /p\d+[a-z]*: .+/;
const pokemonOwnerRegex = /(p\d+)[a-z]*: .+/;
const pokemonPositionRegex = /p\d+([a-z]*): .+/;
const pokemonNameRegex = /p\d+[a-z]*: (.+)/;
const hpRegex = /(\d+\/\d+)\s*.*/;
const statusRegex = /\d+\/\d+\s*(.*)/;
const trainerRegex = /p\d+: (.+)/;
const oldActiveRegex = /\[out\] (.+)/;
const oldActiveHpRegex = /([0-9\.]+) .*/;

export class ShowdownMessage {
    tokens;
    ability;
    amount;
    attacker;
    condition;
    defender;
    details;
    effect;
    hp;
    hpStatus;
    item;
    megastone;
    move;
    number;
    pokemon;
    position;
    reason;
    side;
    source;
    species;
    stat;
    stats;
    status;
    target;
    weather;    
    outputmove;
    fromItem = false;
    zeffect = false;
    type;
    oldActive;
    oldActiveHp;

    constructor(tokens) {
        this.tokens = tokens;

        let stat = tokens.find(token => token.includes("stat: "));
        if (stat) {
            this.stat = stat.replace("stat: ", "");
        }

        let outputmove = tokens.find(token => token.includes("outputmove: "));
        if (outputmove) {
            this.outputmove = outputmove.replace("outputmove: ", "");
        }

        let number = tokens.find(token => token.includes("number: "));
        if (number) {
            this.number = number.replace("number: ", "");
        }

        if (tokens.includes("[fromitem]")) {
            this.fromItem = true;
        }

        if (tokens.includes("[zeffect]")) {
            this.zeffect = true;
        }
    }

    setAbility(ability) {
        this.ability = ability;
        return this;
    }

    setAmount(amount) {
        this.amount = amount;
        return this;
    }

    setAttacker(attacker) {
        this.attacker = attacker;
        return this;
    }

    setCondition(condition) {
        this.condition = condition;
        return this;
    }

    setDefender(defender) {
        this.defender = defender;
        return this;
    }

    setDetails(details) {
        this.details = details;
        return this;
    }

    setEffect(effect) {
        this.effect = effect;
        return this;
    }

    setHp(hp) {
        this.hp = hp;
        return this;
    }

    setHpStatus(hpStatus) {
        this.hpStatus = hpStatus;
        return this;
    }

    setItem(item) {
        this.item = item;
        return this;
    }

    setMegaStone(megastone) {
        this.megastone = megastone;
        return this;
    }

    setMove(move) {
        this.move = move;
        return this;
    }

    setNumber(number) {
        this.number = number;
        return this;
    }

    setPokemon(pokemon) {
        this.pokemon = pokemon;
        return this;
    }

    setPosition(position) {
        this.position = position;
        return this;
    }

    setReason(reason) {
        this.reason = reason;
        return this;
    }

    setSide(side) {
        this.side = side;
        return this;
    }

    setSource(source) {
        this.source = source;
        return this;
    }

    setSpecies(species) {
        this.species = species;
        return this;
    }

    setStat(stat) {
        this.stat = stat;
        return this;
    }

    setStats(stats) {
        this.stats = stats;
        return this;
    }

    setStatus(status) {
        this.status = status;
        return this;
    }

    setTarget(target) {
        this.target = target;
        return this;
    }

    setWeather(weather) {
        this.weather = weather;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    getSide() {
        if (this.side && this.side.match(trainerRegex)) {
            return trainerRegex.exec(this.side)[1];
        }
    }

    getPokemonOwner() {
        if (this.pokemon && this.pokemon.match(pokemonLongRegex)) {
            return pokemonOwnerRegex.exec(this.pokemon)[1];
        }
    }

    getPokemonPosition() {
        if (this.pokemon && this.pokemon.match(pokemonLongRegex)) {
            return pokemonPositionRegex.exec(this.pokemon)[1];
        }
    }

    getPokemonName() {
        if (this.pokemon && this.pokemon.match(pokemonLongRegex)) {
            return pokemonNameRegex.exec(this.pokemon)[1];
        }
    }

    
    getSpeciesOwner() {
        if (this.species && this.species.match(pokemonLongRegex)) {
            return pokemonOwnerRegex.exec(this.species)[1];
        }
    }

    getSpeciesPosition() {
        if (this.species && this.species.match(pokemonLongRegex)) {
            return pokemonPositionRegex.exec(this.species)[1];
        }
    }

    getSpeciesName() {
        if (this.species && this.species.match(pokemonLongRegex)) {
            return pokemonNameRegex.exec(this.species)[1];
        }
    }

    getTargetOwner() {
        if (this.target && this.target.match(pokemonLongRegex)) {
            return pokemonOwnerRegex.exec(this.target)[1];
        }
    }

    getTargetPosition() {
        if (this.target && this.target.match(pokemonLongRegex)) {
            return pokemonPositionRegex.exec(this.target)[1];
        }
    }

    getTargetName() {
        if (this.target && this.target.match(pokemonLongRegex)) {
            return pokemonNameRegex.exec(this.target)[1];
        }
    }

    getSourceOwner() {
        if (this.source && this.source.match(pokemonLongRegex)) {
            return pokemonOwnerRegex.exec(this.source)[1];
        }
    }

    getSourcePosition() {
        if (this.source && this.source.match(pokemonLongRegex)) {
            return pokemonPositionRegex.exec(this.source)[1];
        }
    }

    getSourceName() {
        if (this.source && this.source.match(pokemonLongRegex)) {
            return pokemonNameRegex.exec(this.source)[1];
        }
    }

    getHp() {
        if (this.hp) {
            return this.hp;
        }
        else if (this.hpStatus) {
            return hpRegex.exec(this.hpStatus)[1];
        }
    }

    getStatus() {
        if (this.status) {
            return this.status;
        }
        else if (this.hpStatus) {
            return statusRegex.exec(this.hpStatus)[1];
        }
    }

    setOldActive(oldActive) {
        if (oldActive && oldActive.match(oldActiveRegex)) {
            this.oldActive = oldActiveRegex.exec(oldActive)[1];
        }
        return this;
    }

    setOldActiveHp(oldActiveHp) {
        if (oldActiveHp) {
            this.oldActiveHp = oldActiveHp.replaceAll("/100", "");
            if (oldActiveHp.match(oldActiveHpRegex)) {
                this.oldActiveHp = oldActiveHpRegex.exec(this.oldActiveHp)[1];
            }
        }
        return this;
    }
}