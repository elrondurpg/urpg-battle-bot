import { InMemoryBattleStore } from "./in-memory-battle-store.js";
import { BattleRoom } from "../../../models/battle-room.js";
import { BATTLE_SERVICE } from "../../app/dependency-injection.js";
import { AddPokemonRequest } from "../../../domain/battles/add-pokemon-request.js";
import { AddPlayerRequest } from "../../../domain/battles/add-player-request.js";

export class TestBattleStore extends InMemoryBattleStore {
    constructor() {
        super();
    }

    async loadAll() {
        let pokemon1 = new AddPokemonRequest();
        pokemon1.id = 1;
        pokemon1.nickname = undefined;
        pokemon1.species = "pikachurockstar";
        pokemon1.gender = "M";
        pokemon1.ability = "static";
        pokemon1.item = 'firiumz';
        //pokemon1.teraType = "Fire";
        pokemon1.conversionType = "Ice";
        //pokemon1.hiddenPowerType = "Ground";

        let pokemon2 = new AddPokemonRequest();
        pokemon2.id = 2;
        pokemon2.nickname = undefined;
        pokemon2.species = "roserade";
        pokemon2.gender = "m";
        pokemon2.ability = "technician";
        pokemon2.hiddenPowerType = "FIRE";
        pokemon2.item = 'leftovers';
        pokemon2.teraType = "grass";

        let pokemon3 = new AddPokemonRequest();
        pokemon3.id = 3;
        pokemon3.nickname = "Churtle";
        pokemon3.species = "squirtle";
        pokemon3.gender = "m";
        pokemon3.ability = "torrent";
        pokemon3.hiddenPowerType = "ELECTRIC";
        pokemon3.item = 'leftovers';
        pokemon3.teraType = "water";

        let trainer1 = new AddPlayerRequest();
        trainer1.id = process.env.TEST_TRAINER1,
        trainer1.name = 'Elrond';
        trainer1.pokemon = new Map().set(1, pokemon1).set(2, pokemon2).set(3, pokemon3);
        trainer1.pokemonIndex = 2;
        //trainer1.switch = 3;
        trainer1.move = 'shadowball';
        //trainer1.mega = true;
        //trainer1.terastallize = true
        //trainer1.max = true;
        //trainer1.zmove = true;
        //trainer1.ultra = true;

        let pokemon4 = new AddPokemonRequest();
        pokemon4.id = 1,
        pokemon4.species = "azumarill";
        pokemon4.gender = "m";
        pokemon4.ability = "hugepower";
        pokemon4.hiddenPowerType = "ICE";
        pokemon4.item = 'stickybarb';

        let pokemon5 = new AddPokemonRequest();
        pokemon5.id = 2,
        pokemon5.species = "pidove";
        pokemon5.gender = "M";
        pokemon5.ability = "bigpecks";
        pokemon5.hiddenPowerType = "FIGHTING";
        //pokemon5.item = 'flyinggem';


        let pokemon6 = new AddPokemonRequest();
        pokemon6.id = 3,
        pokemon6.species = "kakuna";
        pokemon6.gender = "M";
        pokemon6.ability = "shedskin";
        pokemon6.hiddenPowerType = "FIRE";
        pokemon6.item = 'leftovers';


        let trainer2 = new AddPlayerRequest();
        trainer2.id = process.env.TEST_TRAINER2,
        trainer2.name = 'CPU1';
        trainer2.pokemon = new Map().set(1, pokemon4).set(2, pokemon5).set(3, pokemon6);
        trainer2.pokemonIndex = 2;
        trainer2.move = "explosion";

        let room = new BattleRoom();
        room.options = {
            'discordThreadId': process.env.TEST_BATTLE_THREAD_ID
        };
        
        room.id = 407835314107200n;
        room.ownerId = trainer1.id;
        room.teams = [ 
            [
                trainer1.id
            ], 
            [ 
                trainer2.id
            ] 
        ];
        room.trainers = new Map()
            .set(trainer1.id, trainer1)
            .set(trainer2.id, trainer2);
        room.rules = {
            generation: 'standard',
            battleType: 'singles',
            numTeams: 2,
            numTrainersPerTeam: 1,
            numPokemonPerTrainer: 3,
            sendType: 'private',
            teamType: 'preview',
            startingWeather: null,
            startingTerrain: null,
            ohkoClause: true,
            accClause: true,
            evaClause: true,
            sleepClause: true,
            freezeClause: true,
            speciesClause: true,
            itemsAllowed: true,
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
        this._battles.set(room.id, room);

        /*let inputLog = [
            '>start {"formatid":"[Gen 9] Custom Game","seed":"sodium,4bf713147a52194b51319a05b5ed31f9","rules":{"generation":"standard","battleType":"singles","numTeams":2,"numTrainersPerTeam":1,"numPokemonPerTrainer":3,"sendType":"private","teamType":"preview","startingWeather":null,"startingTerrain":null,"ohkoClause":true,"accClause":true,"evaClause":true,"sleepClause":true,"freezeClause":true,"speciesClause":true,"itemsAllowed":true,"itemClause":true,"megasAllowed":true,"zmovesAllowed":true,"dynamaxAllowed":true,"teraAllowed":true,"worldCoronationClause":true,"legendsAllowed":true,"randomClause":false,"inversionClause":false,"skyClause":false,"gameboyClause":false,"wonderLauncherClause":false,"rentalClause":true}}',
            '>player p1 {"name":"Elrond","userId":"' + trainer1.id + '","team":"1|vileplume||firiumz|chlorophyll||Quirky|252,252,252,252,252,252|M||||,,,,,,Ice]2|roserade||leftovers|technician||Quirky|252,252,252,252,252,252|m||||,FIRE,,,,grass,]3|Churtle|squirtle|leftovers|torrent||Quirky|252,252,252,252,252,252|m||||,ELECTRIC,,,,water,"}',
            '>player p2 {"name":"CPU1","userId":"' + trainer2.id + '","team":"1|dragonair||Leftovers|shedskin||Quirky|252,252,252,252,252,252|m||||,ICE,,,,,]2|pidove|||bigpecks||Quirky|252,252,252,252,252,252|M||||,FIGHTING,,,,,]3|kakuna||leftovers|shedskin||Quirky|252,252,252,252,252,252|M||||,FIRE,,,,,"}',
            '>p1 team 1, 2, 3',
            '>p2 team 1, 2, 3',
        ]

        room.options['inputLog'] = inputLog;*/

        await BATTLE_SERVICE.create(room);
        await BATTLE_SERVICE.chooseLead(room.id, trainer1.id, 1);
        await BATTLE_SERVICE.chooseLead(room.id, trainer2.id, 1);
        await BATTLE_SERVICE.move(room.id, trainer1.id, 'wish');
        await BATTLE_SERVICE.move(room.id, trainer2.id, 'bellydrum');
        let numLoops = 0;
        for (let i = 0; i < numLoops; i++) {
            await BATTLE_SERVICE.move(room.id, trainer1.id, 'doubleteam');
            await BATTLE_SERVICE.move(room.id, trainer2.id, 'doubleteam');
        }
    }
}