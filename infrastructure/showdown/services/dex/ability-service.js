import { Ability } from "../../../../models/ability.js";
import * as Showdown from "urpg-battle-bot-calc";
import { BadRequestError } from "../../../../utils/bad-request-error.js";

export function get(name) {
    const ability = Showdown.default.Dex.abilities.get(name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase());
    if (name && (!ability.exists || (ability.isNonstandard && ability.isNonstandard != 'Past'))) {
        throw new BadRequestError(`There is no ability named ${ability.exists ? ability.name : name}!`);
    }
    return buildResponse(ability);
}

function buildResponse(ability) {
    let response = new Ability();
    response.name = ability.name;
    return response;
}