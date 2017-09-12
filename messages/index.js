/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var apiairecognizer = require('api-ai-recognizer'); 
var path = require('path');
var client_location = require('../libraries/bot_client_location')

require('dotenv').config();

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/Cancelar', [
    function (session) {
        session.endDialog('Cancelado el dialogo');
    }
]).triggerAction({ matches: /^cancelar/i});

var recognizer = new apiairecognizer(process.env['ApiAiToken']); 
var intents = new builder.IntentDialog({ recognizers: [recognizer] } )

// Main dialog with API.AI
.onDefault((session, args) => {
    //session.send('Sorry, I did not understand \'%s\'.', session.message.text);
    var name = session.message.user ? session.message.user.name : null;
    //const util = require('util');
    //console.log('Session:' + util.inspect(session));
    //console.log('Args:' + util.inspect(args));
    session.send(name + ', ' + args.entities[0].entity);
});

bot.dialog('/', intents);    

bot.use({
    botbuilder: function (session, next) {
        logMensajeEntrante(session, next);
        next();
    },
    send: function(event, next) {
        logMensajeSaliente(event, next);
        next();
    }
});

function logMensajeEntrante(session, next) {
    console.log(session.message.text);
}

function logMensajeSaliente(event, next) {
    console.log(event.text);
}

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpoint at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

