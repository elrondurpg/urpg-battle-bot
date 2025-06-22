export const GENERATIONS = [ "Standard"/*, "GSC", "RSE", "XY", "SM", "SwSh", "SV"*/ ];
export const BATTLE_TYPES = [ "Singles"/*, "Doubles", "FFA "*/];
export const SEND_TYPES = [ /*"Public",*/ "Private" ];
export const TEAM_TYPES = [ /*"Open",*/ "Full", "Preview" ];
export const STARTING_WEATHERS = [ "None", "Rain Dance", "Sunny Day", "Hail", "Snow", "Sandstorm"  ];
export const STARTING_TERRAINS = [ "Building", "Cave", "Ice", "Puddles", "Sand/Badlands", "Tall Grass", "Snow", "Water", "Volcano", "Burial Grounds", "Soaring", "Space" ];
import { PLAYER_EXPECTED_ACTION_SERVICE } from "../infrastructure/app/dependency-injection.js";
import { capitalize } from "../utils.js";

export class BattleRoom {
    options = {};
    consumerId;
    id;
    ownerId;
    teams = [];
    rules;

    trainers = new Map();
    expectedActions = new Map();

    lastActionTime;
    archived = false;

    getNumPlayersNeeded() {
        return this.rules.numTeams * this.rules.numTrainersPerTeam - this.trainers.size;
    }

    getOpenRoomMessage() {
        let message = `Battle room created by <@${this.ownerId}>\n\n`;
        message += "**Rules**\n";
        message += this.getRulesMessage();

        let numPlayersNeeded = this.getNumPlayersNeeded();
        if (numPlayersNeeded == 1) {
            message += `\n\n**Looking for ${this.getNumPlayersNeeded()} opponent!**\n`;
        }
        else if (numPlayersNeeded > 1) {
            message += `\n\n**Looking for ${this.getNumPlayersNeeded()} opponents!**\n`;
        }
        if (numPlayersNeeded > 0) {
            message += "Use the \`/join\` command to join this battle.";
        }
        return message;
    }

    getRulesMessage() {
        let message = "";
        let generation = capitalize(this.rules.generation);
        let sendType = capitalize(this.rules.sendType);
        let teamType = capitalize(this.rules.teamType);
        let battleType = capitalize(this.rules.battleType);
        message += `${this.rules.numPokemonPerTrainer}v${this.rules.numPokemonPerTrainer} ${generation} ${sendType} ${teamType} ${battleType}\n`;

        if (this.rules.itemsAllowed) {
            message += "Helds ON\n";
        }

        let simpleClauseMessage = getSimpleClauseMessage(this.rules);
        if (simpleClauseMessage != undefined) {
            message += simpleClauseMessage + "\n";
        }

        if (this.rules.worldCoronationClause == true) {
            message += "World Coronation Series rules ON";
        }
        else {
            let gimmickMessage = getGimmickMessage(this.rules);
            if (gimmickMessage != undefined) {
                message += gimmickMessage;
            }
        }

        if (this.rules.rentalClause == true) {
            message += "\nRental Clause ON";
        }

        return message;
    }

    getBattleStartMessage() {
        return `**Battle Start:** <@${this.teams[0][0]}> vs. <@${this.teams[1][0]}>\n\n`;
    }
    
    sendWaitingForSendsMessages() {
        for (let [id, trainer] of this.trainers) {
            let numPokemonToSend = this.rules.numPokemonPerTrainer - trainer.pokemon.size;
            if (numPokemonToSend > 0) {
                if (this.rules.teamType == "full") {
                    PLAYER_EXPECTED_ACTION_SERVICE.createSendExpectMessageForFullTeam(this, id, numPokemonToSend);
                }
                else {
                    PLAYER_EXPECTED_ACTION_SERVICE.createSendExpectMessageForTeamPreview(this, id, numPokemonToSend);
                }
            }
        }
    }

    getPackedTeam(trainerId) {
        let packedTeam = "";
        let trainer = this.trainers.get(trainerId);
        let size = trainer.pokemon.size;
        let i = 0;
        for (let pokemon of trainer.pokemon.values()) {
            packedTeam += this.getPackedPokemon(pokemon);
            if (i != size - 1) {
                packedTeam += `]`;
            }
            i++;
        }
        return packedTeam;
    }

