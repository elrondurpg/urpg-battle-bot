import { BadRequestError } from "../../utils/bad-request-error.js";
import { BATTLE_SERVICE } from "../app/dependency-injection.js";

export function getOptionValue(options, name) {
  for (let option of options) {
    if (option.name === name) {
      return option.value;
    }
  }
}

export function getInvalidChannelMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: "This is not a battle thread!",
            flags: InteractionResponseFlags.EPHEMERAL
        }
    });
}

export function getPokemonChoicesByPosition(battleId, trainerId, filterCallback) {
  let battle = BATTLE_SERVICE.get(battleId);
  if (battle) {
      let trainer = battle.trainers.find(trainer => trainer.id == trainerId);
      if (trainer) {
          let pokemon = trainer.pokemon;

          let positionsByPokemonId = new Map();
          for (let i = 0; i < pokemon.length; i++) {
              let pkmn = pokemon[i];
              positionsByPokemonId.set(pkmn.id, i+1);
          }

          if (filterCallback) {
            pokemon = pokemon.filter(filterCallback);
          }

          let slots = new Map();
          for (let pkmn of pokemon) {
              let label = "";
              let isAltered = pkmn.species != pkmn.originalSpecies;
              let isAlternateForm = pkmn.baseSpecies && pkmn.baseSpecies == pkmn.originalSpecies;
              if (pkmn.name != pkmn.species && (pkmn.baseSpecies == undefined || pkmn.name != pkmn.baseSpecies)) {
                  label += `${pkmn.name} the `
              }
              label += `${pkmn.species}`;
              label += `${isAltered && !isAlternateForm ? ` [base: ${pkmn.originalSpecies}]` : ''}`;
              label += `${pkmn.gender ? " " + pkmn.gender : ""}, `;
              label += `${pkmn.ability}`;
              label += `${pkmn.item ? ` @ ${pkmn.item}` : ""}`;
              slots.set(positionsByPokemonId.get(pkmn.id), label);
          }
          return slots;
      }
      else {
          throw new BadRequestError("You are not involved in this battle!");
      }
  }
  else {
      throw new BadRequestError(`There's no battle happening in this thread. Any previous battle in this thread has finished!`);
  }    
}

export function getPokemonChoicesById(battleId, trainerId, filterCallback) {
  let battle = BATTLE_SERVICE.get(battleId);
  if (battle) {
      let trainer = battle.trainers.find(trainer => trainer.id == trainerId);
      if (trainer) {
          let pokemon = trainer.pokemon;

          if (filterCallback) {
            pokemon = pokemon.filter(filterCallback);
          }

          let slots = new Map();
          for (let pkmn of pokemon) {
              let label = "";
              let isAltered = pkmn.species != pkmn.originalSpecies;
              let isAlternateForm = pkmn.baseSpecies && pkmn.baseSpecies == pkmn.originalSpecies;
              if (pkmn.name != pkmn.species && (pkmn.baseSpecies == undefined || pkmn.name != pkmn.baseSpecies)) {
                  label += `${pkmn.name} the `
              }
              label += `${pkmn.species}`;
              label += `${isAltered && !isAlternateForm ? ` [base: ${pkmn.originalSpecies}]` : ''}`;
              label += `${pkmn.gender ? " " + pkmn.gender : ""}, `;
              label += `${pkmn.ability}`;
              label += `${pkmn.item ? ` @ ${pkmn.item}` : ""}`;
              slots.set(pkmn.id, label);
          }
          return slots;
      }
      else {
          throw new BadRequestError("You are not involved in this battle!");
      }
  }
  else {
      throw new BadRequestError(`There's no battle happening in this thread. Any previous battle in this thread has finished!`);
  }    
}