"use strict";

// External packages declaration
var apiairecognizer     = require('api-ai-recognizer'),
    builder             = require("botbuilder"),
    botbuilder_azure    = require("botbuilder-azure"),
    path                = require('path'),
    util                = require('util'),
    locationDialog      = require('botbuilder-location');

// Internal packages declaration
var middleware          = require('../libs/middleware'),
    poi                 = require('../libs/client_location_service');

// Environment variables load 
require('dotenv').config();

// Define if we are going to use emulator in local environment
var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.localePath(path.join(__dirname, './locale'));

bot.library(locationDialog.createLibrary(process.env.BING_MAPS_API_KEY));

bot.dialog('/Cancelar', [
    function (session) {
        session.endDialog('Cancelado el dialogo');
    }
]).triggerAction({ matches: /^cancelar/i});

var recognizer = new apiairecognizer(process.env['ApiAiToken']); 
var intents = new builder.IntentDialog({ recognizers: [recognizer] } )
.onDefault((session, args) => {
    //console.log(JSON.stringify(args, null, 2));
    switch (args.intent) {
        case 'poi-near':
            session.beginDialog('/preguntarLugar');
            break;
        default:
            var name = session.message.user ? session.message.user.name : null;
            session.send(name + ' ' + args.entities[0].entity);
            break;
    }
});

bot.dialog('/', intents);  

bot.dialog('/preguntarLugar', [
    function(session) {
        var options = {
            prompt: "Enviame tu ubicación pra consultar por la localidad más cercana a ti.",
            useNativeControl: true
        };
        locationDialog.getLocation(session, options);
    },
    function (session, results) {
        if (results.response) {
            var place = results.response;
            //session.send(place.streetAddress + ", " + place.locality + ", " + place.region + ", " + place.country + " (" + place.postalCode + ")");
            console.log(JSON.stringify(results.response, null, 2));
            session.endDialog();
        }
        else {
            session.send("Lo siento, no pude determinar tu ubicación.");
            session.endDialog();
        }
    }
])

// Set the Incoming and Outgoing functions for the middleware
bot.use({
    botbuilder: middleware.LogIncomingMessage,
    send: middleware.LogOutgoingMessage
});

// Create the listening
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

