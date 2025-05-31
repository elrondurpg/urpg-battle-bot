import { Item } from "../../../../models/item.js";
import * as Showdown from "urpg-battle-bot-calc";
import { BadRequestError } from "../../../../utils/BadRequestError.js";

export function get(name) {
    const item = Showdown.default.Dex.items.get(name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase());  
    if (name && (!item.exists || (item.isNonstandard && item.isNonstandard != 'Past'))) {
        throw new BadRequestError(`There is no held item named ${item.exists ? item.name : name}!`);
    }
    return buildResponse(item);
}

function buildResponse(item) {
    let response = new Item();
    response.name = item.name;
    return response;
}