const https = require('https');
const TIMER = 1000;
const TELEGRAM_TOKEN = require('./config/config').telegram_token;
const TELEGRAM_BASE_URL = 'https://api.telegram.org/bot'+TELEGRAM_TOKEN;
var debugger_chat_ids = new Set();

var offset = -1;
console.log("Bot online");
do{
    offset = generateOffset();
    setTimeout(function(){},1000);
}while(offset<0);
console.log("Offset found");
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
    https.get(TELEGRAM_BASE_URL+'/getUpdates?offset='+offset, function(response) {

        data = '';

        response.on('data',function(chunk){
            data += chunk;
        });

        response.on('end', function(){
            result = JSON.parse(data).result;
            if(result == null || result.length == 0)return -1;
            return result[result.length-1].update_id+1;
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
        else{
            message(result.message.chat.id, "I'm just ignoring your random jibberish "+result.message.from.first_name);
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

function message(chat_id, text){
    https.get(TELEGRAM_BASE_URL+'/sendMessage?chat_id='+chat_id+'&text='+text, function(){}).on('error', function(err){
        console.log("error while sending message: "+err.message);
    });
}