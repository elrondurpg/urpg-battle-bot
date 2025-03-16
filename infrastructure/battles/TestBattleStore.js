import { InMemoryBattleStore } from "./InMemoryBattleStore.js";

export class TestBattleStore extends InMemoryBattleStore {
    constructor() {
        super();
        let trainer1 = {
            id: process.env.TEST_TRAINER1,
            pokemon: new Map()
        };
        let trainer2 = {
            id: process.env.TEST_TRAINER2,
            pokemon: new Map()
        };
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
              numPokemonPerTrainer: 6,
              sendType: 'public',
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
            pokemonIndex: 0
        };
        this._battles.set(battle.id, battle);
    }
}