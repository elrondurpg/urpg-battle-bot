import Sim from 'pokemon-showdown';
import { BATTLE_DATA } from '../../dependency-injection.js';

export const streams = new Map();

export class BattleBotStream extends Sim.BattleStream {
    battleId;
    threadId;

    constructor(battleId, threadId) {
        super();
        this.battleId = battleId;
        this.threadId = threadId;
    }
}

export function createStream(battleId, threadId) {
    let stream = new BattleBotStream(battleId, threadId);
    streams.set(battleId, stream);

    (async () => {
        for await (const output of stream) {
            let lines = output.split("\n");
            for (let line of lines) {
                //console.log(battleId + ": " + line);
            }
        }
    })();

    stream.write(`>start {"formatid":"gen7randombattle"}`);
    stream.write(`>player p1 {"name":"${BATTLE_DATA.getBattle(battleId).ownerId}"}`);
    stream.write(`>player p2 {"name":"Bob"}`);
}