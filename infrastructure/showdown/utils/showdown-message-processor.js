import { pokemonLongRegex, ShowdownMessage } from '../models/showdown-message.js';
import { FlavorTextBuilder } from './flavor-text-builder.js';

export class FlavorTextUtility {
    stream;
    
    constructor(stream) {
        this.stream = stream;
    }

    handleMessage(command) {
        //console.log(command);
        if (command != undefined) {
            let message = undefined;
            let tokens = command.split("|");
            if (tokens.length > 0 && tokens[0] != '') {
                message = "N/A";
            }
            else if (tokens.length == 2 && tokens[0] == '' && tokens[1] == '') {
                message = "N/A";
            }
            else if (tokens.length > 1) {
                let action = new ShowdownMessage(tokens);
                switch(tokens[1]) {
                    case 'start': 
                        message = `**Let the battle begin!**`;
                        break;
                    case 'move': 
                        message = this.doMove(action);
                        break;
                    case 'drag':
                    case 'switch':
                        message = this.doSwitch(action);
                        break;
                    case 'detailschange':
                        message = "N/A";
                        break;
                    case '-formechange': 
                        message = this.doFormChange(action);
                        break;
                    case 'cant':
                        message = this.doCant(action);
                        break;
                    case 'faint': 
                        message = this.doFaint(action);
                        break;
                    case '-fail':
                        message = this.doFail(action);
                        break;
                    case '-block':
                        message = this.doBlock(action);
                        break;
                    case '-miss':
                        message = this.doMiss(action);
                        break;
                    case '-damage': 
                        message = this.doHealOrDamage(action);
                        break;
                    case '-heal':
                        message = this.doHealOrDamage(action);
                        break;
                    case '-sethp': 
                        message = this.doSetHp(action);
                        break;
                    case '-status':
                        message = this.doStatus(action);
                        break;
                    case '-curestatus':
                        message = this.doCureStatus(action);
                        break;
                    case '-boost':
                    case '-unboost':
                        message = this.doBoost(action);
                        break;
                    case '-setboost':
                        message = this.doSetBoost(action);
                        break;
                    case '-swapboost':
                        message = this.doSwapBoost(action);
                        break;
                    case '-invertboost':
                        message = this.doInvertBoost(action);
                        break;
                    case '-clearboost': 
                        message = this.doClearBoost(action);
                        break;
                    case '-clearallboost': 
                        message = this.doClearAllBoost(action);
                        break;
                    case '-clearpositiveboost':
                    case '-clearnegativeboost':
                        message = this.doClearBoost(action);
                        break;
                    case '-copyboost':
                        message = this.doCopyBoost(action);
                        break;
                    case '-weather': 
                        message = this.doWeather(action);
                        break;
                    case '-fieldstart':
                        message = this.doFieldStart(action);
                        break;
                    case '-fieldend':
                        message = this.doFieldEnd(action);
                        break;
                    case '-sidestart': 
                        message = this.doSideStatus(action);
                        break;
                    case '-sideend':
                        message = this.endSideStatus(action);
                        break;
                    case '-swapsideconditions':
                        message = this.doSwapSideConditions(action);
                        break;
                    case '-start': 
                        message = this.doVolatileStatus(action);
                        break;
                    case '-end':
                        message = this.endVolatileStatus(action);
                        break;
                    case '-crit':
                        message = this.doCrit(action);
                        break;
                    case '-supereffective':
                        message = this.doSuperEffective(action);
                        break;
                    case '-resisted':
                        message = this.doResisted(action);
                        break;
                    case '-immune':
                        message = this.doImmune(action);
                        break;
                    case '-item':
                        message = this.doItem(action);
                        break;
                    case '-enditem':
                        message = this.doEndItem(action);
                        break;
                    case '-ability':
                        message = this.doAbility(action);
                        break;
                    case '-endability':
                        message = this.doEndAbility(action);
                        break;
                    case '-transform': 
                        message = this.doTransform(action);
                        break;
                    case '-mega':
                        message = this.doMega(action);
                        break;
                    case '-primal':
                        message = this.doPrimal(action);
                        break;
                    case '-burst':
                        message = this.doBurst(action);
                        break;
                    case '-zpower':
                        message = this.doZPower(action);
                        break;
                    case '-zbroken':
                        message = this.doZBroken(action);
                        break;
                    case '-terastallize': 
                        message = this.doTerastallize(action);
                        break;
                    case '-activate':
                        message = this.doActivate(action);
                        break;
                    case '-prepare': 
                        message = this.doPrepare(action);
                        break;
                    case '-nothing': 
                        message = "But nothing happened!";
                        break;
                    case '-hitcount':
                        message = this.doHitCount(action);
                        break;
                    case '-ohko': 
                        message = "It's a one-hit KO!";
                        break;
                    case 'request':
                    case '-mustrecharge': 
                    case 't:':
                    case 'gametype':
                    case 'teamsize':
                    case 'gen':
                    case 'tier': 
                    case 'clearpoke':
                    case 'poke':
                    case 'upkeep':
                    case '-anim':
                    case 'replace':
                    case 'player':
                    case 'debug':
                        message = "N/A";
                }
            }

            if (message != undefined) {
                if (message != "N/A") {
                    if (!message.trim().startsWith("(") && !tokens.includes("[silent]")) {
                        return message;
                    }
                } 
            }

            if (message == undefined) {
                return `Unimplemented command: ${command}`;
            }
        }
    }

