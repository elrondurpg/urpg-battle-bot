import Sim from 'urpg-battle-bot-calc';
import { BattlePacker } from './BattlePacker.js';
import { BATTLE_DATA, BATTLE_SERVICE, MESSAGE_SERVICE } from '../../dependency-injection.js';
import { ShowdownMessageTranslator } from './ShowdownMessageTranslator.js';
import * as Showdown from "urpg-battle-bot-calc";

export class BattleBotStream {
    battle;
    packer;
    stream;
    splitPlayer;
    splitCount = 0;
    translator;

    constructor(battle) {
        this.battle = battle;
        this.packer = new BattlePacker(battle);
        this.stream = new Sim.BattleStream();
        this.translator = new ShowdownMessageTranslator(battle);
    }

    async waitForInput() {
        for await (const output of this.stream) {
            let lines = output.split("\n");
            for (let line of lines) {
                let tokens = line.split("|");
                let message;
                if (tokens.length > 1 && tokens[1] == 'turn') {
                    message = this.doTurn(tokens[2]);
                }
                else if (tokens.length > 1 && tokens[1] == 'teampreview') {
                    message = this.getTeamPreviewMessage();
                }
                else if (tokens.length > 1 && tokens[1] == 'request') {
                    message = this.doRequest(JSON.parse(tokens[2]));
                }
                else if (tokens.length > 1 && tokens[1] == 'win') {
                    message = await this.doWin(tokens);
                }
                else {
                    message = this.translator.handleMessage(line);
                }
                if (message && !tokens.includes("[silent]")) {
                    //console.log(message);
                    await MESSAGE_SERVICE.sendMessageWithOptions(message, this.battle.options);
                }
            }
            if (!this.stream) {
                break;
            }
        }
    }

    async resume(inputLog) {
        (async () => this.waitForInput())();
        this.stream.write(">mute");
        for (let line of inputLog) {
            //console.log(line);
            this.stream.write(line);
        }
        this.stream.write(">unmute");
        await MESSAGE_SERVICE.sendMessageWithOptions("**The battle resumed!**", this.battle.options);

        let showdownBattle = this.battle.getShowdownBattle();
        // IF the battle isn't over
        if (showdownBattle.turn > 0) {
            await MESSAGE_SERVICE.sendMessageWithOptions(this.doTurn(showdownBattle.turn), this.battle.options);
        }
        for (let request of showdownBattle.getRequests(showdownBattle.requestState)) {
            let message = this.doRequest(request);
            await MESSAGE_SERVICE.sendMessageWithOptions(message, this.battle.options);
        }

        // If the battle is over, output a victory message and then delete the battle
    }

    async sendStart() {       
        let trainer1 = this.battle.trainers.get(this.battle.teams[0][0]);
        trainer1.position = 'p1';
        let packedTeam1 = this.packer.getPackedTeam(trainer1.id);
        
        let trainer2 = this.battle.trainers.get(this.battle.teams[1][0]);
        trainer2.position = 'p2';
        let packedTeam2 = this.packer.getPackedTeam(trainer2.id);

        (async () => this.waitForInput())();
    
        this.stream.write(`>start {"formatid":"[Gen 9] Custom Game", "rules":${JSON.stringify(this.battle.rules)}}`);
        if (trainer1.name == trainer2.name) {
            trainer2.name = trainer2.name + " B";
            MESSAGE_SERVICE.sendMessageWithOptions(`<@${trainer2.id}> will be referred to as ${trainer2.name} in this battle.`, this.battle.options);
        }
        this.stream.write(`>player p1 {"name":"${trainer1.name}", "discordId":"${trainer1.id}", "team":"${packedTeam1}"}`);
        this.stream.write(`>player p2 {"name":"${trainer2.name}", "discordId":"${trainer2.id}", "team":"${packedTeam2}"}`);
        await BATTLE_DATA.save(this.battle);
    }

    async sendLead(trainerId) {
        let trainer = this.battle.trainers.get(trainerId); 
        let teamSpec = `${trainer.activePokemon}`;
        for (let i = 1; i < this.battle.rules.numPokemonPerTrainer + 1; i++) {
            if (i != trainer.activePokemon) {
                teamSpec += i;
            }
        }
        this.stream.write(`>${trainer.position} team ${teamSpec}`); 
        await BATTLE_DATA.save(this.battle);
    }

    getTrainerFromPositionSpecifier(position) {
        const regex = /(p\d+)/;
        let pnum = regex.exec(position)[1];
        let trainerEntry = Array.from(this.battle.trainers).find(entry => entry[1].position == pnum);
        if (trainerEntry) {
            return trainerEntry[1];
        }
    }

    getTrainerByPnum(position) {
        return Array.from(this.battle.trainers).find(entry => entry[1].position == position);
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
            message += this.battle.getTeamPreviewMessage();
        }
        else if (teamType == "open") {

        }
        else {
            message += "**Teams Set!**\n\n";
        }

        return message;
    }

    doRequest(request) {
        let trainer = this.getTrainerFromPositionSpecifier(request.side.id);
        if (trainer) {
            if (request.active) {
                let message = `**<@${trainer.id}>: Select your action for turn ${this.battle.turnNumber}!**\n`;
                message += "Use `/move` to choose a move.\n";
                message += "Use `/switch` to switch Pokémon.\n";
                message += "Use `/help` to view other available commands.\n";
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
                message += "Use `/help` to view other available commands.\n";
                return message;
            }
            else if (request.teamPreview) {
                this.battle.awaitingChoices.set(trainer.id, {
                    type: "lead"
                });
                let message = `**<@${trainer.id}>: Choose your lead Pokémon!**\n`;
                message += "Use `/lead` to submit your choice.\n";
                message += "Use `/help` to view other available commands.\n";
                return message;
            }
        }
    }

    doTurn(turnNumber) {
        let numBuffer = 50;
        let message = "```=";
        let turnMarker = turnNumber == 1 ? "[Battle Start]" : `[End Turn ${turnNumber - 1}]`
        this.battle.turnNumber = turnNumber;
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
            }
            else {
                message += `-- FNT --`;
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

    async doWin(tokens) {
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

        await BATTLE_SERVICE.endBattle(this.battle.id);
        this.stream = undefined;

        return message;
    }

    async sendMove(trainerId) {
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
        await BATTLE_DATA.save(this.battle);
    }

    sendForfeit(trainerId) {
        let trainer = this.battle.trainers.get(trainerId); 
        this.stream.write(`>forcelose ${trainer.position}`);
        MESSAGE_SERVICE.sendMessageWithOptions(`${trainer.name} has decided to forfeit.`, this.battle.options);
    }
}

export async function createStream(battle, options) {
    let stream = new BattleBotStream(battle);
    battle.stream = stream;
    if (options.inputLog) {
        stream.resume(options.inputLog);
    }
    else {
        await stream.sendStart();
    }
    return stream;
}