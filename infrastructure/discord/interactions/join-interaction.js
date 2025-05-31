import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { BATTLE_ROOM_SERVICE, BATTLES_MESSAGES_SERVICE } from '../../app/dependency-injection.js';
import { BATTLE_THREAD_TAG } from '../../../constants.js';
import * as ValidationRules from '../../../utils/ValidationRules.js';
import { BadRequestError } from '../../../utils/BadRequestError.js';
import { getInvalidChannelMessage } from '../utils.js';

export const joinBattle = (req, res) => {
    return joinDiscordBattle(req, res)
}

async function joinDiscordBattle(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    const roomId = String(channelName).slice(BATTLE_THREAD_TAG.length);
    if (!ValidationRules.isBattleThread(channelName)) {
        return getInvalidChannelMessage(res);
    }
    try {
        let name = req.body.member.nick;
        if (name == undefined) {
            name = req.body.member.user.global_name;
        }
        let room = await BATTLE_ROOM_SERVICE.addPlayer(roomId, userId, name);
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `<@${userId}> joined the battle!`
            }
        });        
        if (room.getNumPlayersNeeded() == 0) {
            await BATTLES_MESSAGES_SERVICE.create(room, room.getWaitingForSendsMessage());
        }
    } catch (err) {
        if (err instanceof BadRequestError) {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.EPHEMERAL,
                    content: err.message
                }
            });
        }
    }
}