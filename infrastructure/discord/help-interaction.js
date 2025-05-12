import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import * as ValidationRules from '../../utils/ValidationRules.js';
import { BATTLE_SERVICE, CONFIG_SERVICE } from '../../dependency-injection.js';
import { BATTLE_THREAD_TAG } from "../../constants.js";

export const displayHelp = (req, res) => {
    return displayDiscordHelp(req, res);
}

async function displayDiscordHelp(req, res) {
    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const channelName = req.body.channel.name;
    if (ValidationRules.isBattleThread(channelName)) {
        const battleId = String(channelName).slice(BATTLE_THREAD_TAG.length);
        await BATTLE_SERVICE.get(battleId);
        let message = "**Battle Bot Help**\n";
        message += "This is a battle thread.\n";
        message += "Use \`/join\` to join this battle if it hasn't started yet.\n";
        message += "The following commands are available to players involved in this battle:\n";
        message += "Use \`/send\` to add a new Pokémon to your party before the battle starts. You can specify your Pokémon's species, gender, ability, item, Hidden Power type, Tera type, and Conversion type using this command.\n";
        message += "Use \`/lead\` to select the first Pokémon you will send into battle.\n";
        message += "Use \`/move\` to select a move when it is your turn. You can choose to Dynamax, Mega Evolve, Ultra Burst, Terastallize, or use a Z-Move using this command.\n";
        message += "Use \`/switch\` to switch Pokémon when it is your turn or when your active Pokémon faints or is forced out of the battle.\n";
        message += "Use \`/stats\` to view each player's team.\n";
        message += "Use \`/learnset\` to view all the moves known by one of your Pokémon.\n";
        message += "Use \`/ff\` to forfeit the battle.\n";
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: message
            }
        });
    }
    else if (CONFIG_SERVICE.getBattleSearchChannelName() == channelName) {
        let message = "**Battle Bot Help**\n";
        message += "This is the \`battle-search\` channel.\n";
        message += "Use \`/create-battle\` to create a battle.";
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: message
            }
        });
    }
    else {
        return getInvalidChannelMessage(res);
    }
}

function getInvalidChannelMessage(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: "Battle Bot has no commands to use in this thread!",
            flags: InteractionResponseFlags.EPHEMERAL
        }
    });
}