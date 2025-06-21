import * as mysql from 'mysql2/promise';
import { BattleRoom, BattleRules } from '../../models/battle-room.js';
import { BATTLE_SERVICE, BATTLES_MESSAGES_SERVICE, OPEN_BATTLES_SERVICE } from '../app/dependency-injection.js';
import { AddPlayerRequest } from '../../domain/battles/add-player-request.js';

const _GET_ALL_QUERY = "SELECT * FROM battles";
const _GET_BY_ID_QUERY = "SELECT * FROM battles WHERE id = ?";
const _CREATE_QUERY = "INSERT INTO battles (id, data) VALUES (?, ?)";
const _UPDATE_QUERY = "UPDATE battles SET data = ? WHERE id = ?";
const _DELETE_QUERY = "DELETE FROM battles WHERE id = ?";

export class MySqlBattleStore {
    connection;
    _rooms = new Map();

    constructor() {
    }

    async connect() {
        try {
            this.connection = await mysql.createPool({
                host: process.env.BATTLE_STORE_HOST,
                user: process.env.BATTLE_STORE_USER,
                password: process.env.BATTLE_STORE_PASSWORD,
                database: process.env.BATTLE_STORE_DATABASE
            });
        } catch (err) {
            console.log("Couldn't connect to database.");
            console.log(err);
        }
    }

    async get(id) {
        let bigIntId = BigInt(id);
        if (this._rooms.has(bigIntId)) {
            return this._rooms.get(bigIntId);
        }
        else {
            if (!this.connection) {
                await this.connect();
            }
            try {
                const [results] = this.connection.query(_GET_BY_ID_QUERY, [id]);
                if (results && results.size > 0) {
                    for (let result of results) {
                        let wrapper = await parseBattleStringToJson(result);
                        let battle = Object.assign(new BattleRoom, wrapper);
                        await startBattle(battle);
                        this._rooms.set(BigInt(battle.id), battle);
                        battle.archived = false;
                        resolve(battle);
                    }
                }
                else {
                    resolve(undefined);
                }
            } catch (err) {
                console.log("Couldn't load stored battle data by ID.");
            }
        }
    }

    async loadAll() {
        if (!this.connection) {
            await this.connect();
        }
        try {
            const [results] = await this.connection.query(_GET_ALL_QUERY);
            for (let result of results) {
                let wrapper = await parseBattleStringToJson(result);
                let room = Object.assign(new BattleRoom, wrapper);
                if (!room.archived) {
                    await startBattle(room);
                    this._rooms.set(BigInt(room.id), room);
                }
            }
            OPEN_BATTLES_SERVICE.init(Array.from(this._rooms.values()));
        } catch (err) {
            console.log("Couldn't load stored battle data.");
            console.log(err);
        }
    }

    getAll() {
        return this._rooms;
    }
    
    async create(room) {
        room.id = process.hrtime.bigint();
        let data = toJSON(new BattleRoomDataWrapper(room));
        if (!this.connection) {
            await this.connect();
        }
        try {
            await this.connection.query(_CREATE_QUERY, [room.id, data]);
        } catch (err) {
            console.log("Couldn't create battle room.");
            console.log(err);
        }
        this._rooms.set(room.id, room);
        return room;
    }

    async archive(room) {
        BATTLES_MESSAGES_SERVICE.create(room, "**This battle has been archived due to inactivity.** Resume battle with any slash command.");
        this._rooms.delete(BigInt(room.id));
        room.archived = true;
        return this.save(room);
    }

    async save(room) {
        let data = toJSON(new BattleRoomDataWrapper(room));
        if (!this.connection) {
            await this.connect();
        }
        await this.connection.query(_UPDATE_QUERY, [data, room.id]);
        return room;
    }

    async saveAll() {
        await Object.entries(this._rooms).forEach(async room => await this.save(room));
    }

    async delete(room) {
        this._rooms.delete(room.id);
        if (!this.connection) {
            await this.connect();
        }
        await this.connection.query(_DELETE_QUERY, [room.id]);
        return room;
    }
}

async function parseBattleStringToJson(s) {
    let dataToParse = s.data;
    if (typeof dataToParse != 'string') {
        dataToParse = JSON.stringify(dataToParse);
    }
    let data = JSON.parse(dataToParse, (_, v) => {
        if(typeof v === 'object' && v !== null) {
            if (v.dataType === 'Map') {
              return new Map(v.value);
            }
            else return v;
        }
        else return v;
    });
    return Object.assign(new BattleRoomDataWrapper, data);
}

async function startBattle(room) {
    if (room.trainers) {
        for (let [id, trainer] of room.trainers) {
            room.trainers.set(id, Object.assign(new AddPlayerRequest, trainer));
        }
    }
    if (room.options['inputLog']) {
        await BATTLE_SERVICE.create(room);
    }
    else if (room.getNumPlayersNeeded() == 0 && isWaitingForSends(room)) {
        BATTLES_MESSAGES_SERVICE.create(room, "**The battle resumed!**");
        room.sendWaitingForSendsMessages();
    }
    room.lastActionTime = process.hrtime.bigint();
}

function isWaitingForSends(room) {
    return Array.from(room.trainers.values()).some(trainer => trainer.pokemon.size < room.rules.numPokemonPerTrainer);
}

class BattleRoomDataWrapper {
    options;
    id;
    ownerId;
    teams;
    rules;
    trainers;
    archived;

    constructor(room) {
        if (room) {
            this.options = room.options;
            let showdownBattle = BATTLE_SERVICE.get(room.id);
            if (showdownBattle) {
                this.options['inputLog'] = showdownBattle.inputLog;
            }
            this.id = room.id;
            this.ownerId = room.ownerId;
            this.teams = room.teams;
            this.rules = room.rules;
            this.trainers = room.trainers;
            this.archived = room.archived;
        }
    }

    toBattleRoom() {
        let room = new BattleRoom();
        room.options = this.options;
        room.id = this.id;
        room.ownerId = this.ownerId;
        room.teams = this.teams;
        room.rules = Object.assign(new BattleRules, this.rules);
        room.trainers = this.trainers; 
        room.archived = this.archived;
        return room;
    }
}

function toJSON(battle) {
    return JSON.stringify(battle, (_, v) => {
        if (typeof v === "bigint") {
            return v.toString();
        }
        else if (v instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(v.entries()),
            }
        }
        else {
            return v;
        }
    });
}