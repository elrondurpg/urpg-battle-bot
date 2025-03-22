import { Pokemon } from "../../entities/pokemon.js";
import { Trainer } from "../../entities/trainer.js";
import { createStream } from "../streams/stream-manager.js";
import { InMemoryBattleStore } from "./InMemoryBattleStore.js";

export class TestBattleStore extends InMemoryBattleStore {
    constructor() {
        super();

        let pokemon1 = new Pokemon();
        pokemon1.id = 1,
        pokemon1.species = "Golbat";
        pokemon1.gender = "N";
        pokemon1.ability = "Infiltrator";
        pokemon1.hiddenPowerType = "FIGHTING";
        pokemon1.item = undefined;

        let trainer1 = new Trainer();
        trainer1.id = process.env.TEST_TRAINER1,
        trainer1.name = 'Elrond';
        trainer1.pokemon = new Map().set(1, pokemon1);
        trainer1.pokemonIndex = 2;

        let pokemon2 = new Pokemon();
        pokemon2.id = 1,
        pokemon2.species = "Weavile";
        pokemon2.gender = "M";
        pokemon2.ability = "Pickpocket";
        pokemon2.hiddenPowerType = "FIRE";
        pokemon2.item = "Ability Shield";

        let trainer2 = new Trainer();
        trainer2.id = process.env.TEST_TRAINER2,
        trainer2.name = 'CPU1';
        trainer2.pokemon = new Map().set(1, pokemon2);
        trainer2.pokemonIndex = 2;
        trainer2.activePokemon = 1;
        trainer2.move = 'Swords Dance';

        let battle = {
            id: 407835314107200n,
            ownerId: trainer1.id,
            teams: [ 
                [
                    trainer1
                ], 
                [ 
                    trainer2
                ] 
            ],
            rules: {
              generation: 'standard',
              battleType: 'singles',
              numTeams: 2,
              numTrainersPerTeam: 1,
              numPokemonPerTrainer: 1,
              sendType: 'private',
              teamType: 'full',
              startingWeather: null,
              startingTerrain: null,
              ohkoClause: true,
              accClause: true,
              evaClause: true,
              sleepClause: true,
              freezeClause: true,
              speciesClause: true,
              itemsAllowed: false,
              itemClause: true,
              megasAllowed: true,
              zmovesAllowed: true,
              dynamaxAllowed: true,
              teraAllowed: true,
              worldCoronationClause: true,
              legendsAllowed: true,
              randomClause: false,
              inversionClause: false,
              skyClause: false,
              gameboyClause: false,
              wonderLauncherClause: false,
              rentalClause: true
            },
            started: false,
            trainers: new Map()
                .set(trainer1.id, trainer1)
                .set(trainer2.id, trainer2),
            trainersByPnum: new Map()
        };
        this._battles.set(battle.id, battle);

        let streamOptions = {
            threadId: process.env.TEST_BATTLE_THREAD_ID
        };
        createStream(battle, streamOptions).sendStart();
    }
}