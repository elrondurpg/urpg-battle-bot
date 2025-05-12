import { BadRequestError } from "../utils/BadRequestError.js";
import * as Showdown from "urpg-battle-bot-calc";

export const GENERATIONS = [ "Standard"/*, "GSC", "RSE", "XY", "SM", "SwSh", "SV"*/ ];
export const BATTLE_TYPES = [ "Singles"/*, "Doubles", "FFA "*/];
export const SEND_TYPES = [ /*"Public",*/ "Private" ];
export const TEAM_TYPES = [ /*"Open",*/ "Full", "Preview" ];
export const STARTING_WEATHERS = [ "None", "Rain Dance", "Sunny Day", "Hail", "Snow", "Sandstorm"  ];
export const STARTING_TERRAINS = [ "Building", "Cave", "Ice", "Puddles", "Sand/Badlands", "Tall Grass", "Snow", "Water", "Volcano", "Burial Grounds", "Soaring", "Space" ];

export class Battle {
    options = {};
    id;
    ownerId;
    teams = [];
    rules;
    started = false;

    trainers = new Map();
    awaitingChoices = new Map();

    weather;
    stream;
    turnNumber;

    ended = false;
    readyToStart = false;
    lastAction;
    archived = false;

    resume() {

    }

    isWaitingForLeads() {
        return Array.from(this.awaitingChoices.values()).some(choice => choice.type == "lead");
    }

    isWaitingForSends() {
        return Array.from(this.awaitingChoices.values()).some(choice => choice.type == "send");
    }

    isWaitingForJoins() {
        return this.getNumPlayersNeeded() > 0;
    }

    getNumPlayersNeeded() {
        return this.rules.numTeams * this.rules.numTrainersPerTeam - this.trainers.size;
    }

    getShowdownBattle() {
        if (this.stream) {
            return this.stream.stream.battle;
        }
    }

    displayPokemonLearnset(trainerId, pokemonId) {
        let message = "";
        let battle = this.getShowdownBattle();
        let side = battle.sides.find(side => side.discordId == trainerId);
        let pokemon = side.pokemon.find(pokemon => pokemon.id == pokemonId);
        let currentSpecies = pokemon.species;
        let currentBaseSpecies = currentSpecies.baseSpecies;
        if (pokemon.name != pokemon.species && (currentBaseSpecies == undefined || pokemon.name != currentBaseSpecies)) {
            message += `${pokemon.name} the `
        }
        message += `**${pokemon.species.name}'s Moves**\n`;
        return message + "\`\`\`" + pokemon.moveSlots.map(slot => slot.move).sort().join(", ") + "\`\`\`\n";
    }

    getTeamPreviewMessage() {
        let message = "";

        let battle = this.getShowdownBattle();
        for (let side of battle.sides) {
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
            message += "\`\`\`";
        }
        return message;
    }

    getTrainerActivePokemon(trainerId) {
        let battle = this.getShowdownBattle();
        let side = battle.sides.find(side => side.discordId == trainerId);
        return side.active[0];
    }
    