    doMove(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setMove(tokens[3])
            .setTarget(tokens[4]);

        let message = "";
        if (action.zeffect) {
            message += new FlavorTextBuilder('zEffect')
                .from(action)
                .setPokemon(action.getPokemonName())
                .build() + "\n";
        }

        return message + new FlavorTextBuilder('move')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setMove(action.move)
            .setTarget(action.getTargetName())
            .build();
    }

    doSwitch(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setDetails(tokens[3])
            .setHpStatus(tokens[4])
            .setOldActive(tokens.length > 5 ? tokens[5] : null)
            .setOldActiveHp(tokens.length > 6 ? tokens[6] : null);

        let trainer = this.stream.battle.sides.find(trainer => trainer.id == action.getPokemonOwner());

        return new FlavorTextBuilder(tokens[1] == "switch" ? "switchIn" : "drag")
            .from(action)
            .setTrainer(trainer.name)
            .setPokemon(action.getPokemonName())
            .setOldActive(action.oldActive)
            .setOldActiveHp(action.oldActiveHp)
            .build();
    }

    doFormChange(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setSpecies(tokens[3])
            .setHpStatus(tokens[4]);

        let actionName = action.species.includes("-Mega") ? "transformMega" : "transform";

        let megaRegex = /\-Mega\-.*/;
        let speciesName = action.species;
        if (action.species.match(megaRegex)) {
            speciesName = speciesName.replace(/\-Mega\-/, " ");
        }
        else {
            speciesName = speciesName.replace(/\-Mega.*/, "");
        }

        return new FlavorTextBuilder(actionName)
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSpecies(speciesName)
            .build();
    }

