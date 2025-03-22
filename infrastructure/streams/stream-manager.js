import Sim from 'urpg-battle-bot-calc';
import { BattlePacker } from './BattlePacker.js';
import { MESSAGE_SERVICE } from '../../dependency-injection.js';
import { ShowdownAction } from '../showdown/showdown-action.js';
import { ActionMessageBuilder } from '../showdown/action-message-builder.js';
import * as Showdown from "urpg-battle-bot-calc";

export const streams = new Map();

export class BattleBotStream {
    battle;
    messageOptions;
    packer;
    stream;
    splitPlayer;
    splitCount = 0;

    constructor(battle, messageOptions) {
        this.battle = battle;
        this.messageOptions = messageOptions;
        this.packer = new BattlePacker(battle);
        this.stream = new Sim.BattleStream();
    }

    sendStart() {
        let trainer1 = this.battle.teams[0][0];
        let packedTeam1 = this.packer.getPackedTeam(trainer1.id);
        
        let trainer2 = this.battle.teams[1][0];
        let packedTeam2 = this.packer.getPackedTeam(trainer2.id);

        (async () => {
            for await (const output of this.stream) {
                let lines = output.split("\n");
                for (let line of lines) {
                    this.handleMessage(line);
                }
            }
        })();
    
        this.stream.write(`>start {"formatid":"[Gen 9] Custom Game"}`);
        this.stream.write(`>player p1 {"name":"${trainer1.id}", "team":"${packedTeam1}"}`);
        this.stream.write(`>player p2 {"name":"${trainer2.id}", "team":"${packedTeam2}"}`);
    }

    sendLeads() {
        let trainer1 = this.battle.teams[0][0];
        let teamSpec1 = `${trainer1.activePokemon}`;
        for (let i = 1; i < this.battle.rules.numPokemonPerTrainer + 1; i++) {
            if (i != trainer1.activePokemon) {
                teamSpec1 += i;
            }
        }
        this.stream.write(`>p1 team ${teamSpec1}`);   

        let trainer2 = this.battle.teams[1][0];
        let teamSpec2 = `${trainer2.activePokemon}`;
        for (let i = 1; i < this.battle.rules.numPokemonPerTrainer + 1; i++) {
            if (i != trainer2.activePokemon) {
                teamSpec2 += i;
            }
        }
        this.stream.write(`>p2 team ${teamSpec2}`); 
    }

