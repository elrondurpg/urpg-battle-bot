import { BATTLE_ROOM_DATA } from "./dependency-injection.js";

export function registerSignals() { 
    process.on('SIGINT', async () => {
    console.log('SIGINT signal received.');
    await BATTLE_ROOM_DATA.saveAll();
    process.exit(0);
    });

    process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received.');
    await BATTLE_ROOM_DATA.saveAll();
    process.exit(0);
    });

    process.on('SIGKILL', async () => {
    console.log('SIGKILL signal received.');
    await BATTLE_ROOM_DATA.saveAll();
    process.exit(0);
    });
}