import Sim from 'urpg-battle-bot-calc';
import { BattlePacker } from './BattlePacker.js';
import { MESSAGE_SERVICE } from '../../dependency-injection.js';
import { BATTLE_SERVICE } from '../../dependency-injection.js';
import { ShowdownMessageTranslator } from './ShowdownMessageTranslator.js';
import * as Showdown from "urpg-battle-bot-calc";

export const streams = new Map();

export class BattleBotStream {
    battle;
    messageOptions;
    packer;
    stream;
    splitPlayer;
    splitCount = 0;
    translator;

    constructor(battle, messageOptions) {
        this.battle = battle;
        this.messageOptions = messageOptions;
        this.packer = new BattlePacker(battle);
        this.stream = new Sim.BattleStream();
        this.translator = new ShowdownMessageTranslator(battle);
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
                    //console.log(line);
                    let tokens = line.split("|");
                    let message;
                    if (tokens.length > 1 && tokens[1] == 'turn') {
                        message = this.doTurn(tokens);
                    }
                    else if (tokens.length > 1 && tokens[1] == 'teampreview') {
                        message = this.getTeamPreviewMessage();
                    }
                    else if (tokens.length > 1 && tokens[1] == 'request') {
                        message = this.doRequest(tokens);
                    }
                    else if (tokens.length > 1 && tokens[1] == 'win') {
                        message = this.doWin(tokens);
                    }
                    else {
                        message = this.translator.handleMessage(line);
                    }
                    if (message) {
                        //console.log(message);
                        await MESSAGE_SERVICE.sendMessage(message, this.messageOptions);
                    }
                }
                if (!this.stream) {
                    break;
                }
            }
        })();
    
        this.stream.write(`>start {"formatid":"[Gen 9] Custom Game", "rules":${JSON.stringify(this.battle.rules)}}`);
        if (trainer1.name == trainer2.name) {
            trainer2.name = trainer2.name + " B";
            MESSAGE_SERVICE.sendMessage(`<@${trainer2.id}> will be referred to as ${trainer2.name} in this battle.`, this.messageOptions);
        }
        this.stream.write(`>player p1 {"name":"${trainer1.name}", "discordId":"${trainer1.id}", "team":"${packedTeam1}"}`);
        this.stream.write(`>player p2 {"name":"${trainer2.name}", "discordId":"${trainer2.id}", "team":"${packedTeam2}"}`);
    }

    sendLead(trainerId) {
        let trainer = this.battle.trainers.get(trainerId); 
        let teamSpec = `${trainer.activePokemon}`;
        for (let i = 1; i < this.battle.rules.numPokemonPerTrainer + 1; i++) {
            if (i != trainer.activePokemon) {
                teamSpec += i;
            }
        }
        this.stream.write(`>${trainer.position} team ${teamSpec}`);   
    }

    getTrainerFromPositionSpecifier(position) {
        const regex = /(p\d+)/;
        let pnum = regex.exec(position)[1];
        return this.battle.trainersByPnum.get(pnum);
    }

    getTrainerByPnum(position) {
        return this.battle.trainersByPnum.get(position);
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

    getTeamPreviewMessage() {
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

        return message;
    }

    doRequest(tokens) {
        let request = JSON.parse(tokens[2]);
        let trainer = this.getTrainerFromPositionSpecifier(request.side.id);
        if (request.active) {
            let message = `**<@${trainer.id}>: Select your action for turn ${this.battle.turnNumber}!**\n`;
            message += "Use `/move` to choose a move.\n";
            message += "Use `/switch` to switch Pokémon.\n";
            message += "Use `/stats` to view your team.\n";
            message += "Use `/ff` to forfeit.\n";
            this.battle.awaitingChoices.set(trainer.id, {
                type: "move"
            });
            return message;
        }
        else if (request.forceSwitch && request.forceSwitch[0]) {
            this.battle.awaitingChoices.set(trainer.id, {
                type: "switch"
            });

            let message = `**<@${trainer.id}>: Choose which Pokémon to switch in!**\n`;
            message += "Use `/switch` to submit your choice.\n";
            message += "Use `/stats` to view your team.\n";
            return message;
        }
        else if (request.teamPreview) {
            this.battle.awaitingChoices.set(trainer.id, {
                type: "lead"
            });
            let message = `**<@${trainer.id}>: Choose your lead Pokémon!**\n`;
            message += "Use `/lead` to submit your choice.\n";
    
            let teamType = this.battle.rules.teamType.toLowerCase();
            if (teamType == "full") {
                message += "Use `/stats` to view your team.\n";
            }
            return message;
        }
    }

    doTurn(tokens) {
        let numBuffer = 50;
        let message = "```=";
        let turnMarker = tokens[2] == 1 ? "[Battle Start]" : `[End Turn ${tokens[2] - 1}]`
        this.battle.turnNumber = tokens[2];
        message += turnMarker;
        for (let i = 0; i < numBuffer - 1 - turnMarker.length; i++) {
            message += "=";
        }
        message += "\n";

        for (let trainer of this.stream.battle.sides) {           
            message += `${trainer.name}: `;
            let activePokemon = trainer.active[0];
            if (activePokemon) {
                if (activePokemon.illusion) {
                    let currentSpecies = activePokemon.illusion.species;
                    let currentBaseSpecies = currentSpecies.baseSpecies;
                    let originalSpecies = activePokemon.illusion.baseSpecies.name;
                    let isAltered = activePokemon.illusion.species.name != activePokemon.illusion.baseSpecies.name;
                    let isAlternateForm = currentBaseSpecies && currentBaseSpecies == originalSpecies;
                    if (activePokemon.illusion.name != activePokemon.illusion.species && (currentBaseSpecies == undefined || activePokemon.illusion.name != currentBaseSpecies)) {
                        message += `${activePokemon.illusion.name} the `
                    }
                    message += `${activePokemon.illusion.species.name}${activePokemon.illusion.gender ? " (" + activePokemon.illusion.gender + ")" : ""}`;
                    if (isAltered && !isAlternateForm) {
                        message += ` [base: ${activePokemon.illusion.baseSpecies.name}]`
                    }
                }
                else {
                    let currentSpecies = activePokemon.species;
                    let currentBaseSpecies = currentSpecies.baseSpecies;
                    let originalSpecies = activePokemon.baseSpecies.name;
                    let isAltered = activePokemon.species.name != activePokemon.baseSpecies.name;
                    let isAlternateForm = currentBaseSpecies && currentBaseSpecies == originalSpecies;
                    if (activePokemon.name != activePokemon.species && (currentBaseSpecies == undefined || activePokemon.name != currentBaseSpecies)) {
                        message += `${activePokemon.name} the `
                    }
                    message += `${activePokemon.species.name}${activePokemon.gender ? " (" + activePokemon.gender + ")" : ""}`;
                    if (isAltered && !isAlternateForm) {
                        message += ` [base: ${activePokemon.baseSpecies.name}]`
                    }
                }
            }
            else {
                message += `-- FNT --`;
            }
            let hpPercent = (activePokemon.hp / activePokemon.maxhp * 100).toFixed(2) + '%';
            message += ` ${hpPercent}`;

            let first = true;
            let boostOrder = [ "atk", "def", "spa", "spd", "spe", "accuracy", "evasion" ];
            let boosts = Array.from(Object.keys(activePokemon.boosts).sort((a, b) => {
                return boostOrder.indexOf(a) - boostOrder.indexOf(b);
            }));
            for (let stat of boosts) {
                let boost = activePokemon.boosts[stat];
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

            if (activePokemon.status) {
                if (first) {
                    message += " ";
                    first = false;
                }
                message += `[${activePokemon.status.toUpperCase()}]`;
            }

            for (let status of Object.keys(activePokemon.volatiles)) {
                if (first) {
                    message += " ";
                    first = false;
                }
                let tag = status;
                let volatile = Showdown.default.Dex.textCache.Default[status];
                if (volatile) {
                    let volatileName = volatile.volatileName;
                    if (volatileName) {
                        tag = volatileName;
                    }
                }
                if (tag != "[silent]") {
                    message += `[${tag}]`;
                }
            }

            if (activePokemon.terastallized) {
                if (first) {
                    message += " ";
                    first = false;
                }
                message += `[Tera: ${activePokemon.terastallized}]`;
            }

            for (let status of Object.keys(trainer.sideConditions)) {
                if (first) {
                    message += " ";
                    first = false;
                }
                let move = Showdown.default.Dex.textCache.Moves[status];
                if (move) {
                    status = move.name;
                }
                message += `[${status}]`;
            }
            message += "\n";
        }

        let isAnyFieldEffectPresent = false;

        if (this.stream.battle.field.weather) {
            isAnyFieldEffectPresent = true;
            let weather = Showdown.default.Dex.textCache.Default[this.stream.battle.field.weather].weatherName;
            message += `[${weather}]`;
        }

        if (this.stream.battle.field.terrain) {
            isAnyFieldEffectPresent = true;
            let terrain = Showdown.default.Dex.textCache.Default[this.stream.battle.field.terrain].terrainName;
            message += `[${terrain}]`;
        }

        for (let pseudoWeather of Object.keys(this.stream.battle.field.pseudoWeather)) {
            let pseudoWeatherName = Showdown.default.Dex.textCache.Default[pseudoWeather].effectName;
            if (pseudoWeatherName != '[silent]') {
                isAnyFieldEffectPresent = true;
                message += `[${pseudoWeatherName}]`;
            }
        }

        if (isAnyFieldEffectPresent) {
            message += '\n';
        }

        for (let i = 0; i < numBuffer; i++) {
            message += "=";
        }
        message += "\n```";

        return message;
    }

    doWin(tokens) {
        let trainer = tokens[2];
        let message = `**${trainer} wins!**`;

        // Output all rules


        // Output each trainer and their Pokemon
        /* e.g.
        
        Elrond wins and earns $4,000
        Infernape, Raichu, Gliscor, Roserade, Espeon, Volcarona
        
        Trainer 2 loses and earns $2,000
        Venusaur, Blastoise, Nidoking, Nidoqueen, Jynx, Gardevoir
        */

        // Output

        BATTLE_SERVICE.endBattle(this.battle.id);
        streams.delete(this.battle.id);
        this.stream = undefined;

        return message;
    }

    sendMove(trainerId) {
        let trainer = this.battle.trainers.get(trainerId); 
        if (trainer.move) {
            let modifier = "";
            if (trainer.mega) {
                modifier += " mega";
            }
            else if (trainer.ultra) {
                modifier += " ultra";
            }
            else if (trainer.zmove) {
                modifier += " zmove";
            }
            else if (trainer.max) {
                modifier += " max";
            }
            else if (trainer.terastallize) {
                modifier += " terastal";
            }
            this.stream.write(`>${trainer.position} move ${trainer.move}${modifier}`);
        }
        else if (trainer.switch) {
            this.stream.write(`>${trainer.position} switch ${trainer.switch}`);
        }
        trainer.mega = false;
        trainer.ultra = false;
        trainer.zmove = false;
        trainer.max = false;
        trainer.terastallize = false;
        trainer.move = undefined;
        trainer.switch = undefined;
    }

    /*sendMoves() {
        for (let side of this.stream.battle.sides) {
            let position = side.id;
            let trainer = this.battle.trainers.get(side.discordId);
            if (trainer.move) {
                let modifier = "";
                if (trainer.mega) {
                    modifier += " mega";
                }
                else if (trainer.ultra) {
                    modifier += " ultra";
                }
                else if (trainer.zmove) {
                    modifier += " zmove";
                }
                else if (trainer.max) {
                    modifier += " max";
                }
                else if (trainer.terastallize) {
                    modifier += " terastal";
                }
                this.stream.write(`>${position} move ${trainer.move}${modifier}`);
            }
            else if (trainer.switch) {
                this.stream.write(`>${position} switch ${trainer.switch}`);
            }
            trainer.mega = false;
            trainer.ultra = false;
            trainer.zmove = false;
            trainer.max = false;
            trainer.terastallize = false;
            trainer.move = undefined;
            trainer.switch = undefined;
        }
    }*/
}

export function createStream(battle, threadId) {
    let stream = new BattleBotStream(battle, threadId);
    streams.set(battle.id, stream);
    return stream;
}