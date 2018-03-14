var Twitter = require('./twitter_app');
var Telegram = require('./telegram_app');

var knownTweets = [];
var observedLines = Telegram.observed();
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
        observedLines = Telegram.observed();
    }

    if(searchString) {
        var tweets = Twitter.init(searchString, outputStuff);
        console.log(tweets);
        //Telegram.broadcast(tweets);
    }
};

var outputStuff = function (err, data, response) {
    var tweets = data.statuses;
    for(var i=0; i < tweets.length; i++) {
        // Neuer Tweet ist eingetroffen
        if(!knownTweets.includes(tweets[i].id_str)) {
            knownTweets.push(tweets[i].id_str);
            if(!tweets[i].retweeted_status) {
                /*
                if(tweets[i].truncated) {
                    console.info("Tweet automatically Truncated.");
                }
                 */
                var message = tweets[i].text + " - " + tweets[i].created_at;
                Telegram.broadcast(message);
            }
        } else {
            //console.log("Kein neuer Tweet");
            // Seit dem letzten mal suchen sind keine neuen Tweets eingetroffen.
        }
    }
};

setInterval(initTwitterCall, 10000);