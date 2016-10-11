var dollars = null;
var cents = null;
var friend = null;
var transferTo = [];
var multipleFriendsFlag = false;
var myId = "57f5aeb9360f81f104543a71";
var http = require('http');

resetSavedValues();
dollars = 100;
cents = 50;
friend = "melinda";

if (dollars == "" || isNaN(dollars)) {
   dollars = null;
}        

if (cents == "" || isNaN(cents)) {
   cents = null;
}

if ((dollars == null && cents == null) || (isNaN(dollars) && isNaN(cents))) {
   console.log("I couldn't understand that. Please try your transfer again.");
}
if (dollars <= 0 || cents <= 0){
   console.log("I couldn't understand that. Please prompt a valid amount between 0 and 5000 dollars.");
}    
else {
   http.get("http://capitalone-rest-api.herokuapp.com/api/customers/" + myId + "/friends", function(message)
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
                  var responseString = "";
                  if (transferTo.length > 1) {
                     multipleFriendsFlag = true;
                     responseString += "You have multiple friends with the name, " + friend + ". Say ";
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
                  }
                  else {
                     responseString = "Would you like to transfer " + formatMoney(dollars, cents) + " to " + friend + "? Please say complete transfer or cancel transfer.";
                     console.log(responseString);
                  }
               }
            });
         }
      });
   });
}

function processFriend(friendId, callback) {
   http.get("http://capitalone-rest-api.herokuapp.com/api/customers/" + friendId, function(message) {
      var body = '';
      message.on('data', function(d) {
         body += d;
      });
      message.on('end', function() {
         var friendObj = JSON.parse(body);
         callback(friendObj);
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
}