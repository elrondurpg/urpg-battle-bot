import { Species } from "../../../../models/species.js";
import * as Showdown from "urpg-battle-bot-calc";
import { BadRequestError } from "../../../../utils/bad-request-error.js";

export function get(name) {
    const species = Showdown.default.Dex.species.get(name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase());
    if (name && (!species.exists || (species.isNonstandard && species.isNonstandard != 'Past'))) {
        throw new BadRequestError(`There is no species named ${species.exists ? species.name : name}!`);
    }
    return buildResponse(species);
}

export function getForGen(name, gen) {
    const species = Showdown.default.Dex.mod(gen).species.get(name.toLowerCase());
    if (name && (!species.exists || (species.isNonstandard && species.isNonstandard != 'Past'))) {
        throw new BadRequestError(`There is no species named ${species.exists ? species.name : name}!`);
    }
    return buildResponse(species);
}

function buildResponse(species) {
    let response = new Species();
    response.name = species.name;
    response.num = species.num;
    response.gender = species.gender;
    response.battleOnly = species.battleOnly;
    response.changesFrom = species.changesFrom;
    response.prevo = species.prevo;
    response.forme = species.forme;
    response.learnset = buildLearnset(species);
    response.types = species.types.map(type => type);
    response.hp = species.hp
    response.atk = species.atk
    response.def = species.def
    response.spa = species.spa
    response.spd = species.spd
    response.spe = species.spe;
    response.baseSpecies = species.baseSpecies;
    response.tags = species.tags.map(tag => tag);
    response.abilities = Object.values(species.abilities);
    return response;
}

function buildLearnset(species) {
    let tempSpecies = species;
    if (species.battleOnly != undefined) {
        tempSpecies = get(species.battleOnly);
    }

    let knownMoves = new Set();

    let dexEntry = Showdown.default.Dex.dataCache.Learnsets[tempSpecies.name.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase()];
    if (dexEntry) {
        let learnset = dexEntry.learnset;
        if (learnset) {
            knownMoves = [...knownMoves, ...Object.keys(learnset)];
        }
        if (tempSpecies.changesFrom) {
            let changesFromSpecies = get(tempSpecies.changesFrom);

            if (changesFromSpecies.learnset) {
                knownMoves = [...knownMoves, ...Object.keys(changesFromSpecies.learnset)];
                let currSpecies = changesFromSpecies;
                while (currSpecies.prevo) {
                    let prevo = get(currSpecies.prevo);
                    if (prevo.learnset) {
                        knownMoves = [...knownMoves, ...Object.keys(prevo.learnset)];
                    }
                    currSpecies = prevo;
                }
            }
        }
        else {
            let currSpecies = tempSpecies;
            while (currSpecies.prevo) {
                let prevo = get(currSpecies.prevo);
                if (prevo.learnset != undefined) {
                    knownMoves = [...knownMoves, ...Object.keys(prevo.learnset)];
                }
                currSpecies = prevo;
            }
        }
    }

    return knownMoves;
}