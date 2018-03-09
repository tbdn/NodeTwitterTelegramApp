// Dependencies =========================
var twit = require('twit');
var config = require('./configs/twitter');
var Twitter = new twit(config);

var params = {
    q: '#Linie3 OR #Linie7 OR #Linie10 OR #Linie17',
    result_type: 'recent'
};

var knownTweets = [];

function tryToGetData() {
    Twitter.get('search/tweets', params, gotData);
}

function gotData(err, data, response) {
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
            // Seit dem letzten mal suchen sind keine neuen Tweets eingetroffen.
        }
    }
};

setInterval(tryToGetData, 10000);