    async handleMessage(command) {
        if (command != undefined) {
            if (this.splitPlayer != undefined) {
                this.splitCount++;
            }
            let message = undefined;
            let tokens = command.split("|");
            if (tokens.length > 0 && tokens[0] != '') {
                message = "N/A";
            }
            else if (tokens.length == 2 && tokens[0] == '' && tokens[1] == '') {
                message = "N/A";
            }
            else if (tokens.length > 1) {
                switch(tokens[1]) {
                    case 'player':
                        this.doPlayer(tokens);
                        message = "N/A";
                        break;
                    case 'start': 
                        this.battle.started = true;
                        message = `**Let the battle begin!**`;
                        break;
                    case 'teampreview': 
                        message = this.getTeamPreviewMessage();
                        break;
                    case 'turn': 
                        message = this.doTurn(tokens);
                        break;
                    case 'move': 
                        message = this.doMove(tokens);
                        break;
                    case 'drag':
                    case 'switch':
                        message = this.doSwitch(tokens);
                        break;
                    case 'detailschange':
                        message = "N/A";
                        break;
                    case '-formechange': 
                        message = this.doFormChange(tokens);
                        break;
                    case 'cant':
                        message = this.doCant(tokens);
                        break;
                    case '-fail':
                        message = this.doFail(tokens);
                        break;
                    case '-block':
                        message = this.doBlock(tokens);
                        break;
                    case '-miss':
                        message = this.doMiss(tokens);
                        break;
                    case '-damage': 
                        if (this.splitPlayer == undefined || this.splitCount == 2) {
                            message = this.doHealOrDamage(tokens);
                        }
                        if (this.splitPlayer && this.splitCount == 1) {
                            message = "N/A";
                        }
                        break;
                    case '-heal':
                        message = this.doHealOrDamage(tokens);
                        break;
                    case '-sethp': 
                        message = this.doSetHp(tokens);
                        break;
                    case '-status':
                        message = this.doStatus(tokens);
                        break;
                    case '-curestatus':
                        message = this.doCureStatus(tokens);
                        break;
                    case '-boost':
                    case '-unboost':
                        message = this.doBoost(tokens);
                        break;
                    case '-setboost':
                        message = this.doSetBoost(tokens);
                        break;
                    case '-swapboost':
                        message = this.doSwapBoost(tokens);
                        break;
                    case '-invertboost':
                        message = this.doInvertBoost(tokens);
                        break;
                    case '-clearboost': 
                        message = this.doClearBoost(tokens);
                        break;
                    case '-clearallboost': 
                        message = this.doClearAllBoost(tokens);
                        break;
                    case '-clearpositiveboost':
                        message = this.doClearPositiveBoost(tokens);
                        break;
                    case 'split': 
                        this.splitPlayer = tokens[2];
                        this.splitCount = 0;
                        message = "N/A";
                        break;
                    case '-weather': 
                        message = this.doWeather(tokens);
                        break;
                    case '-supereffective':
                        message = "It's super effective!";
                        break;
                    case '-resisted':
                        message = "It's not very effective...";
                        break;
                    case '-start': 
                        message = this.doVolatileStatus(tokens);
                        break;
                    case '-end':
                        message = this.endVolatileStatus(tokens);
                        break;
                    case '-sidestart': 
                        message = this.doSideStatus(tokens);
                        break;
                    case '-sideend':
                        message = this.endSideStatus(tokens);
                        break;
                    case 'request':
                    case 't:':
                    case 'gametype':
                    case 'teamsize':
                    case 'gen':
                    case 'tier': 
                    case 'clearpoke':
                    case 'poke':
                    case 'upkeep':
                    case '-anim':
                    case 'debug':
                        message = "N/A";
                }
            }

            if (message != undefined && (this.splitPlayer == undefined || this.splitCount == 2)) {
                if (this.splitCount == 2) {
                    this.splitPlayer = undefined;
                    this.splitCount = 0;
                }
                if (message != "N/A") {
                    if (!message.trim().startsWith("(") && !tokens.includes("[silent]")) {
                        await MESSAGE_SERVICE.sendMessage(message, this.messageOptions);
                    }
                } 
            }
            else if (this.splitPlayer == undefined || this.splitCount == 2) {
                if (this.splitCount == 2) {
                    this.splitPlayer = undefined;
                    this.splitCount = 0;
                }
            }

            if (message == undefined) {
                await MESSAGE_SERVICE.sendMessage(`Unimplemented command: ${command}`, this.messageOptions);
            }
        }
    }

    getTeamPreviewMessage() {
        this.battle.awaitingChoices = new Map();
        for (let trainer of this.battle.trainers.values()) {
            this.battle.awaitingChoices.set(trainer.id, {
                type: "lead"
            });
        }

        let message = "\n";
        let teamType = this.battle.rules.teamType.toLowerCase();
        if (teamType == "preview") {
            message += "**Team Previews**\n\n";
            message += `<@${this.battle.teams[0][0].id}>\n\n`;
            for (let pokemon of this.battle.teams[0][0].pokemon.values()) {
                message += `${pokemon.id}: ${pokemon.species} ${pokemon.gender}\n`;
            }

            message += `\n\n<@${this.battle.teams[1][0].id}>\n\n`;
            for (let pokemon of this.battle.teams[1][0].pokemon.values()) {
                message += `${pokemon.id}: ${pokemon.species}, ${pokemon.gender}\n`;
            }

            message += "\n\n";
        }
        else if (teamType == "open") {

        }
        else {
            message += "**Teams Set!**\n\n";
        }

        message += "**Each player must choose their lead Pokémon!**\n";
        message += "Use `/lead` to submit your choice.\n";

        if (teamType == "full") {
            message += "Use `/stats` if you need to view your team.\n";
        }

        return message;
    }

