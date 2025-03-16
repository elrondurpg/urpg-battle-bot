import { BATTLE_THREAD_TAG } from '../constants.js';

export function isDiscordId(input) {
    return input != null || input.match(/^[0-9]+$/g);
}

export function isBattleThread(channelName) {
    return channelName.substr(0, 12) !== BATTLE_THREAD_TAG
}