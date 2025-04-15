import { assert } from "chai";
import { ShowdownMessageTranslator } from "../infrastructure/streams/ShowdownMessageTranslator.js";
import { Battle } from "../entities/battles.js";
import * as Showdown from "urpg-battle-bot-calc";

var translator;

describe('Showdown Message Translator', function() {
    before('using Showdown', function() {
        Showdown.default.Dex.loadTextData();
    });

    beforeEach('using new ShowdownMessageTranslator', function () {
        translator = new ShowdownMessageTranslator(new Battle());
    });

    describe('given -activate message', function() {
        it('with ability: modifier, should print ability activation tag with ability-specific activate message', function() {
            const command = "|-activate|p2a: Koraidon|ability: Orichalcum Pulse";
            let result = translator.handleMessage(command);
            assert.equal(result, "[Koraidon's Orichalcum Pulse]\nKoraidon basked in the sunlight, sending its ancient pulse into a frenzy!");
        });
 
        it('with [source] modifier, should print ability-specific start message', function() {
            const command = "|-activate|p2a: Koraidon|Orichalcum Pulse|[source]";
            let result = translator.handleMessage(command);
            assert.equal(result, "Koraidon turned the sunlight harsh, sending its ancient pulse into a frenzy!");
        });

        it('with [fromitem] modifier, should print ability-specific activateFromItem message', function() {
            const command = "|-activate|p1a: Brute Bonnet|ability: Protosynthesis|[fromitem]";
            let result = translator.handleMessage(command);
            assert.equal(result, "[Brute Bonnet's Protosynthesis]\nBrute Bonnet used its Booster Energy to activate Protosynthesis!");
        });
    });

    describe('given -end message', function() {
        it('with an unmarked ability effect, should print ability-specific end message', function() {
            const command = "|-end|p1a: Brute Bonnet|Protosynthesis";
            let result = translator.handleMessage(command);
            assert.equal(result, "The effects of Brute Bonnet's Protosynthesis wore off!");
        });
    });
        
    it('given a stat: modifier, should print message with [STAT] injected', function() {
        const command = "|-start|p1a: Brute Bonnet|protosynthesis|stat: atk";
        let result = translator.handleMessage(command);
        assert.equal(result, "Brute Bonnet's Attack was heightened!");
    });

    it('given an [of] modifier with a POKEMON, should print message with [SOURCE] injected', function() {
        const command = "|-activate|p1a: Oinkologne|ability: Lingering Aroma|Pickup|[of] p2a: Ishmael";
        let result = translator.handleMessage(command);
        assert.equal(result, "[Oinkologne's Lingering Aroma]\nA lingering aroma clings to Ishmael!");
    });
});