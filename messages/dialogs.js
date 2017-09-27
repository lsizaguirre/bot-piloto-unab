'use strict';

const apiairecognizer     = require('api-ai-recognizer'),
      builder             = require("botbuilder"),
      clientLocation      = require('../libs/client_location_service'),
      locationDialog      = require('botbuilder-location');

// Environment variables load 
require('dotenv').config();

const setDialogs = (bot) => {

    var recognizer = new apiairecognizer(process.env['ApiAiToken']); 

    bot.dialog('/', new builder.IntentDialog({ recognizers: [recognizer] } )
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
        })
    );

    bot.dialog('/preguntarLugar', [
        function(session) {
            var options = {
                prompt: "Necesito tu ubicación para mostrarte las localidades más cercanas a ti.",
                useNativeControl: true,
                skipFavorites: true,
                skipConfirmationAsk: true
            };
            locationDialog.getLocation(session, options);
        },
        function (session, results) {
            if (results.response) {
                var point = results.response.geo;
                //session.send(place.streetAddress + ", " + place.locality + ", " + place.region + ", " + place.country + " (" + place.postalCode + ")");
                console.log(JSON.stringify(point, null, 2));
                clientLocation.NearLocations(process.env.BOT_ID, null, point.latitude, point.longitude, 50000)
                .then(
                    function (value) {
                        var tarjetas = LocationsToHeroCards(value, builder, session);
                        var msj = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(tarjetas);
                        session.send(msj);
                    },
                    function (reason) {
                        console.error('Something went wrong', reason);
                    }
                );
                session.endDialog();
            }
            else {
                session.send("Lo siento, no pude determinar tu ubicación.");
                session.endDialog();
            }
        }
    ]);
}

var LocationsToHeroCards = (locations, builder, session) => {
	var cards = [];
	locations.forEach(function(location) {
		var card = new builder.HeroCard(session)
		.title(location.name)
		.subtitle(location.ciudad)
		.text(location.address)
		.images([
			builder.CardImage.create(session, `https://maps.googleapis.com/maps/api/staticmap?center=${location.geo.coordinates[0]},${location.geo.coordinates[1]}&zoom=13&scale=1&size=400x400&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7C${location.geo.coordinates[0]},${location.geo.coordinates[1]}`)
		])
		.buttons([
			builder.CardAction.openUrl(session, `https://www.google.cl/maps/@${location.geo.coordinates[0]},${location.geo.coordinates[1]},15z`, 'Abrir Mapa')
		]);
		cards.push(card);
	});

	return cards;
}

module.exports = { setDialogs: setDialogs };