import { BATTLE_ROOM_DATA, BATTLE_SERVICE, CONSUMER_DATA } from "../../infrastructure/app/dependency-injection.js";
import { PRESENTATION_SERVICE } from "../../infrastructure/app/presentation-service.js";
import { BattleCompletion, BattleParticipant, BattlePokemon } from "../../models/battle-completion.js";

export async function completeBattle(roomId, winnerName) {
    const completion = new BattleCompletion();

    const room = await BATTLE_ROOM_DATA.get(roomId);
    completion.room = room;

    const consumer = await CONSUMER_DATA.incrementNumCompletedBattles(room.consumerId);
    completion.battleNum = consumer.numCompletedBattles;
    completion.platform = consumer.platform;

    const battle = await BATTLE_SERVICE.get(roomId);

    let numFaintedPokemon = getGreatestNumFaintedPokemon(battle);

    const winner = battle.trainers.find(trainer => trainer.name == winnerName);
    const winnerParticipant = buildParticipant(winner);
    winnerParticipant.payment = getWinnerPayment(numFaintedPokemon);
    completion.winners = [ winnerParticipant ];

    const loser = battle.trainers.find(trainer => trainer.name != winnerName);
    const loserParticipant = buildParticipant(loser);
    loserParticipant.payment = getLoserPayment(numFaintedPokemon);
    completion.losers = [ loserParticipant ];

    PRESENTATION_SERVICE.doWin(completion);
    await BATTLE_ROOM_DATA.delete(room);
}

function getGreatestNumFaintedPokemon(battle) {
    return Math.max(...battle.trainers.map(trainer => getNumFaintedPokemon(trainer)));
}

function getNumFaintedPokemon(trainer) {
    return trainer.pokemon.filter(pokemon => pokemon.fainted).length;
}

function buildParticipant(participant) {
    const response = new BattleParticipant();
    response.name = participant.name;
    response.userId = participant.id;
    response.pokemon = [];
    for (let pokemon of participant.pokemon) {
        response.pokemon.push(buildPokemon(pokemon));
    }
    return response;
}

function buildPokemon(pokemon) {
    const battlePokemon = new BattlePokemon();
    if (pokemon.name != pokemon.species && (pokemon.baseSpecies == undefined || pokemon.name != pokemon.baseSpecies)) {
        battlePokemon.nickname = pokemon.name;
    }
    battlePokemon.species = pokemon.originalSpecies;
    battlePokemon.gender = pokemon.gender;
    battlePokemon.fainted = pokemon.fainted;
    battlePokemon.sent = pokemon.previouslySwitchedIn || pokemon.isActive;
    return battlePokemon;
}

function getWinnerPayment(numPokemonPerTrainer) {
    switch (numPokemonPerTrainer) {
        case 1: return 0;
        case 2: return 500;
        case 3: return 1000;
        case 4: return 1500;
        case 5: return 2000;
        case 6: return 2500;
    }
}

function getLoserPayment(numPokemonPerTrainer) {
    switch (numPokemonPerTrainer) {
        case 1: return 0;
        case 2: return 250;
        case 3: return 500;
        case 4: return 750;
        case 5: return 1000;
        case 6: return 1250;
    }
}