import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import { getInvalidChannelMessage, getOptionValue } from "../discord-utils.js";
import { BATTLE_ROOM_SERVICE, CONFIG_DATA, CONSUMER_DATA } from '../../app/dependency-injection.js';
import { BadRequestError } from "../../../utils/bad-request-error.js";
import { ChooseMoveRequest } from "../../../domain/battles/choose-move-request.js";
import { DiscordConstants } from "../discord-constants.js";

export const chooseMove = (req, res) => {
    return chooseDiscordMove(req, res);
}

async function chooseDiscordMove(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
    
    const guildId = req.body.guild_id;
    const channelName = req.body.channel.name;

    let consumer = await CONSUMER_DATA.getByPlatformAndPlatformSpecificId(DiscordConstants.DISCORD_PLATFORM_NAME, guildId);
    let battleThreadTag = await CONFIG_DATA.get(consumer.id, DiscordConstants.BATTLE_THREAD_TAG_PROPERTY_NAME);

    const roomId = String(channelName).slice(battleThreadTag.length);
    if (channelName.substr(0, battleThreadTag.length) !== battleThreadTag) {
        return getInvalidChannelMessage(res);
    }

    try {
        let options = req.body.data.options;
        let request = new ChooseMoveRequest();
        request.move = getOptionValue(options, "move");
        request.shouldDynamax = getOptionValue(options, "dynamax");
        request.shouldMegaEvolve = getOptionValue(options, "mega-evolve");
        request.shouldUltraBurst = getOptionValue(options, "ultra-burst");
        request.shouldTerastallize = getOptionValue(options, "terastallize");
        request.shouldZMove = getOptionValue(options, "z-move");
        await BATTLE_ROOM_SERVICE.chooseMove(roomId, userId, request);
        
        await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `Move set!`
            }
        });
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
        console.log(err);
    }
}