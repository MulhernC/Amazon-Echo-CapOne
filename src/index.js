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
var accounts = [];
var multipleFriendsFlag = false;
var multipleAccountsFlag = false;
var myId = "580e9b9ed15f730003173037";
var http = require('http');
var url = "http://capitalone-rest-api.herokuapp.com/api/";
var capOneUrl = "http://api.reimaginebanking.com/";
var capOneKey = "?key=a25516d86f4912c66ad15823b82fc67c";



// Extend AlexaSkill
CapitalOne.prototype = Object.create(AlexaSkill.prototype);
CapitalOne.prototype.constructor = CapitalOne;

CapitalOne.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("CapitalOne onSessionStarted requestId: " + sessionStartedRequest.requestId
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
        accounts = [];
        multipleFriendsFlag = false;
        multipleAccountsFlag = false;

        if (dollars == "" || isNaN(dollars)) {
           dollars = null;
        }        

        if (cents == "" || isNaN(cents)) {
           cents = null;
        }

        if (dollars == null && cents == null) {
           response.tellWithoutEnd("I couldn't understand that. Please try your transfer again.");
           return;
        }
        else if ((dollars != null && dollars <= 0) || (cents != null && (cents <= 0 || cents >= 100))) {
           response.tellWithoutEnd("I couldn't understand that. Please try your transfer again with a valid amount between 0 and 5000 dollars.");
           return;
        }    
        else {
          getFriendsList(myId, function(friends) {
         // Data reception is done, do whatever with it!
           if (friends == null || (friends != null && friends.length == 0)) {
            response.tell("I couldn't access your friends list. Please try your transfer again.");
            return;
           }
           else {
             var friendCount = friends.length;
             var responseCount = 0;

             for (var i = 0; i < friends.length; i++) {
                processFriend(friends[i], function(obj) {
                   responseCount++;
                   if (obj != null && obj.first_name.toLowerCase() == friend.toLowerCase()) {
                      transferTo.push(obj);
                      transferTo.push(obj);
                   }
                   if (responseCount == friendCount) {
                      var multipleFriendsObj = getMultipleFriends();
                      tellerMethod(multipleFriendsObj, response);
                      if (multipleFriendsObj != null) {
                        return;
                      }
                      var testId = "57f5af2b360f81f104543a72";
                      //use transferTo[0]._id instead of testId
                      getAccounts(testId, function(accountsObj) {
                        accounts = accountsObj;
                        var multipleAccountsObj = getMultipleAccounts();
                        tellerMethod(multipleAccountsObj, response);
                        if (multipleAccountsObj != null) {
                          return;
                        }

                        if (accounts == null) {
                          response.tell("I couldn't access that friends accounts right now. Please try again later.");
                          return;
                        }
                        else {
                          response.tellWithoutEnd("Would you like to transfer " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + "? Please say complete transfer or cancel transfer.");
                          return;
                        }
                      });
                   }
                });
             }
            }
        });
      }
    },
    "ConfirmTransferIntent": function (intent, session, response) {
        if (multipleFriendsFlag) {
            tellerMethod(getMultipleFriends(), response);
        }
        else if (multipleAccountsFlag) {
            tellerMethod(getMultipleAccounts(), response);
        }
        else if (dollars != null || cents != null) {
            var responseString = "Transferred " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + ".";
            resetSavedValues();
            response.tellWithCard(responseString);
            return;
        }
        else {
            response.tellWithoutEnd("There is no transfer pending approval.");
            return;
        }
    },
    "DenyTransferIntent": function (intent, session, response) {
        if (dollars != null || cents != null) {
            resetSavedValues();
            response.tell("Cancelling previous account transfer.");
            return;
        }
        else {
            response.tell("There is no transfer pending approval.");
            return;
        }
    },
    "ChooseNumberIntent": function (intent, session, response) {
        if (multipleFriendsFlag) {
            if (intent.slots.number.value >= transferTo.length) {
                response.tellWithoutEnd("That number is not within the correct range. Please select a number between 0 and " + (transferTo.length - 1));
                return;
            }
            else {
                var selectedObj = transferTo[intent.slots.number.value];
                transferTo = [];
                transferTo.push(selectedObj);
                multipleFriendsFlag = false;
                var testId = "57f5af2b360f81f104543a72";
                //use transferTo[0]._id instead
                getAccounts(testId, function(accountObj) {
                  accounts = accountObj;
                  tellerMethod(getMultipleAccounts(), response);
                  response.tellWithoutEnd("Would you like to transfer " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + "? Please say complete transfer or cancel transfer.");
                  return;
                });
            }
        }
        else if (multipleAccountsFlag) {
          if (intent.slots.number.value >= accounts.length) {
            response.tellWithoutEnd("That number is not within the correct range. Please select a number between 0 and " + (transferTo.length - 1));
            return;
          }
          else {
            var selectedObj = accounts[intent.slots.number.value];
            accounts = [];
            accounts.push(selectedObj);
            multipleAccountsFlag = false;
            response.tellWithoutEnd("Would you like to transfer " + formatMoney(dollars, cents) + " to " + transferTo[0].first_name + " " + transferTo[0].last_name + " " + accounts[0].type + " account? Please say complete transfer or cancel transfer.");
            return;
          }
        }
        else {
          response.tell("Please make sure you have a pending transfer before selecting any additional options.");
          return;
        }
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can perform bank transactions.", "You can perform bank transactions. Try something like, transfer ten dollars and fifty cents to John");
    }
};

