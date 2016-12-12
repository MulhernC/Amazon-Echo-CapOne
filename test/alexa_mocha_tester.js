// 1) Put this file in ~/test
// 2) Change path variables if necessary
// 2) Change APP_ID to Lambda skill that connects to BST provided URL
// 3) Go to home directory in terminal and run the command ./node_modules/mocha/bin/mocha

// hardcoded customer id: "580e9b9ed15f730003173037"
// hardcoded account id: "5821240e17d9f90003c29f82"

var assert = require('assert');
var bst = require('bespoken-tools'); // Install through npm
var server = null;
var alexa = null;
var lambdaFilePath = 'Documents/Coding/Github/Amazon-Echo-CapOne/src/index.js';
var intentSchemaPath = 'Documents/Coding/Github/Amazon-Echo-CapOne/speechAssets/IntentSchema.json';
var sampleUtterPath = 'Documents/Coding/Github/Amazon-Echo-CapOne/speechAssets/SampleUtterances.txt';
var APP_ID = 'amzn1.ask.skill.a6d744d2-f378-4ac9-a948-713aaec01f95';

beforeEach(function (done) {
    server = new bst.LambdaServer(lambdaFilePath, 10000, false);
    alexa = new bst.BSTAlexa('http://localhost:10000',
                intentSchemaPath,
                sampleUtterPath,
                APP_ID);
    server.start(function() {
        alexa.start(function (error) {
            if (error !== undefined) {
                console.error("Error: " + error);
            } else {
                done();
            }
        });
    });
});

describe('Transfer intent', function(){
    it('Returns an error if no money amount is specified', function(done){
        alexa.intended('TransferIntent', {'friend_name':'Stacy'}, function(error, response, request){
            assert(response.response.outputSpeech.text === "I couldn't understand that. Please try your transfer again.");
        });
        done();
    });
    it('Returns an error if no friend is specified', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10'},
            function(error, response, request){
                assert(response.response.outputSpeech.text === "No friend identified. Please try your transfer again.");
            }
        );
        done();
    });
    // Sometimes fail and sometimes succeed
    it('Lists every friend with same name if friend name is not unique', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10', 'friend_name':'Stacy'},
            function(error, response, request){
                assert(response.response.outputSpeech.text === "You have multiple friends with the name Stacy. Say 0 for Stacy Miller, 1 for Stacy Rivera.");
            }
        );
        done();
    });
    it('Asks for confirmation if money amount is specified and friend name is unique', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10', 'friend_name':'Melinda'},
            function(error, response, request){
                assert(response.response.outputSpeech.text === "Would you like to transfer 10 dollars to Melinda Moore? Please say complete transfer or cancel transfer.");
            }
        );
        done();
    });
});

describe('Confirm transfer intent', function(){
    it('Returns an error if no transfer is in progress', function(done){
        alexa.intended('ConfirmTransferIntent', function(error, request, response){
            assert(response.response.outputSpeech.text === "There is no transfer pending approval.");
        });
        done();
    });
    it('Reprompts user if friend name is not unique', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10', 'friend_name':'Stacy'});
        alexa.intended('ConfirmTransferIntent', function(error, request, response){
            assert(response.response.outputSpeech.text === "You have multiple friends with the name Stacy. Say 0 for Stacy Miller, 1 for Stacy Rivera.");
        });
        done();
    });
    it('Carries out transfer if Alexa asks for confirmation', function(done){
        alexa.intended('TransferIntent', {'cent_syn':'cents', 'cent_amount':'2', 'friend_name':'Melinda'});
        alexa.intended('ConfirmTransferIntent', function(error, request, response){
            assert(response.response.outputSpeech.text === "Transferred 2 cents to Melinda Moore.");
        });
        done();
    });
});

describe('Deny transfer intent', function(){
    it('Return an error if no transfer session is in progress', function(done){
        alexa.intended('DenyTransferIntent', function(error, request, response){
            assert(response.response.outputSpeech.text === "There is no transfer pending approval.");
        });
        done();
    });
    it('Cancels transfer if transfer session is in progress', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10', 'friend_name':'Melinda'});
        alexa.intended('DenyTransferIntent', function(error, request, response){
            assert(response.response.outputSpeech.text === "Cancelling previous account transfer.");
        });
        done();
    });
});

describe('Choose number intent', function(){
    it('Returns an error if no transfer session is in progress', function(done){
        // For some reason, the response object is the second parameter, not the third
        alexa.intended('ChooseNumberIntent', {'number':'2'}, function(error, response){
            assert(response.response.outputSpeech.text === "Please make sure you have a pending transfer before selecting any additional options.");
        });
        done();
    });
    it('Reprompts if number selected is out of range', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10', 'friend_name':'Stacy'});
        alexa.intended('ChooseNumberIntent', {'number':'2'}, function(error, request, response){
            assert(response.response.outputSpeech.text === "That number is not within the correct range. Please select a number between 0 and 1");
        });
        done();
    });
    it('Asks to confirm transfer if number selected is valid', function(done){
        alexa.intended('TransferIntent', {'dollar_syn':'dollars', 'dollar_amount':'10', 'friend_name':'Stacy'});
        alexa.intended('ChooseNumberIntent', {'number':'0'}, function(error, request, response){
            assert(response.response.outputSpeech.text === "Would you like to transfer 10 dollars to Stacy Miller? Please say complete transfer or cancel transfer.");
        });
        done();
    });
});

describe('Balance enqiry intent', function(){
    it('Tells current balance', function(done){
        alexa.intended('BalanceEnquiryIntent', function(error, request, request){
            assert(response.response.outputSpeech.text);
        });
        done();
    });
})


afterEach(function(done) {
    alexa.stop(function () {
        server.stop(function () {
            done();
        });
    });
});