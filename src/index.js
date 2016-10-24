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
var transferTo = [];
var multipleFriendsFlag = false;
var myId = "57f5aeb9360f81f104543a71";
var http = require('http');
var url = "http://capitalone-rest-api.herokuapp.com/api/";
var sessionEnded = true;


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
    response.ask(speechOutput, "Say something like transfer five dollars and three cents to Bob");
};

CapitalOne.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("CapitalOne onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    resetSavedValues();
    // any cleanup logic goes here
};

CapitalOne.prototype.intentHandlers = {
    // register custom intent handlers
    "TransferIntent": function (intent, session, response) {
        var responseString = "";

        dollars = intent.slots.dollar_amount.value;
        cents = intent.slots.cent_amount.value;
        friend = intent.slots.friend_name.value;
        transferTo = [];
        multipleFriendsFlag = false;

        if (dollars == "" || isNaN(dollars)) {
           dollars = null;
        }        

        if (cents == "" || isNaN(cents)) {
           cents = null;
        }

        if (dollars == null && cents == null) {
           response.tellWithoutEnd("I couldn't understand that. Please try your transfer again.");
        }
        if ((dollars != null && dollars <= 0) || (cents != null && (cents <= 0 || cents >= 100))) {
           response.tellWithoutEnd("I couldn't understand that. Please prompt a valid amount between 0 and 5000 dollars.");
        }    
        else {
           http.get(url + "customers/" + myId + "/friends", function(message)
           {
              var body = '';
              message.on('data', function(d) {
                 body += d;
              });
              message.on('end', function() {
                 // Data reception is done, do whatever with it!
                 var friends = JSON.parse(body);
                 var friendCount = friends.length;
                 var responseCount = 0;

                 for (var i = 0; i < friends.length; i++) {
                    processFriend(friends[i], function(obj) {
                       responseCount++;
                       if (obj.first_name.toLowerCase() == friend.toLowerCase()) {
                          transferTo.push(obj);
                       }
                       if (responseCount == friendCount) {
                          if (transferTo.length == 0) {
                             responseString = "I couldn't find anyone on your friends list with the name " + friend;
                             response.tell(responseString);
                          }
                          else if (transferTo.length > 1) {
                             multipleFriendsFlag = true;
                             responseString = "You have multiple friends with the name " + friend + ". Say ";
                             for (var j = 0; j < transferTo.length; j++)
                             {
                                responseString += j + " for " + friend + " " + transferTo[j].last_name;
                                if (j + 1 != transferTo.length) {
                                   responseString += ", ";
                                }
                                else {
                                   responseString += ".";
                                }
                             }
                             sessionEnded = false;
                             response.tellWithoutEnd(responseString);
                          }
                          else {
                             responseString = "Would you like to transfer " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + "? Please say complete transfer or cancel transfer.";
                             sessionEnded = false;
                             response.ask(responseString, responseString);
                          }
                       }
                    });
                 }
              });
              message.on('error', function() {
                 console.log(message);
                 response.tell("I can't access your friends list right now. Please try again later.");
              });
           });
        }
    },
    "ConfirmTransferIntent": function (intent, session, response) {
        if ((dollars != null || cents != null) && multipleFriendsFlag == false) {
            var responseString = "Transferring " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + ".";
            resetSavedValues();
            response.tellWithCard(responseString);
        }
        else {
            response.tellWithoutEnd("Your transaction can't be processed. Please try again.");
        }
    },
    "DenyTransferIntent": function (intent, session, response) {
        if (dollars != null || cents != null) {
            resetSavedValues();
            response.tell("Cancelling previous account transfer.");
        }
        else {
            response.tell("There is no transfer pending approval.");
        }
    },
    "ChooseFriendIntent": function (intent, session, response) {
        if (multipleFriendsFlag) {
            if (intent.slots.friend_number.value >= transferTo.length) {
                response.tellWithoutEnd("That number is not within the correct range. Please select a number between 0 and " + (transferTo.length - 1));
            }
            else {
                transferTo[0] = transferTo[intent.slots.friend_number.value];
                multipleFriendsFlag = false;
                response.tellWithoutEnd("Would you like to transfer " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + "? Please say complete transfer or cancel transfer.");
            }
        }
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can perform bank transactions.", "You can perform bank transactions. Try something like, transfer ten dollars and fifty cents to John");
    }
};

function processFriend(friendId, callback) {
   http.get(url + "customers/" + friendId, function(message) {
      var body = '';
      message.on('data', function(d) {
         body += d;
      });
      message.on('end', function() {
         var friendObj = JSON.parse(body);
         callback(friendObj);
      });
      message.on('error', function() {
         console.log(message);
         callback(null);
      });
   });
}

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
   friend = null;
   transferTo = [];
   multipleFriendsFlag = false;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the CapitalOne skill.
    var capitalOne = new CapitalOne();
    capitalOne.execute(event, context);
};

