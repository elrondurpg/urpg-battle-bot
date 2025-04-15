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
        if (pokemon.nickname) {
            // nickname|species| --only NICKNAME is filled in if the species is the same
            packedPokemon += `${pokemon.nickname}|${pokemon.species}|`;
        }
        else {
            // nickname|species| --only NICKNAME is filled in if the species is the same
            packedPokemon += `${pokemon.species}||`;
        }
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
        // Shiny, Level (100), Happiness (255) all left blank for defaults
        packedPokemon += `||,`;
        // Hidden Power Type
        packedPokemon += `${pokemon.hiddenPowerType != undefined ? pokemon.hiddenPowerType : ''},`;
        // Pokeball left blank for default
        packedPokemon += `,`;
        // Gigantamax
        packedPokemon += `${pokemon.useGmaxForm ? 'G' : ''},`;
        // DynamaxLevel left blank
        packedPokemon += `,`;
        // Tera Type 
        packedPokemon += `${pokemon.teraType != undefined ? pokemon.teraType : ''},`;
        // Conversion Type
        packedPokemon += `${pokemon.conversionType != undefined ? pokemon.conversionType : ''}`;
        return packedPokemon;
    }
}