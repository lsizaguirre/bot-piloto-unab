'use strict';

const apiairecognizer     = require('../libs/api-ai-recognizer'),
      builder             = require("botbuilder"),
      clientLocation      = require('../libs/client_location_service'),
      locationDialog      = require('botbuilder-location'),
      NodeCache           = require('node-cache');

const cache = new NodeCache({ stdTTL: process.env.TTL })

const zeroStep = (session, args, next) => {
    var facebookEntities = builder.EntityRecognizer.findAllEntities(args.entities, 'facebook');
    if (facebookEntities.length != 0) {
        facebookEntities.forEach(function(element) {
            switch (element.entity.type) {
                case 0:
                    session.send(element.entity.speech);
                    break;
                case 2:
                    builder.Prompts.choice(session, element.entity.title, element.entity.replies.join('|'));
                    break;
            }
        });
    }
    else
        next(session, args, secondStep);
}

const firstStep = (session, args, next) => {

    const channelId = session.message.address.channelId;
    const userId = session.message.user.id;

    if (channelId === 'directline' && userId === 'dashbot-direct-line') {
        sendMessage(session);
        next();
    } else {
        const cacheData = cache.get(userId) || { paused: false };
        console.log(cacheData);
        if (!cacheData.paused)
            next(session, args);
    }
}

const secondStep = (session, args) => {
    switch (args.intent) {
        case 'poi-near':
            session.endDialog();
            var locationEntity = builder.EntityRecognizer.findEntity(args.entities, 'location');
            if(locationEntity) {
                clientLocation.SearchLocations(process.env.BOT_ID, null, locationEntity.entity)
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
            } else {
                session.beginDialog('/preguntarLugar');
            }
            break;
        default:
            //var name = session.message.user ? session.message.user.name : null;
            session.send(args.entities[0].entity);
            break;
    }
}

const getDefaultIntent = () => {
    var recognizer = new apiairecognizer(process.env['ApiAiToken']); 
    return new builder.IntentDialog({ recognizers: [recognizer] } )
    .onDefault((session, args) => {
        zeroStep(session, args, firstStep);
    })
}

const setDialogs = (bot) => {

    bot.dialog('/', getDefaultIntent());

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

var sendMessage = (session) => {
    const msg = JSON.parse(session.message.text);
    const cacheData = cache.get(msg.userId) || { paused: false, name: undefined, address: undefined };

    const lastState = cacheData.paused;
    cacheData.paused = msg.paused;
    module.exports.cache.set(msg.userId, cacheData);

    let errorMsg = undefined;
    const name = cacheData.name ? ` ${cacheData.name}` : '';
    const text = getText(msg, name);

    if (cacheData.address) {
        if (!lastState && msg.paused && msg.text) {
            const txt = `Hola${name}, a partir de este momento hablarás con una persona.`;
            session.library.send(
                new builder.Message().text(txt).address(cacheData.address),
                () => session.library.send(new builder.Message().text(text).address(cacheData.address)));
        } else {
            session.library.send(new builder.Message().text(text).address(cacheData.address));
        }
    } else {
        const topic = msg.text ? `el mensaje ${msg.text}` : `la desactivación/activación del bot`;
        errorMsg = `Error: No se pudo enviar "${topic}" ` +
            `al cliente "${msg.userId}" porque la dirección del mismo no aparece en la cache.`;
        console.error(errorMsg);
    }

    session.send(errorMsg || (msg.text ? 'Mensaje enviado.' : 'Detención/Activación del bot.'));
}

const getText = (msg, name) => msg.text || (msg.paused ?
    `Hola${name}, a partir de este momento hablarás con una persona.` :
    `Hola${name}, a partir de este momento hablarás con la plataforma.`);

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