// Dependencies =========================
var twit = require('twit');
var config = require('./configs/twitter');
var Twitter = new twit(config);

var params = {
    q: '#Linie3 OR #Linie7 OR #Linie10 OR #Linie17',
    result_type: 'recent'
};

Twitter.get('search/tweets', params, gotData);

function gotData(err, data, response) {
    var tweets = data.statuses;
    for(var i=0; i < tweets.length; i++) {
        if(!tweets[i].retweeted_status) {
            if(tweets[i].truncated) {
                console.info("Tweet - Truncated. Visit full tweet at http://www.twitter.com/statuses/" + tweets[i].id_str);
            }
            console.log(tweets[i].text + " - " + tweets[i].created_at);
            console.log("-------");
        }
    }
};