// Dependencies =========================
var twit = require('twit');
var config = require('./configs/twitter');
var Twitter = new twit(config);

var init = function (searchString, callback) {
    var params = {
        q: searchString,
        result_type: 'recent'
    };
    performApiCall(params, callback)
};

var performApiCall = function (params, callback) {
    Twitter.get('search/tweets', params, callback);
};

//setInterval(tryToGetData, 10000);

module.exports.init = init;