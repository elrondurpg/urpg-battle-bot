import * as mysql from 'mysql';
import { Battle, BattleRules } from '../../entities/battles.js';
import { createStream } from '../showdown/stream-manager.js';
import { Trainer } from '../../entities/trainer.js';
import { MESSAGE_SERVICE } from '../../dependency-injection.js';

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
                                let battle = Object.assign(new Battle, wrapper);
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
                    let battle = Object.assign(new Battle, wrapper);
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
        MESSAGE_SERVICE.sendMessageWithOptions("**This battle has been archived due to inactivity.** Resume battle with any slash command.", battle.options);
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

async function startBattle(battle) {
    if (battle.trainers) {
        for (let [id, trainer] of battle.trainers) {
            battle.trainers.set(id, Object.assign(new Trainer, trainer));
        }
    }
    if (battle.inputLog) {
        let streamOptions = {
            inputLog: battle.inputLog
        };
        await createStream(battle, streamOptions);
    }
    else if (battle.isWaitingForSends()) {
        MESSAGE_SERVICE.sendMessageWithOptions("**The battle resumed!**", battle.options);
        MESSAGE_SERVICE.sendMessageWithOptions(getWaitingForSendsMessage(battle), battle.options);
    }
    battle.lastAction = process.hrtime.bigint();
}

class BattleDataWrapper {
    inputLog;
    options;
    id;
    ownerId;
    teams;
    rules;
    started;
    trainers;
    awaitingChoices;
    weather;
    turnNumber;
    ended;
    archived;

    constructor(battle) {
        if (battle) {
            if (battle.getShowdownBattle) {
                let showdownBattle = battle.getShowdownBattle();
                if (showdownBattle) {
                    this.inputLog = showdownBattle.inputLog;
                }
            }
            this.options = battle.options;
            this.id = battle.id;
            this.ownerId = battle.ownerId;
            this.teams = battle.teams;
            this.rules = battle.rules;
            this.started = battle.started;
            this.trainers = battle.trainers;
            this.awaitingChoices = battle.awaitingChoices;
            this.weather = battle.weather;
            this.turnNumber = battle.turnNumber;
            this.ended = battle.ended;
            this.archived = battle.archived;
        }
    }

    toBattle() {
        let battle = new Battle();
        battle.options = this.options;
        battle.id = this.id;
        battle.ownerId = this.ownerId;
        battle.teams = this.teams;
        battle.rules = Object.assign(new BattleRules, this.rules);
        battle.started = this.started;
        battle.trainers = this.trainers;
        battle.awaitingChoices = this.awaitingChoices;
        battle.weather = this.weather;
        battle.turnNumber = this.turnNumber;
        battle.ended = this.ended;
        battle.archived = this.archived;
        return battle;
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