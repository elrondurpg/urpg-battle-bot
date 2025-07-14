import Sim from 'urpg-battle-bot-calc';
import { BATTLE_ROOM_DATA, BATTLE_ROOM_SERVICE, BATTLES_MESSAGES_SERVICE, BATTLES_SYNCHRONOUS_MESSAGES_SERVICE, PLAYER_EXPECTED_ACTION_SERVICE } from '../app/dependency-injection.js';
import { FlavorTextUtility } from './utils/showdown-message-processor.js';
import * as Showdown from "urpg-battle-bot-calc";

export class ShowdownStreamWrapper {
    _room;
    _stream;
    splitPlayer;
    splitCount = 0;
    flavorTextUtil;

    constructor(room) {
        this._room = room;
        this._stream = new Sim.BattleStream();
        this.flavorTextUtil = new FlavorTextUtility(this._stream);
    }

    write(s) {
        this._stream.write(s);
    }

    async waitForInput() {
        for await (const output of this._stream) {
            let lines = output.split("\n");
            for (let line of lines) {
                if (this.splitPlayer) {
                    this.splitCount++;
                }
                if (!this.splitPlayer || this.splitCount == 2) {
                    let tokens = line.split("|");
                    let message;
                    
                    if (this.splitPlayer && this.splitCount == 1) {
                        message = undefined;
                    }
                    else if (tokens.length > 1 && tokens[1] == 'split') {
                        this.splitPlayer = tokens[2];
                        this.splitCount = 0;
                    }
                    else if (tokens.length > 1 && tokens[1] == 'turn') {
                        message = this.doTurn(tokens[2]);
                    }
                    else if (tokens.length > 1 && tokens[1] == 'teampreview') {
                        message = this.getTeamPreviewMessage();
                    }
                    else if (tokens.length > 1 && tokens[1] == 'request') {
                        if (!tokens.includes("[silent]")) {
                            message = this.doRequest(JSON.parse(tokens[2]));
                        }
                    }
                    else if (tokens.length > 1 && tokens[1] == 'win') {
                        message = await this.doWin(tokens[2]);
                    }
                    else {
                        message = this.flavorTextUtil.handleMessage(line);
                    }
                    if (message && !tokens.includes("[silent]")) {
                        await BATTLES_MESSAGES_SERVICE.create(this._room, message);
                    }
                }
                if (this.splitCount == 2) {
                    this.splitPlayer = undefined;
                    this.splitCount = 0;
                }
            }
            if (!this._stream) {
                break;
            }
        }
    }

    async resume(inputLog) {
        let response = await BATTLES_SYNCHRONOUS_MESSAGES_SERVICE.create(this._room, "**The battle resumed!**");

        if (response) {
            (async () => this.waitForInput())();
            this._stream.write(">mute");
            for (let line of inputLog) {
                this._stream.write(line);
            }
            this._stream.write(">unmute");
            let showdownBattle = this._stream.battle;

            if (!showdownBattle.ended) {
                if (showdownBattle.turn > 0) {
                    await BATTLES_MESSAGES_SERVICE.create(this._room, this.doTurn(showdownBattle.turn));
                }
                for (let request of showdownBattle.getRequests(showdownBattle.requestState)) {
                    this.doRequest(request);
                }
            } 
        }
    }

