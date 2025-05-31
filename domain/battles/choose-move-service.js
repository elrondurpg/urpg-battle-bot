import { BATTLE_ROOM_DATA, MOVE_SERVICE, BATTLE_SERVICE } from "../../infrastructure/app/dependency-injection.js";
import { BadRequestError } from "../../utils/bad-request-error.js";
import * as BATTLE_VALIDATOR from "./battle-validations.js";

export async function chooseMove(roomId, trainerId, request) {
    let room = await BATTLE_ROOM_DATA.get(roomId);
    BATTLE_VALIDATOR.validateBattleRoom(room);
    BATTLE_VALIDATOR.validateBattleRoomHasTrainer(room, trainerId);

    let trainer = BATTLE_SERVICE.get(roomId).trainers.find(trainer => trainer.id == trainerId);
    BATTLE_VALIDATOR.validateTrainerWaitingForChoiceType(trainer, "move");

    let pokemon = trainer.active[0];
    let moveName = request.move.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase();

    if (pokemon.volatiles.mustrecharge) {
        failIfMustRecharge(request, pokemon, moveName);
    }
    else {
        const move = MOVE_SERVICE.get(moveName);
        failIfMustStruggle(pokemon, move);
        failIfSendingAnotherMoveWhileUsingTwoTurnMove(pokemon, move);
        failIfEncorePreventsMove(pokemon, move);
        failIfViolateOhkoClause(room, move);
        failIfMoveNotKnown(trainer, moveName);
        failIfTauntPreventsMove(pokemon, request, move);
        failIfTormentPreventsMove(pokemon, move, request);
        failIfMoveDisabled(pokemon, move);
        failIfViolateChoiceItem(pokemon, move);    
        failIfZMoveSentDirectly(move);
    }
    failIfMoreThanOneModifierSelected(request);
    if (request.shouldDynamax) {
        failIfCantDynamax(room, trainer, pokemon);
    }
    if (request.shouldMegaEvolve) {
        failIfCantMegaEvolve(room, trainer, pokemon);
    }
    if (request.shouldUltraBurst) {
        failIfCantUltraBurst(room, trainer, pokemon);
    }
    if (request.shouldTerastallize) {
        failIfCantTerastallize(room, trainer);
    }
    if (request.shouldZMove) {
        failIfCantUseZMove(room, trainer, pokemon, moveName);
    }

    room.lastActionTime = process.hrtime.bigint();
    let modifier = request.shouldDynamax ? "max"
        : request.shouldMegaEvolve ? "mega"
        : request.shouldUltraBurst ? "ultra"
        : request.shouldTerastallize ? "terastal"
        : request.shouldZMove ? "zmove"
        : "";
    await BATTLE_SERVICE.move(room.id, trainer.id, request.move, modifier);
    await BATTLE_ROOM_DATA.save(room);
}

function failIfCantMegaEvolve(room, trainer, pokemon) {
    if (room.rules.megasAllowed) {
        if (trainer.megaEvolutionUsed) {
            throw new BadRequestError(`You can only Mega Evolve once per battle!`);
        }
        else if (room.rules.worldCoronationClause && (trainer.dynamaxUsed || trainer.terastallizationUsed || trainer.zMoveUsed)) {
            throw new BadRequestError(`You can only use one of the following per battle in a World Coronation Series match: Dynamax, Mega Evolve, Terastallize, Use Z-Move!`);
        }
        else {
            if (!pokemon.canMegaEvo) {
                throw new BadRequestError(`Can't move: ${pokemon.name} can't mega evolve.`);
            }
        }
    }
    else {
        throw new BadRequestError(`Mega Evolving is not allowed in this battle!`);
    }
}