    doCant(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setReason(tokens[3])
            .setMove(tokens[4]);

        return new FlavorTextBuilder(tokens[1])
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.reason)
            .setMove(action.move)
            .build();
    }

    doFaint(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder(tokens[1])
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doFail(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setEffect(tokens[3]);

        return new FlavorTextBuilder(tokens[1])
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .build();
    }

    doBlock(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setEffect(tokens[3])
            .setMove(tokens[4])
            .setAttacker(tokens[5])
            .setSource(tokens.find(token => token.includes("[of] ")));

        return new FlavorTextBuilder(tokens[1])
           .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .setMove(action.move)
            .setSource(action.source)
            .build();
    }

    doMiss(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setTarget(tokens[3]);

        return new FlavorTextBuilder(tokens[1])
            .from(action)
            .setPokemon(action.getTargetName())
            .setSource(action.pokemon)
            .build();
    }

    doHealOrDamage(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setHpStatus(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        return new FlavorTextBuilder(tokens[1])
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .setSource(action.source)
            .build();
    }

    doSetHp(tokens) {
        return "N/A";
    }

    doStatus(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setStatus(tokens[3]);

        return new FlavorTextBuilder('start')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.status)
            .build();
    }

    doCureStatus(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setStatus(tokens[3]);

        return new FlavorTextBuilder('end')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.status)
            .build();
    }

    doBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setStat(tokens[3])
            .setAmount(tokens[1] == '-boost' ? parseInt(tokens[4]) : -parseInt(tokens[4]))
            .setItem(tokens.find(token => token.includes("[from] item: ")));

        let actionName = tokens[1] == '-unboost' ? 'unboost' : 'boost';
        if (action.amount == 0 || Math.abs(action.amount) > 1) {
            actionName += Math.min(3, Math.abs(action.amount));
        }
        if (action.item) {
            actionName += "FromItem";
        }

        return new FlavorTextBuilder(actionName)
            .from(action)
            .setPokemon(action.getPokemonName())
            .setItem(action.item)
            .setStat(action.stat)
            .build();
    }

    doSetBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setStat(tokens[3])
            .setAmount(parseInt(tokens[4]))
            .setMove(tokens.find(token => token.includes("[from] move: ")))
            .setAbility(tokens.find(token => token.includes("[from] ability: ")));

        return new FlavorTextBuilder('boost')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect([action.move, action.ability].find(effect => effect != undefined))
            .setStat(action.stat)
            .build();
    }

    doSwapBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setTarget(tokens[3])
            .setStats(tokens[4]);

        return new FlavorTextBuilder('swapBoost')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doInvertBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('invertBoost')
            .setPokemon(action.getPokemonName())
            .build();
    }

    doClearBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        return new FlavorTextBuilder('clearBoost')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .setSource(action.getSourceName())
            .build();
    }

    doClearAllBoost(tokens) {
        return new FlavorTextBuilder('clearAllBoost')
            .build();
    }

    doClearBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        return new FlavorTextBuilder('clearBoost')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .setSource(action.getSourceName())
            .build();
    }

    doCopyBoost(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setTarget(tokens[3]);

        return new FlavorTextBuilder('copyBoost')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setTarget(action.getTargetName())
            .build();
    }

    doWeather(action) {
        let tokens = action.tokens;
        action.setWeather(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        let ability;
        if (tokens.includes("[upkeep]")) {
            return new FlavorTextBuilder("upkeep")
                .from(action)
                .setEffect(action.weather)
                .build();
        }
        else if (tokens.includes("none") && tokens[3]) {
            let message = new FlavorTextBuilder("end")
                .from(action)
                .setEffect(tokens[3])
                .build();
            return message;
        }
        else  {
            let message = "";
            if (action.effect && action.effect.includes("ability: ")) {
                ability = action.effect;
                message += new FlavorTextBuilder("abilityActivation")
                    .from(action)
                    .setPokemon(action.getSourceName())
                    .setAbility(action.effect)
                    .build();
                message += "\n";
            }
            return message + new FlavorTextBuilder("start")
                .from(action)
                .setEffect(action.weather)
                .setAbility(ability)
                .build();
        }
    }

    doFieldStart(action) {
        let tokens = action.tokens;
        action.setCondition(tokens[2])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        if (action.effect) {
            action.condition = action.effect;
        }

        return new FlavorTextBuilder("start")
            .from(action)
            .setEffect(action.condition)
            .setPokemon(action.getSourceName())
            .build();
    }

    doFieldEnd(action) {
        let tokens = action.tokens;
        action.setCondition(tokens[2])
            .setSource(tokens.find(token => token.includes("[of] ")));

        return new FlavorTextBuilder("end")
            .from(action)
            .setEffect(action.condition)
            .setSource(action.source)
            .build();
    }

    doSideStatus(action) {
        let tokens = action.tokens;
        action.setSide(tokens[2])
            .setCondition(tokens[3]);

        return new FlavorTextBuilder("start")
            .from(action)
            .setEffect(action.condition)
            .setTrainer(action.getSide())
            .build();
    }

    endSideStatus(action) {
        let tokens = action.tokens;
        action.setSide(tokens[2])
            .setCondition(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        return new FlavorTextBuilder("end")
            .from(action)
            .setEffect(action.condition)
            .setTrainer(action.getSide())
            .setPokemon(action.getSourceName())
            .build();
    }

    doSwapSideConditions(action) {
        return "N/A";
    }

    doVolatileStatus(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setEffect(tokens[3])
            .setSource(tokens.find(token => token.includes("[of] ")))
            .setAbility(tokens.find(token => token.includes("[from] ability: ")));

        let actionName = tokens[1];
        let type;
        if (action.effect == 'typeadd') {
            actionName = 'typeAdd';
            type = tokens[4];
            action.effect = action.ability;
        }
        else if (action.effect == 'typechange') {
            actionName = 'typeChange';
            type = tokens[4];
            if (action.ability) {
                action.effect = action.ability;
                actionName = 'typeChangeFromEffect';
            }
        }
        else if (action.effect == 'Dynamax') {
            if (tokens[4] == "Gmax") {
                action.effect = "gigantamax";
            }
        }

        return new FlavorTextBuilder(actionName)
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .setSource(action.getSourceName())
            .setType(type)
            .build();
    }

    endVolatileStatus(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setEffect(tokens[3]);

        return new FlavorTextBuilder(tokens[1])
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.effect)
            .build();
    }

    doCrit(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('crit')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doSuperEffective(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('superEffective')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doResisted(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('resisted')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doImmune(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('immune')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doItem(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setItem(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        if (!action.source) {
            action.source = action.pokemon;
        }

        return new FlavorTextBuilder("activate")
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSource(action.getSourceName())
            .setTarget(action.getPokemonName())
            .setEffect(action.effect)
            .setItem(action.item)
            .build();
    }

    doEndItem(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setItem(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")))
            .setSource(tokens.find(token => token.includes("[of] ")));

        if (!action.source) {
            action.source = action.pokemon;
        }

        return new FlavorTextBuilder("activate")
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSource(action.getSourceName())
            .setTarget(action.getPokemonName())
            .setEffect(action.effect)
            .setItem(action.item)
            .build();
    }

    doAbility(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setAbility(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")));

        let actionName = "start";
        let effect;
        if (!action.effect) {
            effect = "ability: " + action.ability;
        }
        else {
            actionName = "changeAbility";
        }

        return new FlavorTextBuilder(actionName)
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(effect)
            .setAbility(action.ability)
            .build();
    }

    doEndAbility(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setAbility(tokens[3])
            .setEffect(tokens.find(token => token.includes("[from] ")));

        let actionName = "abilityActivation";
        let effect;
        if (!action.effect && action.ability) {
            effect = "ability: " + action.ability;
        }
        else if (!action.ability) {
            effect = "move: Gastro Acid";
            actionName = "start";
        }

        return new FlavorTextBuilder(actionName)
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(effect)
            .setAbility(action.ability)
            .build();
    }

    doTransform(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setSpecies(tokens[3]);

        return new FlavorTextBuilder('transform')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSpecies(action.getSpeciesName())
            .setEffect("move: Transform")
            .build();
    }

    doMega(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setSpecies(tokens[3])
            .setItem(tokens[4]);

        let trainer = this.stream.battle.sides.find(trainer => trainer.id == action.getPokemonOwner());

        return new FlavorTextBuilder('megaGen6')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSpecies(action.getSpeciesName())
            .setItem(action.item)
            .setTrainer(trainer.name)
            .build();
    }

    doPrimal(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setSpecies(tokens[3])
            .setItem(tokens[4]);

        let trainer = this.stream.battle.sides.find(trainer => trainer.id == action.getPokemonOwner());

        return new FlavorTextBuilder('primal')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSpecies(action.getSpeciesName())
            .setItem(action.item)
            .setTrainer(trainer.name)
            .build();
    }

    doBurst(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setSpecies(tokens[3])
            .setItem(tokens[4]);

        let trainer = this.stream.battle.sides.find(trainer => trainer.id == action.getPokemonOwner());

        return new FlavorTextBuilder('ultraburst')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setSpecies(action.getSpeciesName())
            .setItem(action.item)
            .setTrainer(trainer.name)
            .build();
    }

    doZPower(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('zPower')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doZBroken(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);

        return new FlavorTextBuilder('zBroken')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doTerastallize(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setType(tokens[3]);

        return new FlavorTextBuilder('terastallize')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setType(action.type)
            .build();
    }

    doActivate(action) {
        let tokens = action.tokens;
        if (tokens[2].match(pokemonLongRegex)) {
            action.setPokemon(tokens[2])
                .setEffect(tokens[3])
                .setMove(tokens.find(token => token.includes("move: ")))
                .setItem(tokens.find(token => token.includes("item: ")))
                .setSource(tokens.find(token => token.includes("[of] ")));
        }
        else {
            action.setEffect(tokens[2]);
        }

        let actionName = 'activate';
        if (tokens.includes('[source]')) {
            actionName = 'start';
        }

        return new FlavorTextBuilder(actionName)
            .from(action)
            .setEffect(action.effect)
            .setPokemon(action.getPokemonName())
            .setSource(action.source)
            .setMove(action.move)
            .build();
    }

    doPrepare(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2])
            .setMove(tokens[3])
            .setTarget(tokens[4]);

        return new FlavorTextBuilder('prepare')
            .from(action)
            .setPokemon(action.getPokemonName())
            .setEffect(action.move)
            .setTarget(action.getTargetName())
            .build();
    }

    doMustRecharge(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);
        return new FlavorTextBuilder('recharge')
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }

    doHitCount(action) {
        let tokens = action.tokens;
        action.setPokemon(tokens[2]);
        action.setNumber(tokens[3]);
        let actionName = action.number > 1 ? 'hitCount' : 'hitCountSingular';
        return new FlavorTextBuilder(actionName)
            .from(action)
            .setPokemon(action.getPokemonName())
            .build();
    }
}