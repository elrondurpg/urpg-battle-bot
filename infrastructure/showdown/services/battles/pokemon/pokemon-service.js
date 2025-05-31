import { Pokemon } from "../../../../../models/pokemon.js";
import { ABILITY_SERVICE, ITEM_SERVICE, BATTLE_SERVICE, TYPE_SERVICE } from "../../../../app/dependency-injection.js";

export function get(battleId, trainerId) {
    let stream = BATTLE_SERVICE.get(battleId);
    let battle = stream._stream.battle;
    let side = battle.sides.find(side => side.userId == trainerId);
    return side.pokemon.map(pokemon => buildResponse(pokemon));
}

export function build(pokemon) {
    return buildResponse(pokemon);
}

function buildResponse(pokemon) {
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