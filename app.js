// Dependencies =========================
var twit = require('twit');
var config = require('./configs/twitter');
var Twitter = new twit(config);

var params = {
    q: '#Linie10',
    count: 2
};

Twitter.get('search/tweets', params, gotData);

function gotData(err, data, response) {
    var tweets = data.statuses;
    for(var i=0; i < tweets.length; i++) {
        console.log(tweets[i].text);
    }
};