function failIfCantUltraBurst(room, trainer, pokemon) {
    if (room.rules.megasAllowed) {
        if (trainer.megaEvolutionUsed) {
            throw new BadRequestError(`You can only Mega Evolve once per battle! (Ultra Burst counts as Mega Evolution in URPG.)`);
        }
        else if (room.rules.worldCoronationClause && (trainer.dynamaxUsed || trainer.terastallizationUsed || trainer.zMoveUsed)) {
            throw new BadRequestError(`You can only use one of the following per battle in a World Coronation Series match: Dynamax, Mega Evolve (or Ultra Burst), Terastallize, Use Z-Move!`);
        }
        else {
            if (!pokemon.canUltraBurst) {
                throw new BadRequestError(`Can't move: ${pokemon.name} can't Ultra Burst.`);
            }
        }
    }
    else {
        throw new BadRequestError(`Ultra Burst is not allowed in this battle because Mega Evolving is not allowed!`);
    }
}

function failIfMoreThanOneModifierSelected(request) {
    let modifiers = [
        request.shouldDynamax,
        request.shouldMegaEvolve,
        request.shouldUltraBurst,
        request.shouldTerastallize,
        request.shouldZMove
    ];
    if (modifiers.filter(Boolean).length > 1) {
        throw new BadRequestError(`You can only choose one of the following per turn: Dynamax, Mega Evolve, Ultra Burst, Terastallize, Use Z-Move!`);
    }
}

function failIfZMoveSentDirectly(move) {
    if (move.isZ) {
        throw new BadRequestError(`To use a Z-Move, use \`/move\` to choose the base move and submit \`z-move = True\`!`);
    }
}

function failIfViolateChoiceItem(pokemon, move) {
    if (pokemon.volatiles.choicelock) {
        if (move.id != pokemon.volatiles.choicelock.move && move.id != 'struggle') {
            let requiredMove = MOVE_SERVICE.get(pokemon.volatiles.choicelock.move);
            throw new BadRequestError(`**${pokemon.species}'s choices are restricted by its item!**\nUse ${requiredMove.name} this turn.`);
        }
    }
}

function failIfMoveDisabled(pokemon, move) {
    if (pokemon.volatiles.disable && move.id == pokemon.volatiles.disable.move) {
        throw new BadRequestError(`**${pokemon.species}'s ${move.name} is disabled!**\nUse another move this turn.`);
    }
}

function failIfTormentPreventsMove(pokemon, move, request) {
    if (pokemon.volatiles.torment && pokemon.lastMove && move.id == pokemon.lastMove.id && !pokemon.lastMove.isZ == !request.shouldZMove) {
        throw new BadRequestError(`**${pokemon.species} can't use ${move.name} after the Torment!**\nUse another move this turn.`);
    }
}

function failIfTauntPreventsMove(pokemon, request, move) {
    if (pokemon.volatiles.taunt) {
        if (!request.shouldZMove && move.category === 'Status' && move.id !== 'mefirst') {
            throw new BadRequestError(`**${pokemon.species} can't use ${move.name} after the Taunt!**\nUse another move this turn.`);
        }
    }
}

function failIfMoveNotKnown(trainer, moveName) {
    let choices = trainer.awaitingChoice.choices;
    if (!choices.includes(moveName)) {
        let renamedChoices = choices.map(choice => MOVE_SERVICE.get(choice).name);
        if (renamedChoices.length == choices.length) {
            choices = renamedChoices;
        }
        throw new BadRequestError(`Your Pokémon either doesn't know that move or can't use it this turn! Choose one of the following: ` + choices.sort().join(", "));
    }
}

function failIfViolateOhkoClause(room, move) {
    if (room.rules.ohkoClause && move.ohko) {
        throw new BadRequestError(`You can't select ${move.name} when OHKO Clause is on!`);
    }
}

function failIfEncorePreventsMove(pokemon, move) {
    if (pokemon.volatiles.encore) {
        if (move.id != pokemon.volatiles.encore.move && move.id != 'struggle') {
            let requiredMove = MOVE_SERVICE.get(pokemon.volatiles.encore.move);
            throw new BadRequestError(`**${pokemon.species} must do an encore!**\nUse ${requiredMove.name} this turn.`);
        }
    }
}

