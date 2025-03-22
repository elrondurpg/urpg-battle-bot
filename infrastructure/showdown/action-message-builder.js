import * as Showdown from "urpg-battle-bot-calc";

const regex = /[^A-Za-z0-9]/g;
const pokemonNameRegex = /p\d+[a-z]+: (.+)/;

export class ActionMessageBuilder {
    action;
    trainer;
    pokemon;
    number;
    target;
    move;
    ability;
    effect;
    item;
    percentage;
    stat;
    source;

    constructor(action) {
        this.action = action;
    }

    setTrainer(trainer) {
        this.trainer = trainer;
        return this;
    }

    setPokemon(pokemon) {
        this.pokemon = pokemon;
        return this;
    }

    setNumber(number) {
        this.number = number;
        return this;
    }

    setTarget(target) {
        this.target = target;
        return this;
    }

    setMove(move) {
        this.move = move;
        return this;
    }

    setAbility(ability) {
        this.ability = ability;
        return this;
    }

    setEffect(effect) {
        this.effect = effect;
        return this;
    }

    setItem(item) {
        this.item = item;
        return this;
    }

    setPercentage(percentage) {
        this.percentage = percentage;
        return this;
    }

    setStat(stat) {
        this.stat = stat;
        return this;
    }

    setSource(source) {
        this.source = source;
        return this;
    }

    build() {        
        // get the default text for the action
        let action = this.action.replaceAll(regex, "");
        let message = Showdown.default.Dex.textCache.Default.default[action];

        // if the command has an EFFECT
        if (this.effect) {
            if (this.effect.includes("[from] ")) {
                this.effect = this.effect.replaceAll("[from] ", "");
            }
            // if the EFFECT is a move, get the action text for that move
            if (this.effect.includes("move: ")) {
                this.effect = this.effect.replaceAll("move: ", "");
                let moveName = this.effect.replaceAll(regex, "").toLowerCase();
                let move = Showdown.default.Dex.textCache.Moves[moveName];
                let text = move[action];
                if (text) {
                    if (text.startsWith("#.")) {
                        // if the action text starts with #., 
                        // use the action text for the action of that name within the same object
                        message = move[text.replaceAll("#.", "")];
                    }
                    else if (text.startsWith("#")) {
                        // if the action text starts with #, 
                        // use the action text for the object of the same type with that name
                        moveName = text.replaceAll(regex, "").toLowerCase();
                        move = Showdown.default.Dex.textCache.Moves[moveName];
                        message = move[action];
                    }
                    else {
                        message = text;
                    }
                }
            }

            // if the EFFECT is an item, get the action text for that item
            else if (this.effect.includes("item: ")) {
                this.effect = this.effect.replaceAll("item: ", "");
                let itemName = this.effect.replaceAll(regex, "").toLowerCase();
                let item = Showdown.default.Dex.textCache.Items[itemName];
                let text = item[action];
                if (text) {
                    if (text.startsWith("#.")) {
                        // if the action text starts with #., 
                        // use the action text for the action of that name within the same object
                        message = item[text.replaceAll("#.", "")];
                    }
                    else if (text.startsWith("#")) {
                        // if the action text starts with #, 
                        // use the action text for the object of the same type with that name
                        itemName = text.replaceAll(regex, "").toLowerCase();
                        item = Showdown.default.Dex.textCache.Items[itemName];
                        message = item[action];
                    }
                    else {
                        message = text;
                    }
                }
            }

            // if the EFFECT is an ability, get the action text for that ability
            else if (this.effect.includes("ability: ")) {
                this.effect = this.effect.replaceAll("ability: ", "");
                let abilityName = this.effect.replaceAll(regex, "").toLowerCase();
                let ability = Showdown.default.Dex.textCache.Abilities[abilityName];
                let text = ability[action];
                if (text) {
                    if (text.startsWith("#.")) {
                        // if the action text starts with #., 
                        // use the action text for the action of that name within the same object
                        message = ability[text.replaceAll("#.", "")];
                    }
                    else if (text.startsWith("#")) {
                        // if the action text starts with #, 
                        // use the action text for the object of the same type with that name
                        abilityName = text.replaceAll(regex, "").toLowerCase();
                        ability = Showdown.default.Dex.textCache.Abilities[abilityName];
                        message = ability[action];
                    }
                    else {
                        message = text;
                    }
                }
            }

            // if none of the above, get the action text for that effect
            else {
                let effectName = this.effect.replaceAll(regex, "").toLowerCase();
                let effect = Showdown.default.Dex.textCache.Default[effectName];
                if (effect) {
                    let text = effect[action];
                    if (text) {
                        if (text.startsWith("#.")) {
                            // if the action text starts with #., 
                            // use the action text for the action of that name within the same object
                            message = effect[text.replaceAll("#.", "")];
                        }
                        else if (text.startsWith("#")) {
                            // if the action text starts with #, 
                            // use the action text for the object of the same type with that name
                            effectName = text.replaceAll(regex, "").toLowerCase();
                            effect = Showdown.default.Dex.textCache.Default[effectName];
                            message = effect[action];
                        }
                        else {
                            message = text;
                        }
                    }
                }
            }
        }

        if (this.source) {
            if (this.source.includes("[of] ")) {
                this.source = this.source.replaceAll("[of] ", "");
            }
            if (this.source.match(pokemonNameRegex)) {
                this.source = pokemonNameRegex.exec(this.source)[1];
            }
        }

        if (message) {

            if (this.trainer) {
                message = message.replaceAll("[TRAINER]", this.trainer.name);
            }
            if (this.pokemon) {
                message = message.replaceAll("[NICKNAME]", this.pokemon.getNickname());
                message = message.replaceAll("[FULLNAME]", this.pokemon.getFullname());
                message = message.replaceAll("[POKEMON]", this.pokemon.getName());
            }
            if (this.number) {
                message = message.replaceAll("[NUMBER]", this.number);
            }
            if (this.target) {
                message = message.replaceAll("[TARGET]", this.target);
            }
            if (this.move) {
                message = message.replaceAll("[MOVE]", this.move.replaceAll("[from] move: ", ""));
            }
            if (this.ability) {
                message = message.replaceAll("[ABILITY]", this.ability.replaceAll("[from] ability: ", ""));
            }
            if (this.effect) {
                message = message.replaceAll("[EFFECT]", this.effect);
            }
            if (this.item) {
                message = message.replaceAll("[ITEM]", this.item.replaceAll("[from] item: ", ""));
            }
            if (this.percentage) {
                message = message.replaceAll("[PERCENTAGE]", this.percentage);
            }
            if (this.stat) {
                let statName = Showdown.default.Dex.textCache.Default[this.stat].statName;
                message = message.replaceAll("[STAT]", statName);
            }
            if (this.source) {
                message = message.replaceAll("[SOURCE]", this.source);
            }
            return message;
        }
    }
}
