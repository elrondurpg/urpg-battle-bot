import { Battle } from "../../../../models/battle.js";
import { Trainer } from "../../../../models/trainer.js";
import { BadRequestError } from "../../../../utils/BadRequestError.js";
import { BATTLES_POKEMON_SERVICE } from "../../../app/dependency-injection.js";
import { BattleBotStream } from "../../stream.js";

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

    let stream = new BattleBotStream(room);
    _streams.set(room.id.toString(), stream);

    if (room.options['inputLog']) {
        await stream.resume(room.options['inputLog']);
    }
    else {
        await stream.start();
    }
}

export async function chooseLead(battleId, trainerDiscordId, team) {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.discordId == trainerDiscordId);
    if (stream) {
        stream.write(`>${trainer.id} team ${team}`);
    }
}

export async function move(battleId, trainerDiscordId, move, modifier = "") {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.discordId == trainerDiscordId);
    if (stream) {
        stream.write(`>${trainer.position} move ${move} ${modifier}`);
    }
}

export async function switchPokemon(battleId, trainerDiscordId, pokemonId) {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.discordId == trainerDiscordId);
    if (stream) {
        stream.write(`>${trainer.position} switch ${pokemonId}`);
    }
}

export async function forfeit(battleId, trainerDiscordId) {
    let stream = _streams.get(battleId.toString());
    let trainer = stream._stream.battle.sides.find(side => side.discordId == trainerDiscordId);
    if (stream) {
        stream.write(`>forcelose ${trainer.position}`);
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
    trainer.id = side.discordId;
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