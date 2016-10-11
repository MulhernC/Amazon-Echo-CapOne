/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID =  "amzn1.ask.skill.345c7f5a-160f-4a3e-99c8-ced29f7ede90"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * CapitalOne is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var CapitalOne = function () {
    AlexaSkill.call(this, APP_ID);
};
var dollars = null;
var cents = null;
var friend = null;


// Extend AlexaSkill
CapitalOne.prototype = Object.create(AlexaSkill.prototype);
CapitalOne.prototype.constructor = CapitalOne;

CapitalOne.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

CapitalOne.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("CapitalOne onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to Capital One! You can perform banking transactions.";
    response.tell(speechOutput);
};

CapitalOne.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("CapitalOne onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

CapitalOne.prototype.intentHandlers = {
    // register custom intent handlers
    "TransferIntent": function (intent, session, response) {
        resetSavedValues();
        dollars = intent.slots.dollar_amount.value;
        cents = intent.slots.cent_amount.value;
        friend = intent.slots.friend_name.value;

        if (dollars == "" || isNaN(dollars)) {
            dollars = null;
        }        

        if (cents == "" || isNaN(cents)) {
            cents = null;
        }
        
        if ((dollars == null && cents == null) || (isNaN(dollars) && isNaN(cents))) {
            response.tell("I couldn't understand that. Please try your transfer again.");
        }
        if ((dollars != null && dollars <= 0) || (cents != null && cents <= 0)){
            response.tell("I couldn't understand that. Please prompt a valid amount between 0 and 5000 dollars.");
        }    
        else {
            var responseString = "Would you like to transfer " + formatMoney(dollars, cents) + " to " + friend + "? Please say complete transfer or cancel transfer.";
            response.ask(responseString, responseString);
        }
    },
    "ConfirmTransferIntent": function (intent, session, response) {
        if (dollars != null || cents != null) {
            response.tell("Transferring " + formatMoney(dollars, cents) + " to " + friend + ".");
            resetSavedValues();
        }
        else {
            response.tell("Your transaction can't be processed. Please try again.");
        }
    },
    "DenyTransferIntent": function (intent, session, response) {
        if (dollars != null || cents != null) {
            response.tell("Cancelling previous account transfer.");
        }
        else {
            response.tell("There is no transfer pending approval.");
        }
        resetSavedValues();
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can perform bank transactions.", "You can perform bank transactions. Try something like, transfer ten dollars and fifty cents to John");
    }
};

function formatMoney(dollars, cents) {
    var responseString = "";
        
    if (dollars != null && cents != null) {
        responseString += dollars + " dollar" + (dollars == "1" ? "" : "s") + " and " + cents + " cent" + (cents == "1" ? "" : "s")
    }
    else if (dollars != null) {
        responseString += dollars + " dollar" + (dollars == "1" ? "" : "s")
    }
    else if (cents != null) {
        responseString += cents + " cent" + (cents == "1" ? "" : "s")
    }

    return responseString;
}

function resetSavedValues() {
    dollars = null;
    cents = null;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the CapitalOne skill.
    var capitalOne = new CapitalOne();
    capitalOne.execute(event, context);
};

