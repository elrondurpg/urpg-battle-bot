import { Battle } from "../../../../models/battle.js";
import { Pokemon } from "../../../../models/pokemon.js";
import { Trainer } from "../../../../models/trainer.js";
import { BadRequestError } from "../../../../utils/bad-request-error.js";
import { ABILITY_SERVICE, ITEM_SERVICE, TYPE_SERVICE } from "../../../app/dependency-injection.js";
import { ShowdownStreamWrapper } from "../../showdown-stream-wrapper.js";

const _streams = new Map();

export function get(battleId) {
    let stream = _streams.get(battleId.toString());
    if (stream) {
        let battle = stream._stream.battle;
        return buildResponse(battle);
    }
}

export async function create(room) {
    if (_streams.has(room.id)) {
        throw new BadRequestError("A battle with that ID is already in progress!");
    }

    let stream = new ShowdownStreamWrapper(room);
    _streams.set(room.id.toString(), stream);

    if (room.options['inputLog']) {
        await stream.resume(room.options['inputLog']);
    }
    else {
        await stream.start();
    }
}

export async function chooseLead(battleId, userId, team) {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.userId == userId);
    if (stream) {
        stream.write(`>${trainer.id} team ${team}`);
    }
}

export async function move(battleId, userId, move, modifier = "") {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.userId == userId);
    if (stream) {
        stream.write(`>${trainer.id} move ${move} ${modifier}`);
    }
    return buildResponse(stream._stream.battle);
}

export async function switchPokemon(battleId, userId, pokemonId) {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.userId == userId);
    if (stream) {
        stream.write(`>${trainer.id} switch ${pokemonId}`);
    }
}

export async function forfeit(battleId, userId) {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.userId == userId);
    if (stream) {
        stream.write(`>forcelose ${trainer.id}`);
        return true;
    }
}

function buildResponse(battle) {
    let response = new Battle();
    response.inputLog = battle.inputLog;
    response.trainers = battle.sides.map(side => buildTrainer(side));
    return response;
}

function buildTrainer(side) {
    let trainer = new Trainer();
    trainer.id = side.userId;
    trainer.pokemon = side.pokemon.map(pokemon => buildPokemon(pokemon));
    trainer.active = trainer.pokemon.filter(pokemon => pokemon.isActive);
    trainer.zMoveUsed = side.zMoveUsed;
    trainer.dynamaxUsed = side.dynamaxUsed;
    trainer.canDynamaxNow = side.canDynamaxNow();
    trainer.terastallizationUsed = side.terastallizationUsed;
    trainer.megaEvolutionUsed = side.megaEvolutionUsed;
    trainer.awaitingChoice = buildAwaitingChoice(side.activeRequest);   
    trainer.name = side.name;
    return trainer;
}

function buildAwaitingChoice(request) {
    if (request) {
        if (request.active) {
            return {
                type: "move",
                choices: request.active[0].moves.map(move => move.id)
            };
        }
        else if (request.forceSwitch && request.forceSwitch[0]) {
            return{
                type: "switch"
            };
        }
        else if (request.teamPreview) {
            return {
                type: "lead"
            };
        }
    }
}

function buildPokemon(pokemon) {
    let response = new Pokemon();
    response.id = pokemon.id;
    response.name = pokemon.name;
    response.isActive = pokemon.isActive;
    response.illusion = pokemon.illusion;
    response.illusionRevealed = pokemon.illusionRevealed;
    response.revealed = pokemon.revealed;
    response.previouslySwitchedIn = pokemon.previouslySwitchedIn;
    response.lastIllusion = pokemon.lastIllusion;
    response.species = pokemon.species.name;
    response.baseSpecies = pokemon.species.baseSpecies;
    response.originalSpecies = pokemon.baseSpecies.name;
    response.gender = pokemon.gender;
    response.ability = ABILITY_SERVICE.get(pokemon.ability).name;
    response.item = ITEM_SERVICE.get(pokemon.item).name;
    response.hp = pokemon.hp;
    response.maxhp = pokemon.maxhp;
    response.boosts = pokemon.boosts;
    response.status = pokemon.status;
    response.volatiles = pokemon.volatiles;
    response.terastallized = pokemon.terastallized;
    response.hpType = TYPE_SERVICE.get(pokemon.hpType).name;
    response.teraType = TYPE_SERVICE.get(pokemon.teraType).name;
    response.conversionType = TYPE_SERVICE.get(pokemon.conversionType).name;
    response.useGmaxForm = pokemon.useGmaxForm;
    response.fainted = pokemon.fainted;
    response.moves = pokemon.getMoves().map(move => ({
        id: move.id,
        name: move.move,
        disabled: move.disabled
    }));
    response.volatiles = pokemon.volatiles;
    response.zMoves = pokemon.battle.actions.canZMove(pokemon);
    response.canDynamaxNow = pokemon.getDynamaxRequest(false);
    if (pokemon.lastMove) {
        response.lastMove = {
            id: pokemon.lastMove.id,
            name: pokemon.lastMove.name,
            isZ: pokemon.lastMove.isZ
        };
    }
    response.canUltraBurst = pokemon.canUltraBurst;
    response.canMegaEvo = pokemon.canMegaEvo;
    response.trapped = pokemon.trapped;
    return response;
}