    async start() {       
        let trainer1 = this._room.trainers.get(this._room.teams[0][0]);
        let packedTeam1 = this._room.getPackedTeam(trainer1.id);
        
        let trainer2 = this._room.trainers.get(this._room.teams[1][0]);
        let packedTeam2 = this._room.getPackedTeam(trainer2.id);

        (async () => this.waitForInput())();
    
        this._stream.write(`>start {"formatid":"[Gen 9] Custom Game", "rules":${JSON.stringify(this._room.rules)}}`);
        if (trainer1.name == trainer2.name) {
            trainer2.name = trainer2.name + " B";
            BATTLES_MESSAGES_SERVICE.create(this._room, `<@${trainer2.id}> will be referred to as ${trainer2.name} in this battle.`);
        }
        this._stream.write(`>player p1 {"name":"${trainer1.name}", "userId":"${trainer1.id}", "team":"${packedTeam1}"}`);
        this._stream.write(`>player p2 {"name":"${trainer2.name}", "userId":"${trainer2.id}", "team":"${packedTeam2}"}`);
        await BATTLE_ROOM_DATA.save(this._room);
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
        let teamType = this._room.rules.teamType.toLowerCase();
        if (teamType == "preview") {
            for (let side of this._stream.battle.sides) {
                message += `**${side.name}'s Team**\n\`\`\``;
                for (let pokemon of side.pokemon) {
                    let currentSpecies = pokemon.species;
                    let currentBaseSpecies = currentSpecies.baseSpecies;
                    let originalSpecies = pokemon.baseSpecies.name;
                    let isAltered = pokemon.species.name != pokemon.baseSpecies.name;
                    let isAlternateForm = currentBaseSpecies && currentBaseSpecies == originalSpecies;
                    if (pokemon.name != pokemon.species && (currentBaseSpecies == undefined || pokemon.name != currentBaseSpecies)) {
                        message += `${pokemon.name} the `
                    }
                    message += `${pokemon.species.name}`;
                    message += `${isAltered && !isAlternateForm ? ` [base: ${pokemon.baseSpecies.name}]` : ''}`;
                    message += `${pokemon.gender ? " " + pokemon.gender : ""}\n`;
                }
                message += "\`\`\`\n";
            }
        }
        else if (teamType == "open") {

        }
        else {
            message += "**Teams Set!**\n\n";
        }

        return message;
    }

    doRequest(request) {
        let trainer = this._stream.battle.sides.find(trainer => trainer.id == request.side.id);
        if (trainer) {
            if (request.active) {
                PLAYER_EXPECTED_ACTION_SERVICE.createMoveExpectMessage(this._room, trainer.userId, this._stream.battle.turn);
            }
            else if (request.forceSwitch && request.forceSwitch[0]) {
                PLAYER_EXPECTED_ACTION_SERVICE.createSwitchExpectMessage(this._room, trainer.userId);
                return this.doTurn(this._stream.battle.turn);
            }
            else if (request.teamPreview) {
                PLAYER_EXPECTED_ACTION_SERVICE.createLeadExpectMessage(this._room, trainer.userId);
            }
        }
    }

    doTurn(turnNumber) {
        let numBuffer = 50;
        let message = "```=";
        let turnMarker = turnNumber == 1 ? "[Battle Start]" : `[Turn ${turnNumber}]`
        message += turnMarker;
        for (let i = 0; i < numBuffer - 1 - turnMarker.length; i++) {
            message += "=";
        }
        message += "\n";

        for (let trainer of this._stream.battle.sides) {      
            let first = true;     
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
                    let volatile = activePokemon.volatiles[status];
                    if (status == 'lockedmove') {
                        let moveId = volatile.move;
                        if (moveId) {
                            let move = Showdown.default.Dex.textCache.Moves[moveId];
                            if (move) {
                                tag = move.name;
                            }
                        }
                    }
                    else {
                        let volatileText = Showdown.default.Dex.textCache.Default[status];
                        if (volatileText) {
                            let volatileName = volatileText.volatileName;
                            if (volatileName) {
                                tag = volatileName;
                            }
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

        if (this._stream.battle.field.weather) {
            isAnyFieldEffectPresent = true;
            let weather = Showdown.default.Dex.textCache.Default[this._stream.battle.field.weather].weatherName;
            message += `[${weather}]`;
        }

        if (this._stream.battle.field.terrain) {
            isAnyFieldEffectPresent = true;
            let terrain = Showdown.default.Dex.textCache.Default[this._stream.battle.field.terrain].terrainName;
            message += `[${terrain}]`;
        }

        for (let pseudoWeather of Object.keys(this._stream.battle.field.pseudoWeather)) {
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

    async doWin(winnerName) {
        await BATTLE_ROOM_SERVICE.completeBattle(this._room.id, winnerName);
        this._stream = undefined;

        let message = `**${winnerName} wins!**`;
        return message;
    }
}