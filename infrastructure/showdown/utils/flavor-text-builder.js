import * as Showdown from "urpg-battle-bot-calc";

const regex = /[^A-Za-z0-9]/g;
const pokemonNameRegex = /p\d+[a-z]+: (.+)/;

export class FlavorTextBuilder {
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
    species;
    outputmove;
    type;
    upkeep;
    oldActive;
    oldActiveHp;

    constructor(action) {
        this.action = action;
    }

    from(action) {
        if (action.stat) {
            this.stat = action.stat;
        }
        if (action.fromItem || (action.tokens.some(token => token.includes("[from] item: ")))) {
            let itemActions = ["start", "end", "activate", "damage"];
            if (itemActions.includes(this.action.replaceAll("-", ""))) {
                if (action.tokens.some(token => token.includes("[of] "))) {
                    this.action += "FromPokemon";
                }
                else {
                    this.action += "FromItem";
                }
            }
        }
        if (action.weak || (action.tokens.some(token => token.includes("[weak]")))) {
            let weakActions = ["fail"];
            if (weakActions.includes(this.action.replaceAll("-", ""))) {
                this.action += "weak";
            }
        }
        if (action.zeffect || (action.tokens.some(token => token.includes("[zeffect]")))) {
            let zActions = [ "start", "heal", "boost", "boost2", "boost3", "clearBoost" ];
            if (zActions.includes(this.action.replaceAll("-", ""))) {
                this.action += "FromZEffect";
            }
        }
        if (!this.item) {
            let item = action.tokens.find(token => token.includes("item: "));
            if (item) {
                this.item = item.replace("[from] ", "").replace("item: ", "");
            }
        }
        if (action.outputmove) {
            this.outputmove = action.outputmove;
        }
        if (action.number) {
            this.number = action.number;
        }
        return this;
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

    setSpecies(species) {
        this.species = species;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setOldActive(oldActive) {
        this.oldActive = oldActive;
        return this;
    }

    setOldActiveHp(oldActiveHp) {
        this.oldActiveHp = oldActiveHp;
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
            let moveName = this.effect.replaceAll("move: ", "").replaceAll(regex, "").toLowerCase();
            let move = Showdown.default.Dex.textCache.Moves[moveName];

            let shouldShowAbilityActivation = this.effect.includes("ability: ");
            let abilityName = this.effect.replaceAll("ability: ", "").replaceAll(regex, "").toLowerCase();
            let ability = action == 'upkeep' ? undefined : Showdown.default.Dex.textCache.Abilities[abilityName];

            if (this.effect.includes("move: ") || (move && !this.move)) {
                this.effect = this.effect.replaceAll("move: ", "");
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
            else if (this.effect.includes("ability: ") || (ability && !this.ability)) {
                this.effect = this.effect.replaceAll("ability: ", "");
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
                if (shouldShowAbilityActivation) {
                    text = message;
                    let abilityActivation = new FlavorTextBuilder("abilityActivation")
                        .setPokemon(this.pokemon)
                        .setAbility(this.effect)
                        .build();
                    message = abilityActivation + "\n";
                    message += !text.trim().startsWith("(") ? text.trim() : "";
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
                let name = this.trainer;
                if (this.trainer.name) {
                    name = this.trainer.name;
                }
                message = message.replaceAll("[TRAINER]", name);
            }

            if (this.trainer) {
                let name = this.trainer;
                if (this.trainer.name) {
                    name = this.trainer.name;
                }
                message = message.replaceAll("[TEAM]", `${name}'s team`);
                message = message.replaceAll("[PARTY]", `${name}'s team`);
            }

            if (this.pokemon) {
                message = message.replaceAll("[POKEMON]", this.pokemon);
                message = message.replaceAll("[NICKNAME]", this.pokemon);
                message = message.replaceAll("[FULLNAME]", this.pokemon);
            }
            if (this.number) {
                message = message.replaceAll("[NUMBER]", this.number);
            }
            if (this.target) {
                message = message.replaceAll("[TARGET]", this.target);
            }
            if (this.outputmove) {
                this.outputmove = this.outputmove.replaceAll("[from] ", "").replaceAll("outputmove: ", "");
                message = message.replaceAll("[MOVE]", this.outputmove);
            }
            if (this.move) {
                this.move = this.move.replaceAll("[from] ", "").replaceAll("move: ", "");
                message = message.replaceAll("[MOVE]", this.move);
            }
            if (this.ability) {
                this.ability = this.ability.replaceAll("[from] ", "").replaceAll("ability: ", "");
                message = message.replaceAll("[ABILITY]", this.ability);
            }
            if (this.effect) {
                message = message.replaceAll("[EFFECT]", this.effect);
            }
            if (this.item) {
                this.item = this.item.replaceAll("[from] ", "").replaceAll("item: ", "");
                message = message.replaceAll("[ITEM]", this.item);
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
            if (this.species) {
                message = message.replaceAll("[SPECIES]", this.species);
            }
            if (this.type) {
                message = message.replaceAll("[TYPE]", this.type);
            }
            let isSwitch = (this.action == "switchIn" || this.action == "drag");
            let hasOldActive = this.oldActive && this.oldActiveHp;
            if (isSwitch && hasOldActive && this.oldActiveHp > 0) {
                message += "\n";
                message += `*(${this.oldActive} out at ${this.oldActiveHp}%)*`;
            }
            return message.trim();
        }
    }
}