function getFriendsList(customerId, callback) {
  http.get(url + "customers/" + customerId + "/friends", function(message) {
      var body = '';
      message.on('data', function(d) {
        body += d;
      });
      message.on('end', function() {
        callback(JSON.parse(body));
      });
      message.on('error', function() {
        console.log(message);
        var returnArr = [];
        callback(returnArr);
      });
  });
}

function getAccounts(customerId, callback) {
  http.get(capOneUrl + "customers/" + customerId + "/accounts" + capOneKey, function(message) {
      var body = '';
      message.on('data', function(d) {
        body += d;
      });
      message.on('end', function() {
        callback(JSON.parse(body));
      });
      message.on('error', function() {
        console.log(message);
        var returnArr = [];
        callback(returnArr);
      });
  });
}

function tellerMethod(tellObj, response) {
  if (tellObj != null) {
    if (tellObj.tell == "tell") {
      response.tell(tellObj.responseString);
    }
    else if (tellObj.tell == "tellWithoutEnd") {
      response.tellWithoutEnd(tellObj.responseString);
    }
    else if (tellObj.tell == "tellWithCard") {
      response.tellWithCard(tellObj.responseString);
    }
    else if (tellObj.tell == "ask") {
      response.ask(responseString, responseString);
    }
    else if (tellObj.tell == "askWithCard") {
      response.askWithCard(responseString, responseString);
    }
  }
}

function getMultipleAccounts() {
  var responseString = "";
  if (accounts.length == 0) {
    responseString = "I couldn't find any accounts for " + friend;
    return {"tell": "tell", "responseString": responseString};
  }
  else if (accounts.length > 1) {
    multipleAccountsFlag = true;
    responseString += transferTo[0].first_name + " " + transferTo[0].last_name + " has more than one account. Say ";

     for (var i = 0; i < accounts.length; i++) {
        responseString += i + " for " + accounts[i].type;
        if (i + 1 != accounts.length) {
           responseString += ", ";
        }
        else {
           responseString += ".";
        }
     }
     return {"tell": "tellWithoutEnd", "responseString": responseString};
  }

  return null;
}

function getMultipleFriends() {
  var responseString = "";
  if (transferTo.length == 0) {
     responseString = "I couldn't find anyone on your friends list with the name " + friend;
     return {"tell": "tell", "responseString": responseString};
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
     return {"tell": "tellWithoutEnd", "responseString": responseString};
  }

  return null;
}

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
   accounts = [];
   multipleFriendsFlag = false;
   multipleAccountsFlag = false;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the CapitalOne skill.
    var capitalOne = new CapitalOne();
    capitalOne.execute(event, context);
};

