import { Type } from "../../../../models/type.js";
import * as Showdown from "urpg-battle-bot-calc";

export function get(name) {
    const type = Showdown.default.Dex.types.get(name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase());
    if (name && !type.exists) {
        throw new BadRequestError(`There is no type named ${type.exists ? type.name : name}!`);
    }
    return buildResponse(type);
}

function buildResponse(type) {
    let response = new Type();
    response.name = type.name;
    return response;
}