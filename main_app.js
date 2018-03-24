var Twitter = require('./twitter_app');
var Telegram = require('./telegram_app');
var fs = require('fs');

var knownTweets = [];
var observedLines = Telegram.getObservedLines();
var searchString;

/*
 * 1) Telegram aufrufen und nach nötigen Linien Fragen
 * 2) Linien als Parameter für die q an Twitter geben
 * 3) Twitter abfragen
 * 4) Wenn neues Ereignis -> Telegram triggern
 */

var getSearchQuery = function (observedLines) {
    searchString = "";
    observedLines.forEach(function (value) {
        searchString += "#Linie" + value + " OR ";
    });
};

var initTwitterCall = function () {
    if(observedLines) {
        getSearchQuery(observedLines);
        console.log(searchString);
    } else {
        observedLines = Telegram.getObservedLines();
    }

    if(searchString) {
        Twitter.init(searchString, outputStuff);
    }
};

var outputStuff = function (err, data, response) {
    var tweets = data.statuses;
    for(var i=0; i < tweets.length; i++) {
        // Neuer Tweet ist eingetroffen
        if(!knownTweets.includes(tweets[i].id_str)) {
            knownTweets.push(tweets[i].id_str);
            if(!tweets[i].retweeted_status) {
                for(line of observedLines){
                    if(tweets[i].text.includes("#Linie"+line )) {
                        Telegram.alert(line, tweets[i].text);
                        break;
                    }
                }
            }
        } else {
            // Seit dem letzten mal suchen sind keine neuen Tweets eingetroffen.
        }
    }
};

//DEBUG: 1 Minute pro Abruf-Zyklus
setInterval(initTwitterCall, 10000);
// 5 Minuten pro Abruf-Zyklus
//setInterva(initTwitterCall, 300000);

process.on('SIGINT', function(){
    Telegram.broadcast("The bot is shutting down now, good night :)");

    var au = Telegram.getActiveUsers();
    if(au) {
        console.log("Telegram.activeUsers_set : ");
        au.forEach(function (user) {
            fs.appendFile('./saved/activeUsers.json', Telegram.saveUser(user) + '\n', function (err) {
                if(err) {
                    throw err;
                }
            })
        });
    }
setTimeout(process.exit,1000);
});