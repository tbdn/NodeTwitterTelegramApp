var Twitter = require('./twitter_app');
//var Telegram = require('./telegram_app');

var knownTweets = [];

/*
 * 1) Telegram aufrufen und nach nötigen Linien Fragen
 * 2) Linien als Parameter für die q an Twitter geben
 * 3) Twitter abfragen
 * 4) Wenn neues Ereignis -> Telegram triggern
 */

var outputStuff = function (err, data, response) {
    var tweets = data.statuses;
    for(var i=0; i < tweets.length; i++) {
        // Neuer Tweet ist eingetroffen
        if(!knownTweets.includes(tweets[i].id_str)) {
            knownTweets.push(tweets[i].id_str);
            if(!tweets[i].retweeted_status) {
                if(tweets[i].truncated) {
                    console.info("Tweet automatically Truncated.");
                }
                console.log(tweets[i].text + " - " + tweets[i].created_at);
                console.log("-------");
            }
        } else {
            console.log("Kein neuer Tweet");
            // Seit dem letzten mal suchen sind keine neuen Tweets eingetroffen.
        }
    }
};

var searchString = "#Linie10";
var tweets = Twitter.init(searchString, outputStuff);

