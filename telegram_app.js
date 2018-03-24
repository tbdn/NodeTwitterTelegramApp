module.exports.getObservedLines = getObservedLines;
module.exports.getActiveUsers = getActiveUsers;

module.exports.saveUser = getLinesForUserSaveable;

module.exports.broadcast = broadcast;
module.exports.alert = alert;

const BOTNAME = "UestraAlerts";
const https = require('https');
const TIMER = 1000;
const TELEGRAM_TOKEN = require('./configs/telegram').telegram_token;
const TELEGRAM_BASE_URL = 'https://api.telegram.org/bot'+TELEGRAM_TOKEN;

var lines = [];
var activeUsers = new Set();
var observedLines = new Set();
var offset = undefined;

console.log("Bot online");
generateOffset();

/**
 * get the last updates from telegram
 */
function generateOffset(){
    https.get(TELEGRAM_BASE_URL+'/getUpdates', function(response) {

        data = '';

        response.on('data',function(chunk){
            data += chunk;
        });

        response.on('end', function(){
            console.log("Generating offset");
            result = JSON.parse(data).result;

            if(result == null || result.length == 0){
                console.log("result is "+JSON.stringify(result, null, 4));
                offset = -1;
            }else{
                offset = result[result.length-1].update_id+1;
                console.log("offset set to "+offset);
            }
            setTimeout(getUpdates, TIMER);
        });


    }).on("error", function(err){
        console.log("error while receiving updates: "+err.message);
    });

}

function getUpdates() {
    https.get(TELEGRAM_BASE_URL+'/getUpdates?offset='+offset, function(response) {

        data = '';

        response.on('data',function(chunk){
            data += chunk;
        });

        response.on('end', function(){
            parseUpdates(JSON.parse(data).result);
            setTimeout(getUpdates, TIMER);
        });


    }).on("error", function(err){
        console.log("error while receiving updates: "+err.message);
    });
}

function parseUpdates(results){
    if(results == null || results.length == 0)return;
    if(offset = 0)offset = results[results.length-1].update_id+1;
    //console.log("Parsing results: "+JSON.stringify(results, null, 4));
    for (key in results){
        result = results[key];
        //console.log(JSON.stringify(result, null, 4));
        if(result.message == undefined)continue;
        raw = result.message.text.split(" ");
        command(result.message.chat.id,raw[0],raw.slice(1));


    }
    offset = results[results.length-1].update_id+1;

}

/**
 * Parse a single command and react
 * @param user chat id of the user that issued the command
 * @param command command text, first part of the message text
 * @param parameters remaining part of the message, split at spaces
 */
function command(user, command, parameters){
    if(command.includes("@"+BOTNAME))command = command.split("@")[0];
    switch(command){
        case "/add":
            if(parameters == null || parameters == undefined || parameters.length == 0 || !onlyNumbers(parameters)){
                message(user, "Parameters must be numbers and can't be empty.");

            }else{
                for(line of parameters){
                    addLine(user, line);
                }
                message(user, "Added "+parameters.toString().replace(" ",",")+" to your subscribed lines.");

            }
            break;
        case "/remove":
            if(parameters == null || parameters == undefined || parameters.length == 0 || !onlyNumbers(parameters)){
                message(user, "Parameters must be numbers and can't be empty.");

            }else{
                for(line of parameters){
                    removeLine(user, line);
                }
                message(user, "Removed "+parameters.toString().replace(" ",",")+" from your subscribed lines.");

            }
            break;
        case "/active":
            activeUsers.add(user);
            message(user, "Notifications activated.");
            break;
        case "/pause":
            activeUsers.delete(user);
            message(user, "Notifications paused. Use `/active` to reactivate notifications.");
            break;
        case "/help":
            message(user, "This bot can be used to get informations about problems with uestra lines."
                +"Use `/add` to subscribe to one or multiple lines and `/remove` to remove them."
                +"You can use `/active` and `/pause` to activate or pause notifications.");
            break;
        case "/subscribed":
            message(user, "You are currently subscribed to: "+getLinesForUser(user));
            break;
        case "/start":
            message(user, "Welcome to the UestraAlertsBot. You can subscribe to a line using /add (e.g. /add 1) and activate/pause bot messages with /active and /pause.")
            break;
        case "/alert":
            for(line of parameters){
                alert(line, "Alarm fuer Cobra "+line);
            }
            //message(user, "The subscribers of the lines "+parameters.toString().replace(" ",",")+" have been alerted.");
            break;
        case "/broadcast":
            broadcast("BROTKAST: "+parameters.join(" "));
            break;
        default:
            message(user, "Unknown command.");
            break;
    }
}

function onlyNumbers(parameters){
    for(p of parameters){
        if(isNaN(p))return false;
    }
    return true;
}

function alert(line, text) {
    if(lines[line] == null || lines[line] == undefined)return;
    for(id of lines[line]){
        console.log("Trying to alert "+id);
        console.log("Is user active: "+activeUsers.has(id));
        if(activeUsers.has(id)){
            console.log("Alerting "+id+"|");
            message(id, text);
        }
    }
}

function broadcast(text){
    for(id of activeUsers){
        message(id, text);
    }
}

function addLine(user_id, line){
    activeUsers.add(user_id);
    if(lines[line] == undefined || lines[line] == null){
        lines[line] = [];
    }
    observedLines.add(line);
    lines[line].push(user_id);
}

function removeLine(user_id, line){
    if(lines[line] == undefined || lines[line] == null || lines[line].indexOf(user_id) == -1){
        return;
    }else if(lines[line].length == 0 && observedLines.has(line)){
        observedLines.delete(line);
    }
    lines[line].splice(lines[line].indexOf(user_id),1);
}

function getObservedLines(){
    return observedLines;
}

function getActiveUsers() {
    return activeUsers;
}

function getLinesForUserSaveable(user_id){
    userLines = [];
    userLines.push(user_id);
    for(line in lines){
        if(lines[line] != undefined && lines[line].includes(user_id))userLines.push(line);
    }
    return userLines;
}

function getLinesForUser(user_id){
    userLines = [];
    for(line in lines){
        if(lines[line] != undefined && lines[line].includes(user_id))userLines.push(line);
    }
    return userLines;
}

function message(chat_id, text){
    console.log("Sending message \""+text+"\" to "+chat_id);

    jsonMessage = JSON.stringify({
        chat_id: chat_id,
        text: text,
        parse_mode: 'HTML'
    });

    postheaders = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonMessage, 'utf8')
    };

    options = {
        hostname: 'api.telegram.org',
        path: '/bot'+TELEGRAM_TOKEN+'/sendMessage',
        method: 'POST',
        headers: postheaders
    };

    request = https.request(options, function(res){});
    request.write(jsonMessage);
    request.end();
    request.on('error', function(e){
       console.error(e);
    });
    /*https.get(TELEGRAM_BASE_URL+'/sendMessage?chat_id='+chat_id+'&text='+text, function(){}).on('error', function(err){
        console.log("error while sending message: "+err.message);
    });*/
}