function failIfSendingAnotherMoveWhileUsingTwoTurnMove(pokemon, move) {
    if (pokemon.volatiles.twoturnmove) {
        if (move.id != pokemon.volatiles.twoturnmove.move) {
            let requiredMove = MOVE_SERVICE.get(pokemon.volatiles.twoturnmove.move);
            throw new BadRequestError(`**${pokemon.species} is using a two-turn move!**\nUse ${requiredMove.name} this turn.`);
        }
    }
}

function failIfMustRecharge(request, pokemon, moveName) {
    if (pokemon.volatiles.mustrecharge && moveName != "recharge") {
        throw new BadRequestError(`**${pokemon.species} is recharging!**\nUse Recharge this turn.`);
    }
    if (request.shouldDynamax || request.shouldMegaEvolve || request.shouldTerastallize || request.shouldUltraBurst || request.shouldZMove) {
        throw new BadRequestError(`**${pokemon.species} is recharging!**\nUse Recharge without any modifiers this turn.`)
    }
}

function failIfMustStruggle(pokemon, move) {
    if (pokemon.moves.length == 0 && move.id != "struggle") {
        throw new BadRequestError(`**${pokemon.species} has no moves left!**\nUse Struggle this turn.`);
    }
}

function failIfCantTerastallize(room, trainer) {
    if (room.rules.teraAllowed) {
        if (trainer.terastallizationUsed) {
            throw new BadRequestError(`You can only Terastallize once per battle!`);
        }
        else if (room.rules.worldCoronationClause && (trainer.dynamaxUsed || trainer.megaEvolutionUsed || trainer.zMoveUsed)) {
            throw new BadRequestError(`You can only use one of the following per battle in a World Coronation Series match: Dynamax, Mega Evolve, Terastallize, Use Z-Move!`);
        }
    }
    else {
        throw new BadRequestError(`Terastallizing is not allowed in this battle!`);
    }
}

function failIfCantUseZMove(room, trainer, pokemon, moveName) {
    if (room.rules.zmovesAllowed) {
        if (trainer.zMoveUsed) {
            throw new BadRequestError(`You can only use a Z-Move once per battle!`);
        }
        else if (room.rules.worldCoronationClause && (trainer.dynamaxUsed || trainer.megaEvolutionUsed || trainer.terastallizationUsed)) {
            throw new BadRequestError(`You can only use one of the following per battle in a World Coronation Series match: Dynamax, Mega Evolve, Terastallize, Use Z-Move!`);
        }
        else {
            if (pokemon.zMoves) {
                let baseMove = pokemon.zMoves.find(zMove => zMove && zMove.baseMove && zMove.baseMove.replaceAll(/[^A-Za-z0-9]/g, "").toLowerCase() == moveName.trim().toLowerCase());
                if (!baseMove) {
                    throw new BadRequestError(`Can't move: ${pokemon.name} can't use that move as a Z-Move.`);
                }
            }
            else {
                throw new BadRequestError(`Can't move: ${pokemon.name} can't use a Z-Move.`);
            }
        }
    }
    else {
        throw new BadRequestError(`Z-Moves are not allowed in this battle!`);
    }
}

function failIfCantDynamax(room, trainer, pokemon) {
    if (room.rules.dynamaxAllowed) {
        if (trainer.dynamaxUsed) {
            throw new BadRequestError(`You can only Dynamax once per battle!`);
        }
        else if (room.rules.worldCoronationClause && (trainer.megaEvolutionUsed || trainer.terastallizationUsed || trainer.zMoveUsed)) {
            throw new BadRequestError(`You can only use one of the following per battle in a World Coronation Series match: Dynamax, Mega Evolve, Terastallize, Use Z-Move!`);
        }
        else {
            if (!pokemon.canDynamaxNow) {                 
                if (trainer.canDynamaxNow) {
                    throw new BadRequestError(`${pokemon.name} can't Dynamax now!`);
                } 
                throw new BadRequestError(`Can't move: You can only Dynamax once per battle.`);
            }
        }
    }
    else {
        throw new BadRequestError(`Dynamaxing is not allowed in this battle!`);
    }
}