    getTrainerPokemonById(trainerId) {
        let battle = this.getShowdownBattle();
        let side = battle.sides.find(side => side.discordId == trainerId);

        let positionsByPokemonId = new Map();
        for (let i = 0; i < side.pokemon.length; i++) {
            let pokemon = side.pokemon[i];
            positionsByPokemonId.set(pokemon.id, i+1);
        }

        let slots = new Map();
        for (let pokemon of side.pokemon) {
            let label = "";
            let currentSpecies = pokemon.species;
            let currentBaseSpecies = currentSpecies.baseSpecies;
            let originalSpecies = pokemon.baseSpecies.name;
            let isAltered = pokemon.species.name != pokemon.baseSpecies.name;
            let isAlternateForm = currentBaseSpecies && currentBaseSpecies == originalSpecies;
            if (pokemon.name != pokemon.species && (currentBaseSpecies == undefined || pokemon.name != currentBaseSpecies)) {
                label += `${pokemon.name} the `
            }
            label += `${pokemon.species.name}`;
            label += `${isAltered && !isAlternateForm ? ` [base: ${pokemon.baseSpecies.name}]` : ''}`;
            label += `${pokemon.gender ? " " + pokemon.gender : ""}, `;
            label += `${battle.dex.abilities.get(pokemon.ability.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}`;
            label += `${pokemon.item ? ` @ ${battle.dex.items.get(pokemon.item.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}` : ""}`;
            slots.set(positionsByPokemonId.get(pokemon.id), label);
        }
        return slots;
    }

    getNonActiveTrainerPokemonById(trainerId) {
        let battle = this.getShowdownBattle();
        let side = battle.sides.find(side => side.discordId == trainerId);
        let nonActivePokemon = side.pokemon.filter(pokemon => !pokemon.isActive && !pokemon.fainted);

        let positionsByPokemonId = new Map();
        for (let i = 0; i < side.pokemon.length; i++) {
            let pokemon = side.pokemon[i];
            if (!pokemon.isActive && !pokemon.isFainted) {
                positionsByPokemonId.set(pokemon.id, i+1);
            }
        }

        let slots = new Map();
        for (let pokemon of nonActivePokemon) {
            let label = "";
            let currentSpecies = pokemon.species;
            let currentBaseSpecies = currentSpecies.baseSpecies;
            let originalSpecies = pokemon.baseSpecies.name;
            let isAltered = pokemon.species.name != pokemon.baseSpecies.name;
            let isAlternateForm = currentBaseSpecies && currentBaseSpecies == originalSpecies;
            if (pokemon.name != pokemon.species && (currentBaseSpecies == undefined || pokemon.name != currentBaseSpecies)) {
                label += `${pokemon.name} the `
            }
            label += `${pokemon.species.name}`;
            label += `${isAltered && !isAlternateForm ? ` [base: ${pokemon.baseSpecies.name}]` : ''}`;
            label += `${pokemon.gender ? " " + pokemon.gender : ""}, `;
            label += `${battle.dex.abilities.get(pokemon.ability.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}`;
            label += `${pokemon.item ? ` @ ${battle.dex.items.get(pokemon.item.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}` : ""}`;
            slots.set(positionsByPokemonId.get(pokemon.id), label);
        }
        return slots;
    }

    printStatsFromTrainersPerspective(trainerId) {
        let message = "";
        let battle = this.getShowdownBattle();
        let sides = Array.from(battle.sides).sort((a, b) => {
            if (a.discordId == trainerId) {
                return -1;
            }
            else if (b.discordId == trainerId) {
                return 1;
            }
            else return a.name < b.name ? -1 : 1;
        });
        for (let side of sides) {
            message += this.printSideFromTrainersPerspective(side, trainerId);
        }
        return message;
    }
    
    printSideFromTrainersPerspective(side, trainerId) {
        let message = `**${side.name}'s Team**\n\`\`\``;
        let battle = this.getShowdownBattle();

        let sortedPokemon = side.discordId == trainerId 
            ? Array.from(side.pokemon).sort((a, b) => 
                {
                    if(a.isActive && !b.isActive) {
                        return -1;
                    }
                    else if (b.isActive && !a.isActive) {
                        return 1;
                    }
                    else return 0;
                })
            : side.pokemon;
        let firstActive = false;
        let firstBench = false;
        for (let pokemon of sortedPokemon) {
            if (side.discordId == trainerId) {
                if (!firstActive && pokemon.isActive) {
                    firstActive = true;
                    message += "\nActive Pokémon\n";
                    message += "--------------\n";
                }
                else if (!firstBench && !pokemon.isActive) {
                    firstBench = true;
                    if (side.discordId != trainerId) {
                        message += "\n";
                    }
                    message += "Benched Pokémon\n";
                    message += "---------------\n";
                }
            }
            //message += `${pokemon.id}: `;
            let teamType = battle.rules.teamType.toLowerCase()
            let shouldDisplay = true;
            if (side.discordId != trainerId && teamType != "preview") {
                let shouldDisplayCurrentIllusion = pokemon.isActive && pokemon.illusion && !pokemon.illusionRevealed;
                let shouldDisplayLastIllusion = !pokemon.isActive && !pokemon.revealed && pokemon.previouslySwitchedIn && !pokemon.illusionRevealed;
                if (shouldDisplayCurrentIllusion) {
                    pokemon = pokemon.illusion;
                }
                else if (shouldDisplayLastIllusion && pokemon.lastIllusion) {
                    shouldDisplay = false;
                }
                else {
                    shouldDisplay = pokemon.previouslySwitchedIn || pokemon.revealed;
                } 
            }
            if (shouldDisplay) {
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
                message += `${pokemon.gender ? " " + pokemon.gender : ""}`;
                if (side.discordId == trainerId) {
                    message += `, ${battle.dex.abilities.get(pokemon.ability.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}`;
                    message += `${pokemon.item != undefined ? ` @ ${battle.dex.items.get(pokemon.item.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}` : ""}`;
    
                    let hpPercent = (pokemon.hp / pokemon.maxhp * 100).toFixed(2) + '%';
                    message += ` ${hpPercent}`;
        
                    let first = true;
                    let boostOrder = [ "atk", "def", "spa", "spd", "spe", "accuracy", "evasion" ];
                    let boosts = Array.from(Object.keys(pokemon.boosts).sort((a, b) => {
                        return boostOrder.indexOf(a) - boostOrder.indexOf(b);
                    }));
                    for (let stat of boosts) {
                        let boost = pokemon.boosts[stat];
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
        
                    if (pokemon.status) {
                        if (first) {
                            message += " ";
                            first = false;
                        }
                        message += `[${pokemon.status.toUpperCase()}]`;
                    }
        
                    for (let status of Object.keys(pokemon.volatiles)) {
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
        
                    if (pokemon.terastallized) {
                        if (first) {
                            message += " ";
                            first = false;
                        }
                        message += `[Tera: ${pokemon.terastallized}]`;
                    }
                    message += "\n";
    
                    if (pokemon.hpType) {
                        message += `-> Hidden Power type: ${battle.dex.types.get(pokemon.hpType.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}\n`;
                    }
                    if (pokemon.teraType) {
                        message += `-> Tera type: ${battle.dex.types.get(pokemon.teraType.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}\n`;
                    }
                    if (pokemon.conversionType) {
                        message += `-> Conversion type: ${battle.dex.types.get(pokemon.conversionType.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()).name}\n`;
                    }
                    if (pokemon.useGmaxForm) {
                        message += `-> Gigantamax Form Enabled\n`;
                    }
                }
                message += "\n";
            }
            else {
                message += "???\n";
            }
        }
        return message + "\`\`\`";
    }

    tryDynamax(trainer) {
        let side = this.getShowdownBattle().sides.find(side => side.discordId == trainer.id);
        if (side.active[0].getDynamaxRequest(false)) {
            trainer.max = true;
        }
        else {                        
            if (side.canDynamaxNow()) {
                throw new BadRequestError(`${side.active[0].name} can't Dynamax now!`);
            } 
            throw new BadRequestError(`Can't move: You can only Dynamax once per battle.`);
        }
    }

    tryMegaEvolve(trainer) {
        let side = this.getShowdownBattle().sides.find(side => side.discordId == trainer.id);
        if (side.active[0].canMegaEvo) {
            trainer.mega = true;
        }
        else {        
            throw new BadRequestError(`Can't move: ${side.active[0].name} can't mega evolve.`);
        }
    }

    tryUltraBurst(trainer) {
        let side = this.getShowdownBattle().sides.find(side => side.discordId == trainer.id);
        if (side.active[0].canUltraBurst) {
            trainer.ultra = true;
        }
        else {        
            throw new BadRequestError(`Can't move: ${side.active[0].name} can't Ultra Burst.`);
        }
    }

    tryUseZMove(trainer, moveName) {
        let side = this.getShowdownBattle().sides.find(side => side.discordId == trainer.id);
        let zMoves = this.getShowdownBattle().actions.canZMove(side.active[0]);
        if (zMoves) {
            let baseMove = zMoves.find(zMove => zMove && zMove.baseMove && zMove.baseMove.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase() == moveName.trim().toLowerCase());
            if (baseMove) {
                trainer.zmove = true;
            }
            else {
                throw new BadRequestError(`Can't move: ${side.active[0].name} can't use that move as a Z-Move.`);
            }
        }
        else {
            throw new BadRequestError(`Can't move: ${side.active[0].name} can't use a Z-Move.`);
        }
    }

    setHasDynamaxed(trainerPosition) {
        let showdown = this.getShowdownBattle();
        let side = showdown.sides.find(side => side.id == trainerPosition);
        let trainer = this.trainers.get(side.discordId);
        trainer.hasDynamaxed = true;
    }

    setHasMegaEvolved(trainerPosition) {
        let showdown = this.getShowdownBattle();
        let side = showdown.sides.find(side => side.id == trainerPosition);
        let trainer = this.trainers.get(side.discordId);
        trainer.hasMegaEvolved = true;
    }

    setHasUsedZMove(trainerPosition) {
        let showdown = this.getShowdownBattle();
        let side = showdown.sides.find(side => side.id == trainerPosition);
        let trainer = this.trainers.get(side.discordId);
        trainer.hasUsedZMove = true;
    }

    setHasTerastallized(trainerPosition) {
        let showdown = this.getShowdownBattle();
        let side = showdown.sides.find(side => side.id == trainerPosition);
        let trainer = this.trainers.get(side.discordId);
        trainer.hasTerastallized = true;
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