import { Pokemon } from "../../entities/pokemon.js";
import { Trainer } from "../../entities/trainer.js";
import { createStream } from "../showdown/stream-manager.js";
import { InMemoryBattleStore } from "./InMemoryBattleStore.js";
import { Battle } from "../../entities/battles.js";

export class TestBattleStore extends InMemoryBattleStore {
    constructor() {
        super();

        let pokemon1 = new Pokemon();
        pokemon1.id = 1;
        pokemon1.nickname = undefined;
        pokemon1.species = "parasect";
        pokemon1.gender = "M";
        pokemon1.ability = "dryskin";
        pokemon1.item = 'fightiniumz';
        pokemon1.teraType = "Fire";
        pokemon1.conversionType = "Ice";
        //pokemon1.hiddenPowerType = "Ground";

        /*let pokemon2 = new Pokemon();
        pokemon2.id = 2;
        pokemon2.nickname = undefined;
        pokemon2.species = "bulbasaur";
        pokemon2.gender = "m";
        pokemon2.ability = "overgrow";
        pokemon2.hiddenPowerType = "FIRE";
        pokemon2.item = 'leftovers';
        pokemon2.teraType = "grass";

        let pokemon3 = new Pokemon();
        pokemon3.id = 3;
        pokemon3.nickname = "Churtle";
        pokemon3.species = "squirtle";
        pokemon3.gender = "m";
        pokemon3.ability = "torrent";
        pokemon3.hiddenPowerType = "ELECTRIC";
        pokemon3.item = 'leftovers';
        pokemon3.teraType = "water";*/

        let trainer1 = new Trainer();
        trainer1.id = process.env.TEST_TRAINER1,
        trainer1.name = 'Elrond';
        trainer1.pokemon = new Map().set(1, pokemon1);//.set(2, pokemon2).set(3, pokemon3);
        trainer1.pokemonIndex = 2;
        trainer1.activePokemon = 1;
        trainer1.position = 'p1';
        //trainer1.switch = 3;
        trainer1.move = 'spore';
        //trainer1.mega = true;
        //trainer1.terastallize = true
        //trainer1.max = true;
        //trainer1.zmove = true;
        //trainer1.ultra = true;

        let pokemon4 = new Pokemon();
        pokemon4.id = 1,
        pokemon4.species = "medicham";
        pokemon4.gender = "M";
        pokemon4.ability = "purepower";
        pokemon4.hiddenPowerType = "ICE";
        pokemon4.item = 'Leftovers';

        /*let pokemon5 = new Pokemon();
        pokemon5.id = 2,
        pokemon5.species = "pidove";
        pokemon5.gender = "M";
        pokemon5.ability = "bigpecks";
        pokemon5.hiddenPowerType = "FIGHTING";
        pokemon5.item = 'flyinggem';


        let pokemon6 = new Pokemon();
        pokemon6.id = 3,
        pokemon6.species = "kakuna";
        pokemon6.gender = "M";
        pokemon6.ability = "shedskin";
        pokemon6.hiddenPowerType = "FIRE";
        pokemon6.item = 'leftovers';*/


        let trainer2 = new Trainer();
        trainer2.id = process.env.TEST_TRAINER2,
        trainer2.name = 'CPU1';
        trainer2.pokemon = new Map().set(1, pokemon4);//.set(2, pokemon5).set(3, pokemon6);
        trainer2.pokemonIndex = 2;
        trainer2.activePokemon = 1;
        trainer2.position = 'p2';
        trainer2.move = "firepunch";

        let battle = new Battle();
        battle.id = 407835314107200n;
        battle.ownerId = trainer1.id;
        battle.teams = [ 
            [
                trainer1
            ], 
            [ 
                trainer2
            ] 
        ];
        battle.started = false;
        battle.trainers = new Map()
            .set(trainer1.id, trainer1)
            .set(trainer2.id, trainer2);
        battle.trainersByPnum = new Map();
        battle.rules = {
            generation: 'standard',
            battleType: 'singles',
            numTeams: 2,
            numTrainersPerTeam: 1,
            numPokemonPerTrainer: 3,
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
        };
        this._battles.set(battle.id, battle);

        let streamOptions = {
            threadId: process.env.TEST_BATTLE_THREAD_ID
        };
        let stream = createStream(battle, streamOptions);
        battle.stream = stream;
        stream.sendStart();
        stream.sendLead(trainer1.id);
        stream.sendLead(trainer2.id);
        stream.sendMove(trainer1.id);
        stream.sendMove(trainer2.id);
        let numLoops = 0;
        for (let i = 0; i < numLoops; i++) {
            trainer1.move = "doubleteam";
            trainer2.move = "toxic";
            stream.sendMove(trainer1.id);
            stream.sendMove(trainer2.id);
        }
        trainer1.move = "scratch";
        trainer2.switch = 2;
        stream.sendMove(trainer1.id);
        stream.sendMove(trainer2.id);
        trainer1.move = "scratch";
        trainer2.move = "rest";
        stream.sendMove(trainer1.id);
        stream.sendMove(trainer2.id);

    }
}