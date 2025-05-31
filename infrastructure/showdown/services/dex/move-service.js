import { Move } from "../../../../models/move.js";
import * as Showdown from "urpg-battle-bot-calc";
import { BadRequestError } from "../../../../utils/BadRequestError.js";

export function get(name) {
    const move = Showdown.default.Dex.dataCache.Moves[name];
    if (name && (!move || (move.isNonstandard && move.isNonstandard != 'Past'))) {
        throw new BadRequestError(`There is no move named ${move ? move.name : name}!`);
    }
    return buildResponse(move);
}

function buildResponse(move) {
    let response = new Move();
    response.id = move.name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase();
    response.name = move.name;
    response.type = move.type;
    response.ohko = move.ohko;
    response.isMax = move.isMax;
    response.category = move.category;
    response.isZ = move.isZ;
    return response;
}