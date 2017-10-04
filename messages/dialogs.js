'use strict';

const apiairecognizer = require('../libs/api-ai-recognizer'),
    builder = require("botbuilder"),
    clientLocation = require('../libs/client_location_service'),
    locationDialog = require('botbuilder-location'),
    NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: process.env.TTL })

// Debo cambiarlo para que lo consulte en BD o env
const getLocationType = type => {
    switch (type) {
        case 'facultades': return "59c2765a518a97998d3a6d84";
        case 'sedes': return "59c27671518a97998d3a7bad";
        case 'departamentos': return "59cdccd158a4d569e5120997";
        default: return null;
    }
}

const zeroStep = (session, args, next) => {
    var facebookEntities = builder.EntityRecognizer.findAllEntities(args.entities, 'facebook');
    if (facebookEntities.length != 0) {
        facebookEntities.forEach(function (element) {
            switch (element.entity.type) {
                case 0:
                    session.send(element.entity.speech);
                    break;
                case 2:
                    builder.Prompts.choice(session, element.entity.title, element.entity.replies.join('|'));
                    session.endDialog();
                    break;
            }
        });
    }
    else
        next(session, args, secondStep);
}

const firstStep = (session, args, next) => {

            next(session, args);
}

const secondStep = (session, args) => {

    console.log('Intent: ' + args.intent);
    var locationEntity = builder.EntityRecognizer.findEntity(args.entities, 'Locations');
    if (locationEntity)
        session.userData.locationType = getLocationType(locationEntity.entity);

    switch (args.intent) {
        case 'locations-near':
            session.beginDialog('/preguntarLugar');
            break;

        case 'locations-search':
            clientLocation.SearchLocations(process.env.BOT_ID, null, locationEntity.entity)
                .then(function (value) {
                    if (value) {
                        if (!Array.isArray(value))
                            value = [value];
                        var tarjetas = LocationsToHeroCards(value, builder, session);
                        var msj = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(tarjetas);
                        session.send(msj);
                    } else {
                        session.send('No se encontraron registros');
                    }

                },
                function (reason) {
                    console.error('Something went wrong', reason);
                });
            break;

        case 'locations-list':
            clientLocation.AllLocations(process.env.BOT_ID, session.userData.locationType)
                .then(
                function (value) {
                    console.log('Value:' + value);
                    if (value) {
                        if (!Array.isArray(value)) value = [value];
                        if (value.length > 0) {
                            var tarjetas = LocationsToHeroCards(value, builder, session);
                            var msj = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(tarjetas);
                            session.send(msj);
                        } else {
                            session.send(`No se encontraron ${locationEntity.entity}`);
                        }
                    } else {
                        session.send('No se encontraron registros');
                    }

                },
                function (reason) {
                    console.error('Something went wrong', reason);
                }
                );
            break;
        default:
            //var name = session.message.user ? session.message.user.name : null;
            session.send(args.entities[0].entity);
            break;
    }
}
//********************************* */
//var recognizer = new apiairecognizer(process.env['ApiAiToken']);
//var nplIntents = new builder.IntentDialog({ recognizers: [recognizer] })

//nplIntents.onDefault((session, args) => {
//    zeroStep(session, args, firstStep);
//});

const checkDashbot = (session) => {
    const channelId = session.message.address.channelId;
    const userId = session.message.user.id;

    console.log(channelId);console.log(userId);

    if (channelId === 'directline' && userId === 'dashbot-direct-line') {
        sendMessage(session);
        getDefaultIntent();
    } else {
        const cacheData = cache.get(userId) || { paused: false };
        console.log(cacheData);
        if (!cacheData.paused)
            getDefaultIntent();
    }
}
/**/////////*********************************** */
const getDefaultIntent = (session) => {

    var recognizer = new apiairecognizer(process.env['ApiAiToken']);
    return new builder.IntentDialog({ recognizers: [recognizer] })
        .onDefault((session, args) => {
            const channelId = session.message.address.channelId;
            const userId = session.message.user.id;
        
            console.log(channelId);console.log(userId);

            if (channelId === 'directline' && userId === 'dashbot-direct-line') {
                sendMessage(session);
                //getDefaultIntent();
            } else {
                const cacheData = cache.get(userId) || { paused: false };
                console.log(cacheData);
                if (!cacheData.paused)
                    zeroStep(session, args, firstStep);
            }

            //zeroStep(session, args, firstStep);
        })
}

const setDialogs = (bot) => {

    //bot.dialog('/', getDefaultIntent());
    bot.dialog('/', getDefaultIntent());

    bot.dialog('/preguntarLugar', [
        function (session) {
            //console.log(JSON.stringify(session, null, 2))
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
                console.log(JSON.stringify(session.userData.locationType, null, 2));
                clientLocation.NearLocations(process.env.BOT_ID, session.userData.locationType, point.latitude, point.longitude, 50000)
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
    locations.forEach(function (location) {
        var card = new builder.HeroCard(session)
            .title(location.name)
            .subtitle(location.ciudad)
            .text(location.address)
            .images([
                builder.CardImage.create(session, `https://maps.googleapis.com/maps/api/staticmap?center=${location.geo.coordinates[0]},${location.geo.coordinates[1]}&zoom=13&scale=1&size=400x400&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7C${location.geo.coordinates[0]},${location.geo.coordinates[1]}`)
            ])
            .buttons([
                builder.CardAction.openUrl(session, location.url_map, 'Abrir Mapa')
            ]);
        cards.push(card);
    });

    return cards;
}

module.exports = { setDialogs: setDialogs };