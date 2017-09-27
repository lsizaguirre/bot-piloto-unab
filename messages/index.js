"use strict";

// External packages declaration
var apiairecognizer     = require('api-ai-recognizer'),
    builder             = require("botbuilder"),
    botbuilder_azure    = require("botbuilder-azure"),
    path                = require('path'),
    util                = require('util');

// Internal packages declaration
var middleware          = require('../libs/middleware'),
    poi                 = require('../libs/client_location_service'),
    botUtils            = require('../libs/bot-utils');

// Environment variables load 
require('dotenv').config();

// Define if we are going to use emulator in local environment
const useEmulator = botUtils.getUseEmulator();
const connector = botUtils.buildConnector(useEmulator);

botUtils.buildBot(connector);
//botUtils.startServer(useEmulator, connector);


/*
var bot = new builder.UniversalBot(connector);

bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/Cancelar', [
    function (session) {
        session.endDialog('Cancelado el dialogo');
    }
]).triggerAction({ matches: /^cancelar/i});

var recognizer = new apiairecognizer(process.env['ApiAiToken']); 
var intents = new builder.IntentDialog({ recognizers: [recognizer] } )
.onDefault((session, args) => {
    var name = session.message.user ? session.message.user.name : null;
    session.send(name + ' ' + args.entities[0].entity);
});

bot.dialog('/', intents);    

// Set the Incoming and Outgoing functions for the middleware
bot.use({
    botbuilder: middleware.LogIncomingMessage,
    send: middleware.LogOutgoingMessage
});
*/
// Create the listening

if (useEmulator) {
    botUtils.startLocalServer(connector); 
} else {
    module.exports = { default: connector.listen() }
}