    getPackedPokemon(pokemon) {
        let packedPokemon = `${pokemon.id}|`;
        if (pokemon.nickname) {
            // nickname|species| --only NICKNAME is filled in if the species is the same
            packedPokemon += `${pokemon.nickname}|${pokemon.species}|`;
        }
        else {
            // nickname|species| --only NICKNAME is filled in if the species is the same
            packedPokemon += `${pokemon.species}||`;
        }
        // item
        packedPokemon += `${pokemon.item != undefined ? pokemon.item : ''}|`;
        // ability
        packedPokemon += `${pokemon.ability}|`;
        // moves
        packedPokemon += `|`;
        // nature
        packedPokemon += `Quirky|`;
        // EVs
        packedPokemon += `252,252,252,252,252,252|`;
        // gender
        packedPokemon += `${pokemon.gender}|`;
        // IVs -- blank for all 31s
        packedPokemon += `|`;
        // Shiny, Level (100), Happiness (255) all left blank for defaults
        packedPokemon += `||,`;
        // Hidden Power Type
        packedPokemon += `${pokemon.hiddenPowerType != undefined ? pokemon.hiddenPowerType : ''},`;
        // Pokeball left blank for default
        packedPokemon += `,`;
        // Gigantamax
        packedPokemon += `${pokemon.useGmaxForm ? 'G' : ''},`;
        // DynamaxLevel left blank
        packedPokemon += `,`;
        // Tera Type 
        packedPokemon += `${pokemon.teraType != undefined ? pokemon.teraType : ''},`;
        // Conversion Type
        packedPokemon += `${pokemon.conversionType != undefined ? pokemon.conversionType : ''}`;
        return packedPokemon;
    }
}

export class BattleRules {
    generation;
    battleType;
    numTeams;
    numTrainersPerTeam;
    numPokemonPerTrainer;
    sendType;
    teamType;
    startingWeather = null;
    startingTerrain = null;
    ohkoClause = true;
    accClause = true;
    evaClause = true;
    sleepClause = true;
    freezeClause = true;
    speciesClause = true;
    itemsAllowed = false;
    itemClause = true;
    megasAllowed = true;
    zmovesAllowed = true;
    dynamaxAllowed = true;
    teraAllowed = true;
    worldCoronationClause = true;
    legendsAllowed = true;
    randomClause = false;
    inversionClause = false;
    skyClause = false;
    gameboyClause = false;
    wonderLauncherClause = false;
    rentalClause = true;
}

export class BattleIdCollisionError extends Error {}



function getSimpleClauseMessage(rules) {
    let simpleClauses = [];
    if (rules.ohkoClause == true) {
        simpleClauses.push("OHKO");
    }
    if (rules.accClause == true) {
        simpleClauses.push("ACC");
    }
    if (rules.evaClause == true) {
        simpleClauses.push("EVA");
    }
    if (rules.sleepClause == true) {
        simpleClauses.push("Sleep");
    }
    if (rules.freezeClause == true) {
        simpleClauses.push("Freeze");
    }
    if (rules.speciesClause == true) {
        simpleClauses.push("Species");
    }
    if (rules.itemsAllowed && rules.itemClause) {
        simpleClauses.push("Item");
    }
    if (simpleClauses.length > 0) {
        let simpleClauseMessage = "";
        for (let i = 0; i < simpleClauses.length; i++) {
            simpleClauseMessage += simpleClauses[i];
            if (i < simpleClauses.length - 1) {
                simpleClauseMessage += "/";
            }
        }
        return simpleClauseMessage + " Clauses ON";
    }
    else {
        return undefined;
    }
}

function getGimmickMessage(rules) {
    let clauses = [];
    if (rules.megasAllowed == true) {
        clauses.push("Mega Evolution");
    }
    if (rules.zmovesAllowed == true) {
        clauses.push("Z-Moves");
    }
    if (rules.dynamaxAllowed == true) {
        clauses.push("Dynamax");
    }
    if (rules.teraAllowed == true) {
        clauses.push("Terastallization");
    }
    if (clauses.length > 0) {
        let message = "";
        for (let i = 0; i < clauses.length; i++) {
            message += clauses[i];
            if (i < clauses.length - 1) {
                message += ", ";
            }
        }
        return message + " ALLOWED";
    }
    else {
        return undefined;
    }
}