import * as mysql from 'mysql';
import { BattleRoom, BattleRules } from '../../models/battle-room.js';
import { TrainerRequest } from '../../models/trainer-request.js';
import { BATTLE_SERVICE, BATTLES_MESSAGES_SERVICE } from '../app/dependency-injection.js';

const _GET_ALL_QUERY = "SELECT * FROM battles";
const _GET_BY_ID_QUERY = "SELECT * FROM battles WHERE id = ?";
const _CREATE_QUERY = "INSERT INTO battles (id, data) VALUES (?, ?)";
const _UPDATE_QUERY = "UPDATE battles SET data = ? WHERE id = ?";
const _DELETE_QUERY = "DELETE FROM battles WHERE id = ?";

export class MySqlBattleStore {
    connection;
    _battles = new Map();

    constructor() {
        this.connection = mysql.createConnection({
            host: process.env.BATTLE_STORE_HOST,
            user: process.env.BATTLE_STORE_USER,
            password: process.env.BATTLE_STORE_PASSWORD,
            database: process.env.BATTLE_STORE_DATABASE
        });
    }

    async get(id) {
        let bigIntId = BigInt(id);
        if (this._battles.has(bigIntId)) {
            return this._battles.get(bigIntId);
        }
        else {
            return new Promise((resolve, reject) => {
                return this.connection.query(_GET_BY_ID_QUERY, [id], async (err, results) => {
                    if (err) {
                        reject("Couldn't load stored battle data.");
                    }
                    else {
                        if (results && results.size > 0) {
                            for (let result of results) {
                                let wrapper = await parseBattleStringToJson(result);
                                let battle = Object.assign(new BattleRoom, wrapper);
                                await startBattle(battle);
                                this._battles.set(BigInt(battle.id), battle);
                                battle.archived = false;
                                resolve(battle);
                            }
                        }
                        else {
                            resolve(undefined);
                        }
                    }
                });
            });
        }
    }

    async loadAll() {
        await this.connection.query(_GET_ALL_QUERY, async (err, results) => {
            if (err) {
                console.log("Couldn't load stored battle data.");
            }
            else {
                for (let result of results) {
                    let wrapper = await parseBattleStringToJson(result);
                    let battle = Object.assign(new BattleRoom, wrapper);
                    if (!battle.archived) {
                        await startBattle(battle);
                        this._battles.set(BigInt(battle.id), battle);
                    }
                }
            }
        });
    }

    getAll() {
        return this._battles;
    }
    
    async create(battle) {
        battle.id = process.hrtime.bigint();
        let data = toJSON(new BattleDataWrapper(battle));
        await this.connection.query(_CREATE_QUERY, [battle.id, data], (err, results) => {
                //console.log(err);
                //console.log(results);
        });
        /*if (!this._battles.get(battle.id)) {
            this._battles.set(battle.id, battle);
        }
        else {
            throw new BattleIdCollisionError();
        }*/
        this._battles.set(battle.id, battle);
        return battle;
    }

    async archive(battle) {
        BATTLES_MESSAGES_SERVICE.create(battle, "**This battle has been archived due to inactivity.** Resume battle with any slash command.");
        this._battles.delete(BigInt(battle.id));
        battle.archived = true;
        return this.save(battle);
    }

    async save(battle) {
        let data = toJSON(new BattleDataWrapper(battle));
        await this.connection.query(_UPDATE_QUERY, [data, battle.id], (err, results) => {
            //console.log(err);
            //console.log(results);
            // build a battle object and start its stream
        });
        return battle;
    }

    async saveAll() {
        await Object.entries(this._battles).forEach(async battle => await this.save(battle));
    }

    async delete(battle) {
        this._battles.delete(battle.id);
        await this.connection.query(_DELETE_QUERY, [battle.id], (err, results) => {
            //console.log(err);
            //console.log(results);
            // build a battle object and start its stream
        });
        return battle;
    }
}

async function parseBattleStringToJson(s) {
    let data = JSON.parse(s.data, (_, v) => {
        if(typeof v === 'object' && v !== null) {
            if (v.dataType === 'Map') {
              return new Map(v.value);
            }
            else return v;
        }
        else return v;
    });
    return Object.assign(new BattleDataWrapper, data);
}

async function startBattle(room) {
    if (room.trainers) {
        for (let [id, trainer] of room.trainers) {
            room.trainers.set(id, Object.assign(new TrainerRequest, trainer));
        }
    }
    if (room.options['inputLog']) {
        await BATTLE_SERVICE.create(room);
    }
    else if (room.getNumPlayersNeeded() == 0 && isWaitingForSends(room)) {
        BATTLES_MESSAGES_SERVICE.create(room, "**The battle resumed!**");
        BATTLES_MESSAGES_SERVICE.create(room, getWaitingForSendsMessage(room));
    }
    room.lastActionTime = process.hrtime.bigint();
}

function isWaitingForSends(room) {
    return Array.from(room.trainers.values()).some(trainer => trainer.pokemon.size < room.rules.numPokemonPerTrainer);
}

class BattleDataWrapper {
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
function getWaitingForJoinsMessage(battle) {
    let message = "";

    let numPlayersNeeded = battle.getNumPlayersNeeded();
    if (numPlayersNeeded == 1) {
        message += `\n\n**Looking for ${battle.getNumPlayersNeeded()} opponent!**\n`;
    }
    else if (numPlayersNeeded > 1) {
        message += `\n\n**Looking for ${battle.getNumPlayersNeeded()} opponents!**\n`;
    }
    if (numPlayersNeeded > 0) {
        message += "Use the \`/join\` command to join this battle.";
    }

    return message;
}
    
function getWaitingForLeadsMessage(battle) {

}

function getWaitingForSendsMessage(battle) {
    let message = "";
    for (let [id, trainer] of battle.trainers) {
        let numPokemonToSend = battle.rules.numPokemonPerTrainer - trainer.pokemon.size;
        if (numPokemonToSend > 0) {
            message += `**<@${id}>: You must send ${numPokemonToSend} Pokémon!**\n`;
            message += "Use \`/send\` to send a Pokémon. Your team will be hidden from your opponent";
            if (battle.rules.numTeams > 2 || battle.rules.numTrainersPerTeam > 1) {
                message += "s";
            }
            message += battle.rules.teamType == "full" 
                ? ".\n"
                : " until all sends have been received.\n";
        }
    }

    return message;
}