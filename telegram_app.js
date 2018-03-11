const https = require('https');
const TIMER = 1000;
const TELEGRAM_TOKEN = require('./configs/telegram').telegram_token;
const TELEGRAM_BASE_URL = 'https://api.telegram.org/bot'+TELEGRAM_TOKEN;

var lines = [];
var activeUsers = new Set();
var offset = -1;
console.log("Bot online");
generateOffset();
console.log("Offset found: "+offset);
setInterval(getUpdates, TIMER);

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
            result = JSON.parse(data).result;

            if(result == null || result.length == 0){
                console.log("result is "+JSON.stringify(result, null, 4));
                offset = -1;
                return;
            }
            offset = result[result.length-1].update_id+1;
            console.log("offset set to "+offset);
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
        console.log(JSON.stringify(result, null, 4));

        raw = result.message.text.split(" ");
        command(result.message.chat.id,raw[0],raw.slice(1));

        /*if(result.message.text.includes("/addLines")){
            console.log("adding lines");
            lines_raw = result.message.text.replace("/addLines","").replace(" ","").split(",");
            for(i of lines_raw){
                console.log("adding "+i);
                addLine(result.message.chat.id,i);
            }
        }
        else if(result.message.text.includes('/alert')){
            console.log("alerting lines");
            lines_raw = result.message.text.replace("/alert","").replace(" ","").split(",");
            for(i of lines_raw){
                console.log("alerting "+i);
                alert(i,"Linie "+i+" war wohl von erixx.");
            }
        }
        else if(result.message.text == '/getUpdates') {
            message(result.message.chat.id, "Test");
        }
        else{
            message(result.message.chat.id, "Unbekannter Command von "+result.message.from.first_name);
        }*/
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
    switch(command){
        case "/add":
            for(line of parameters){
                addLine(user, line);
            }
            message(user, "Added "+parameters.toString().replace(" ",",")+" to your subscribed lines.");
            break;
        case "/remove":
            for(line of parameters){
                removeLine(user, line);
            }
            message(user, "Removed "+parameters.toString().replace(" ",",")+" from your subscribed lines.");
            break;
        case "/active":
            activeUsers.add(user);
            message(user, "Notifications activated.");
            break;
        case "/pause":
            activeUsers.remove(user);
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
        case "/alert":
            for(line of parameters){
                alert(line, "Alarm für Cobra "+line);
            }
            message(user, "The subscribers of the lines "+parameters.toString().replace(" ",",")+" have been alerted.");
            break;
        default:
            message(user, "Unknown command.");
            break;
    }
}

function alert(line, text) {
    if(lines[line] == null || lines[line] == undefined)return;
    for(id of lines[line]){
        console.log("Trying to alert "+id);
        if(activeUsers.has(id)){
            console.log("Alerting "+id);
            message(id, text);
        }
    }
}

function addLine(user_id, line){
    if(lines[line] == undefined || lines[line] == null){
        lines[line] = [];
    }
    lines[line].push(user_id);
}

function removeLine(user_id, line){
    if(lines[line] == undefined || lines[line] == null || lines[line].indexOf(user_id) == -1){
        return;
    }
    lines[line].splice(lines[line].indexOf(user_id),1);
}

function getLinesForUser(user_id){
    userLines = [];
    for(line in lines){
        if(lines[line] != undefined && lines[line].includes(user_id))userLines.push(line);
    }
    return userLines;
}

function message(chat_id, text){
    https.get(TELEGRAM_BASE_URL+'/sendMessage?chat_id='+chat_id+'&text='+text, function(){}).on('error', function(err){
        console.log("error while sending message: "+err.message);
    });
}