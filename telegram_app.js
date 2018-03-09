const https = require('https');
const TIMER = 1000;
const TELEGRAM_TOKEN = require('./configs/telegram').telegram_token;
const TELEGRAM_BASE_URL = 'https://api.telegram.org/bot'+TELEGRAM_TOKEN;
var debugger_chat_ids = new Set();

var lines = [];

var offset = -1;
console.log("Bot online");
generateOffset();
console.log("Offset found: "+offset);
setInterval(getUpdates, TIMER);

/**
 * update the alerts for users
 */
function update(){

}
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
    //get debuggers
    for (key in results){
        result = results[key];
        console.log(JSON.stringify(result, null, 4));
        /*
        if(result.message.text == '/debug_start'){
            console.log("new debugger joined: "+result.message.from.username);
            debugger_chat_ids.add(result.message.chat.id);
        }
        else if(result.message.text == '/debug_stop'){
            console.log("debugger left: "+result.message.from.username);
            debugger_chat_ids.delete(result.message.chat.id);
        }
        else if(result.message.text == '/help'){
            console.log("sending help to: "+result.message.from.username);
            message(result.message.chat.id, "This bot is currently not functional and will only respond to this command (maybe)");
        }
        */
        if(result.message.text.includes("/addLines")){
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
        }
    }
    for (key in results){
        console.log(key);
        console.log(debugger_chat_ids);
        result = results[key];
        for(debugger_id of debugger_chat_ids.values()){
            console.log("sending debug data to "+debugger_id);
            message(debugger_id, result.message.from.first_name+" "+result.message.from.last_name+": "+result.message.text);
        }
    }
    offset = results[results.length-1].update_id+1;
}

function alert(line, text) {
    console.log("lines: "+JSON.stringify(lines));
    for(id of lines[line]){
        message(id, text);
    }
}

function addLine(user_id, line){
    if(lines[line] == undefined || lines[line] == null){
        lines[line] = [];
    }
    lines[line].push(user_id);
}

function message(chat_id, text){
    https.get(TELEGRAM_BASE_URL+'/sendMessage?chat_id='+chat_id+'&text='+text, function(){}).on('error', function(err){
        console.log("error while sending message: "+err.message);
    });
}