export class BattlePacker {
    battle;

    constructor(battle) {
        this.battle = battle;
    }

    getPackedTeam(trainerId) {
        let packedTeam = "";
        let trainer = this.battle.trainers.get(trainerId);
        let size = trainer.pokemon.size;
        let i = 0;
        for (let pokemon of trainer.pokemon.values()) {
            packedTeam += this.getPackedPokemon(pokemon);
            if (i != size - 1) {
                packedTeam += `]`;
            }
            i++;
        }
        return packedTeam;
    }

    getPackedPokemon(pokemon) {
        let packedPokemon = `${pokemon.id}|`;
        // nickname|species| --only NICKNAME is filled in if the species is the same
        packedPokemon += `${pokemon.species}||`;
        // item
        packedPokemon += `${pokemon.item != undefined ? pokemon.item : ''}|`;
        // ability
        packedPokemon += `${pokemon.ability}|`;
        // moves
        packedPokemon += `|`;
        // nature
        packedPokemon += `Quirky|`;
        // EVs
        packedPokemon += `252,252,252,252,252,252|`;
        // gender
        packedPokemon += `${pokemon.gender}|`;
        // IVs -- blank for all 31s
        packedPokemon += `|`;
        // Shiny, Level (100), Happiness (255), Pokeball all left blank for defaults
        packedPokemon += `||,,`;
        // Hidden Power Type
        packedPokemon += `${pokemon.hiddenPowerType != undefined ? pokemon.hiddenPowerType : ''},`;
        // Gigantamax, DynamaxLevel left blank
        packedPokemon += `,,`;
        // Tera Type set to normal until implemented
        packedPokemon += `NORMAL`;
        return packedPokemon;
    }
}