    doMove(tokens) {
        let action = new ShowdownAction('move')
            .setPokemon(tokens[2])
            .setMove(tokens[3])
            .setTarget(tokens[4]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.getActivePokemon();

        let message = "";

        if (pokemon.volatileStatuses.includes("confusion")) {
            message += `${pokemon.getName()} is confused.\n`;
        }

        message += new ActionMessageBuilder('move')
            .setPokemon(pokemon)
            .setMove(action.move)
            .setTarget(action.getTargetName())
            .build();

        return message;
    }

    doSwitch(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setDetails(tokens[4])
            .setHpStatus(tokens[5]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let previousPokemon = trainer.getActivePokemon();
        trainer.activePokemon = tokens[3];
        let pokemon = trainer.getActivePokemon();
        trainer.pokemonByPosition.set(action.getPokemonPosition(), pokemon);

        let hpTokens = action.getHp().split("/");
        pokemon.currentHp = hpTokens[0];
        pokemon.maxHp = hpTokens[1];

        for (let pokemon of trainer.pokemon.values()) {
            if (pokemon.id != trainer.activePokemon) {
                pokemon.boosts = new Map();
            }
        }

        let message = "";

        if (tokens[1] != 'drag' && previousPokemon.id != tokens[3]) {
            let switchOutMessage = new ActionMessageBuilder("switchOut")
                .setTrainer(trainer)
                .setPokemon(previousPokemon)
                .build();
            message += switchOutMessage + "\n";
        }

        message += new ActionMessageBuilder(tokens[1] == "switch" ? "switchIn" : "drag")
            .setTrainer(trainer)
            .setPokemon(previousPokemon)
            .build();

        return message;
    }

    doFormChange(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setSpecies(tokens[3])
            .setHpStatus(tokens[4]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.getActivePokemon();
        pokemon.species = action.species;

        if (action.hpStatus) {
            let hpTokens = action.getHp().split("/");
            pokemon.currentHp = hpTokens[0];
            pokemon.maxHp = hpTokens[1];
        }

        let message = "";

        message += new ActionMessageBuilder("transform")
            .setPokemon(pokemon)
            .build();

        return message;
    }

    doCant(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setReason(tokens[3])
            .setMove(tokens[4]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.getActivePokemon();

        return new ActionMessageBuilder(tokens[1])
            .setPokemon(pokemon)
            .setEffect(action.reason)
            .setMove(action.move)
            .build();
    }

    doFail(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setEffect(tokens[3]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.getActivePokemon();

        return new ActionMessageBuilder(tokens[1])
            .setPokemon(pokemon)
            .setEffect(action.effect)
            .build();
    }

    doBlock(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setEffect(tokens[3])
            .setMove(tokens[4])
            .setAttacker(tokens[5])
            .setSource(tokens.find(token => token.includes("[of] ")));

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.getActivePokemon();

        return new ActionMessageBuilder(tokens[1])
            .setPokemon(pokemon)
            .setEffect(action.effect)
            .setMove(action.move)
            .setSource(action.source)
            .build();
    }

    doMiss(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setTarget(tokens[3]);

        let targetOwner = this.getTrainerByPnum(action.getTargetOwner());
        let target = targetOwner.pokemonByPosition.get(action.getTargetPosition());

        return new ActionMessageBuilder(tokens[1])
            .setPokemon(target)
            .setSource(action.pokemon)
            .build();
    }

    doHealOrDamage(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setHpStatus(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.getActivePokemon();

        let hpTokens = action.getHp().split("/");
        pokemon.currentHp = hpTokens[0];
        pokemon.maxHp = hpTokens[1];

        return new ActionMessageBuilder(tokens[1])
            .setPokemon(pokemon)
            .setEffect(action.effect)
            .setSource(action.source)
            .build();
    }

    doSetHp(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setHp(tokens[3]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.pokemonByPosition.get(action.getPokemonPosition());
        pokemon.currentHp = action.hp;

        return "N/A";
    }

    doStatus(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setStatus(tokens[3]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.pokemonByPosition.get(action.getPokemonPosition());

        pokemon.status = action.status;

        return new ActionMessageBuilder('start')
            .setPokemon(pokemon)
            .setEffect(action.status)
            .build();
    }

    doCureStatus(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setStatus(tokens[3]);

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.pokemonByPosition.get(action.getPokemonPosition());

        if (pokemon.status == action.status) {
            pokemon.status = undefined;
        }

        return new ActionMessageBuilder('end')
            .setPokemon(pokemon)
            .setEffect(action.status)
            .build();
    }

    doBoost(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setStat(tokens[3])
            .setAmount(tokens[1] == '-boost' ? parseInt(tokens[4]) : -parseInt(tokens[4]))
            .setItem(tokens.find(token => token.includes("[from] item: ")));

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.pokemonByPosition.get(action.getPokemonPosition());

        let stat = action.stat;
        let amount = action.amount;

        if (!pokemon.boosts.has(stat)) {
            pokemon.boosts.set(stat, 0);
        }
        let boost = parseInt(pokemon.boosts.get(stat));
        pokemon.boosts.set(stat, boost + amount);

        let actionName = action.amount < 0 ? 'unboost' : 'boost';
        if (action.amount == 0 || action.amount > 1) {
            actionName += Math.min(3, action.amount);
        }
        if (action.item) {
            actionName += "FromItem";
        }

        return new ActionMessageBuilder(actionName)
            .setPokemon(pokemon)
            .setItem(action.item)
            .setStat(action.stat)
            .build();
    }

    doSetBoost(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setStat(tokens[3])
            .setAmount(parseInt(tokens[4]))
            .setMove(tokens.find(token => token.includes("[from] move: ")))
            .setAbility(tokens.find(token => token.includes("[from] ability: ")));

        let trainer = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = trainer.pokemonByPosition.get(action.getPokemonPosition());

        pokemon.boosts.set(action.stat, action.amount);

        return new ActionMessageBuilder('boost')
            .setPokemon(pokemon)
            .setEffect([action.move, action.ability].find(item => item != undefined))
            .setStat(action.stat)
            .build();
    }

    doSwapBoost(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2])
            .setTarget(tokens[3])
            .setStats(tokens[4]);

        let sourceOwner = this.getTrainerByPnum(action.getPokemonOwner());
        let source = sourceOwner.pokemonByPosition.get(action.getPokemonPosition());

        let targetOwner = this.getTrainerByPnum(action.getTargetOwner());
        let target = targetOwner.pokemonByPosition.get(action.getTargetPosition());

        for (let stat of action.stats.split(",")) {
            stat = stat.trim();
            let temp = source.boosts.get(stat);
            source.boosts.set(stat, target.boosts.get(stat));
            if (source.boosts.get(stat) == undefined) {
                source.boosts.delete(stat);
            }
            target.boosts.set(stat, temp);
            if (target.boosts.get(stat) == undefined) {
                target.boosts.delete(stat);
            }
        }

        return new ActionMessageBuilder('swapBoost')
            .setPokemon(source)
            .build();
    }

    doInvertBoost(tokens) {
        let action = new ShowdownAction(tokens[1])
            .setPokemon(tokens[2]);

        let pokemonOwner = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = pokemonOwner.pokemonByPosition.get(action.getPokemonPosition());

        for (let stat of pokemon.boosts.keys()) {
            pokemon.boosts.set(stat, -pokemon.boosts.get(stat));
        }

        return new ActionMessageBuilder('invertBoost')
            .setPokemon(pokemon)
            .build();
    }

    doClearBoost(tokens) {
        let action = new ShowdownAction('clearBoost')
            .setPokemon(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        let pokemonOwner = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = pokemonOwner.pokemonByPosition.get(action.getPokemonPosition());

        let sourceOwner;
        let source;
        if (action.source) {
            sourceOwner = this.getTrainerByPnum(action.getSourceOwner());
            source = sourceOwner.pokemonByPosition.get(action.getSourcePosition());
        }

        for (let stat of pokemon.boosts.keys()) {
            pokemon.boosts.delete(stat);
        }

        return new ActionMessageBuilder('clearBoost')
            .setPokemon(pokemon)
            .setEffect(action.effect)
            .setSource(source)
            .build();
    }

    doClearAllBoost(tokens) {
        for (let trainer of this.battle.trainers.values()) {
            for (let pokemon of trainer.pokemon.values()) {
                for (let stat of pokemon.boosts.keys()) {
                    pokemon.boosts.delete(stat);
                }
            }
        }

        return new ActionMessageBuilder('clearAllBoost')
            .build();
    }

    doClearPositiveBoost(tokens) {
        let action = new ShowdownAction('clearBoost')
            .setPokemon(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        let pokemonOwner = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = pokemonOwner.pokemonByPosition.get(action.getPokemonPosition());

        let sourceOwner;
        let source;
        if (action.source) {
            sourceOwner = this.getTrainerByPnum(action.getSourceOwner());
            source = sourceOwner.pokemonByPosition.get(action.getSourcePosition());
        }

        for (let stat of pokemon.boosts.keys()) {
            if (pokemon.boosts.get(stat) > 0) {
                pokemon.boosts.delete(stat);
            }
        }

        return new ActionMessageBuilder('clearBoost')
            .setPokemon(pokemon)
            .setEffect(action.effect)
            .setSource(source)
            .build();
    }

    doClearNegativeBoost(tokens) {
        let action = new ShowdownAction('clearBoost')
            .setPokemon(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        let pokemonOwner = this.getTrainerByPnum(action.getPokemonOwner());
        let pokemon = pokemonOwner.pokemonByPosition.get(action.getPokemonPosition());

        let sourceOwner;
        let source;
        if (action.source) {
            sourceOwner = this.getTrainerByPnum(action.getSourceOwner());
            source = sourceOwner.pokemonByPosition.get(action.getSourcePosition());
        }

        for (let stat of pokemon.boosts.keys()) {
            if (pokemon.boosts.get(stat) < 0) {
                pokemon.boosts.delete(stat);
            }
        }

        return new ActionMessageBuilder('clearBoost')
            .setPokemon(pokemon)
            .setEffect(action.effect)
            .setSource(source)
            .build();
    }

    getTrainerFromPositionSpecifier(position) {
        const regex = /(p\d+)/;
        let pnum = regex.exec(position)[1];
        let id = this.battle.trainersByPnum.get(pnum);
        return this.battle.trainers.get(id);
    }

    getTrainerByPnum(position) {
        let id = this.battle.trainersByPnum.get(position);
        return this.battle.trainers.get(id);
    }

    doPlayer(tokens) {
        this.battle.trainersByPnum.set(tokens[2], tokens[3]);
    }

    updatePokemonHp(pokemon, details) {
        const hpRegex = /(\d+\/\d+).*/;
        let hp = hpRegex.exec(details)[1];
        let hpTokens = hp.split("/");
        pokemon.currentHp = hpTokens[0];
        pokemon.maxHp = hpTokens[1];
    }

    getPokemonLabel(name, gender) {
        let label = `${name.trim()}`;
        if (gender && gender.trim().toUpperCase() == "M") {
            label += " (M)"
        }
        else if (gender && gender.trim().toUpperCase() == "F") {
            label += " (F)";
        }
        return label;
    }

    doWeather(tokens) {
        let message = "";

        if (tokens.length >= 5 && tokens[4].includes("[of]") && tokens[3].includes("[from] ability")) {
            const pokemonRegex = /\[of\] p\d+[a-c]: (.*)/;
            let pokemon = pokemonRegex.exec(tokens[4])[1];

            const abilityRegex = /\[from\] ability: (.*)/;
            let ability = abilityRegex.exec(tokens[3])[1];

            message += `__${pokemon}'s ${ability}\n__`;

            switch (tokens[2]) {
                case "Sandstorm":
                    this.battle.weather = "Sandstorm";
                    message += "A sandstorm kicked up!";
                    break;
                case "SunnyDay":
                    this.battle.weather = "Sun";
                    message += "The sunlight turned harsh";
                    break;
            }
        }

        if (tokens.length >= 4 && tokens[3].includes("[upkeep]")) {
            switch(tokens[2]) {
                case "SunnyDay":
                    message = "The sun continues to shine.";
                    break;
                case "Sandstorm":
                    message = "The sandstorm rages.";
                    break;
            }
        }

        return message;
    }

    doTurn(tokens) {
        let numBuffer = 50;
        let message = "```=";
        let turnMarker = tokens[2] == 1 ? "[Battle Start]" : `[End Turn ${tokens[2] - 1}]`
        message += turnMarker;
        for (let i = 0; i < numBuffer - 1 - turnMarker.length; i++) {
            message += "=";
        }
        message += "\n";
        for (let team of this.battle.teams) {
            for (let trainer of team) {
                message += `${trainer.name}: `;
                let activePokemon = trainer.getActivePokemon();
                message += `${activePokemon.species} (${activePokemon.gender})`;
                let hpPercent = (activePokemon.currentHp / activePokemon.maxHp * 100).toFixed(2) + '%';
                message += ` ${hpPercent}`;

                let first = true;
                let boostOrder = [ "atk", "def", "spa", "spd", "spe", "accuracy", "evasion" ];
                let boosts = Array.from(activePokemon.boosts.keys()).sort((a, b) => {
                    return boostOrder.indexOf(a) - boostOrder.indexOf(b);
                });
                for (let stat of boosts) {
                    let boost = activePokemon.boosts.get(stat);
                    if (boost != 0) {
                        if (first) {
                            message += " ";
                            first = false;
                        }
                        let statName = Showdown.default.Dex.textCache.Default[stat].statName;
                        if (boost > 0) {
                            message += `[${statName}+${boost}]`;
                        }
                        else {
                            message += `[${statName}${boost}]`;
                        }
                    }
                }

                if (activePokemon.status != undefined) {
                    if (first) {
                        message += " ";
                        first = false;
                    }
                    message += `[${activePokemon.status.toUpperCase()}]`;
                }

                for (let status of activePokemon.volatileStatuses) {
                    if (first) {
                        message += " ";
                        first = false;
                    }
                    if (status == 'confusion') {
                        message += `[Confused]`;
                    }
                    else { 
                        message += `[${status}]`;
                    }
                }

                for (let status of trainer.statuses) {
                    if (first) {
                        message += " ";
                        first = false;
                    }
                    message += `[${status}]`;
                }
            }
            message += "\n";
        }
        if (this.battle.weather != undefined) {
            message += `[${this.battle.weather}]\n`;
        }
        for (let i = 0; i < numBuffer; i++) {
            message += "=";
        }
        message += "\n```";
        message += `**Select your action for turn ${tokens[2]}!**\n`;
        message += "Use `/move` to choose a move.\n";
        message += "Use `/switch` to switch Pokémon.\n";
        message += "Use `/stats` to view your team.\n";
        message += "Use `/ff` to forfeit.\n";

        this.battle.awaitingChoices = new Map();
        for (let trainer of this.battle.trainers.values()) {
            this.battle.awaitingChoices.set(trainer.id, {
                type: "move"
            });
        }

        return message;
    }

    sendMoves() {
        let trainer1 = this.battle.teams[0][0];
        this.stream.write(`>p1 move ${trainer1.move}`);   
        let trainer2 = this.battle.teams[1][0];
        this.stream.write(`>p2 move ${trainer2.move}`);   
    }

    doSideStatus(tokens) {
        let trainer = this.getTrainerFromPositionSpecifier(tokens[2]);
        
        let status = "";
        let message = undefined;

        if (tokens.length >= 4 && tokens[3].includes("move: ")) {
            const moveRegex = /move: (.*)/;
            status = moveRegex.exec(tokens[3])[1];
            let startText = getMoveText(status).start;

            if (startText != undefined) {
                message = startText.replaceAll("[TEAM]", `${trainer.name}'s team`);
            }
        }

        trainer.statuses.push(status);
        return message;
    }

    endSideStatus(tokens) {
        let trainer = this.getTrainerFromPositionSpecifier(tokens[2]);

        let status = "";
        let message = undefined;

        if (tokens.length >= 4 && tokens[3].includes("move: ")) {
            const moveRegex = /move: (.*)/;
            status = moveRegex.exec(tokens[3])[1];
            let endText = getMoveText(status).end;

            if (endText != undefined) {
                message = endText.replaceAll("[TEAM]", `${trainer.name}'s team`);
            }
        }

        let index = trainer.statuses.indexOf(status);
        trainer.statuses = [...trainer.statuses.slice(0, index), ...trainer.statuses.slice(index + 1)];
        return message;
    }

    doVolatileStatus(tokens) {
        let trainer = this.getTrainerFromPositionSpecifier(tokens[2]);
        let pokemon = trainer.getActivePokemon();

        let status = "";
        let message = undefined;
        if (tokens.length >= 4 && tokens[3].includes("move: ")) {
            const moveRegex = /move: (.*)/;
            status = moveRegex.exec(tokens[3])[1];

            switch(status) {
                case 'Leech Seed': 
                    message = `${pokemon.getName()} was seeded!`;
                    break;
            }
        }
        else if (tokens.length >= 4) {
            status = tokens[3];
            switch(status) {
                case 'confusion': 
                    message = `${pokemon.getName()} became confused!`;
                    break;
            }
        }

        pokemon.volatileStatuses.push(status);
        return message;
    }

    endVolatileStatus(tokens) {
        let trainer = this.getTrainerFromPositionSpecifier(tokens[2]);
        let pokemon = trainer.getActivePokemon();

        let status = tokens[3];

        let index = pokemon.volatileStatuses.indexOf(status);
        pokemon.volatileStatuses = [...pokemon.volatileStatuses.slice(0, index), ...pokemon.volatileStatuses.slice(index + 1)];

        if (status == "Leech Seed") {
            return `${pokemon.getName()} is no longer seeded!`;
        }
        if (status == "confusion") {
            return `${pokemon.getName()} snapped out of its confusion!`;
        }
    }
}

export function createStream(battle, threadId) {
    let stream = new BattleBotStream(battle, threadId);
    streams.set(battle.id, stream);
    return stream;
}