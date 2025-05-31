import { Battle } from "../../../../models/battle.js";
import { Trainer } from "../../../../models/trainer.js";
import { BadRequestError } from "../../../../utils/bad-request-error.js";
import { BATTLES_POKEMON_SERVICE } from "../../../app/dependency-injection.js";
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
    trainer.pokemon = side.pokemon.map(pokemon => BATTLES_POKEMON_SERVICE.build(pokemon));
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