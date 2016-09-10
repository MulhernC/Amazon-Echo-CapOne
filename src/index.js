/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID =  "amzn1.ask.skill.3498e299-c62e-4251-bdcd-42925085447d"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

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

// Extend AlexaSkill
CapitalOne.prototype = Object.create(AlexaSkill.prototype);
CapitalOne.prototype.constructor = CapitalOne;

CapitalOne.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

CapitalOne.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HelloWorld onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to hello world! Say hello.";
    var repromptText = "You can say hello.";
    response.ask(speechOutput, repromptText);
};

CapitalOne.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HelloWorld onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

CapitalOne.prototype.intentHandlers = {
    // register custom intent handlers
    "TransferIntent": function (intent, session, response) {
        var dollars = intent.slots.dollar_amount.value;
        var cents = intent.slots.cent_amount.value;
        var responseString = "Would you like to transfer ";
        
        if (dollars != null && cents != null) {
            responseString += dollars + " dollars and " + cents + " cents"
        }
        else if (dollars != null) {
            responseString += dollars + " dollars"
        }
        else if (cents != null) {
            responseString += cents + " cents"
        }
        responseString += " to account?"
 
        response.ask(responseString, "Please confirm your transaction. " + responseString);
        //response.tellWithCard("Hello World!", "Hello World", "Hello World!");
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the CapitalOne skill.
    var capitalOne = new CapitalOne();
    capitalOne.execute(event, context);
};

