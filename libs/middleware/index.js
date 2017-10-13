'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      ObjectID = mongoose.Types.ObjectId,
      ApiAiResponseSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
      InMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
      OutMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
      ApiAiResponseModel = mongoose.model('apiai_response', ApiAiResponseSchema),
      InMessageModel = mongoose.model('in_message', InMessageSchema),
      OutMessageModel = mongoose.model('out_message', OutMessageSchema),
      NodeCache = require('node-cache');
      
      const cache = new NodeCache({ stdTTL: process.env.TTL });
      

// Mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_CONNECTION_STRING); 

const getName = message => message.user.name.split(" ", 1)[0];
// Function to Incoming Messages
const logIncomingMessage = (session, next) => {
    try {
        //Set cache address
        const userId = session.message.user.id;
        const cacheData = cache.get(userId) || { paused: false, name: undefined, address: undefined };
        cache.set(userId, {
            paused: cacheData.paused,
            name: getName(session.message),
            address: session.message.address
        });

        console.log('Cache 1: ' + cache.get(userId));

        // Save in mongodb store
        session.message.bot_id = new ObjectID(process.env.BOT_ID);
        new InMessageModel(session.message).save();
        next();
    } catch (error) {
        console.log(error)
    }
}

// Function to Outgoing Messages
const logOutgoingMessage = (event, next) => {
    try {
        event.bot_id = new ObjectID(process.env.BOT_ID);
        new OutMessageModel(event).save();
        next();
    } catch (error) {
        console.log(error)
    }
}

const initMiddleware = (bot) => {
    // Set the Incoming and Outgoing functions for the middleware
    bot.use({
        botbuilder: logIncomingMessage,
        send: logOutgoingMessage
    });

    
}

const saveApiAiResponse = (response, address) => {
    try {
        console.log('Guardando...');
        response.address = address;
        new ApiAiResponseModel(response).save();
    } catch (error) {
        console.log(error)
    }
}

module.exports = { initMiddleware: initMiddleware, saveApiAiResponse: saveApiAiResponse, cache: cache }