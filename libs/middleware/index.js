'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      ObjectID = mongoose.Types.ObjectId,
      InMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
      OutMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
      InMessageModel = mongoose.model('in_message', InMessageSchema),
      OutMessageModel = mongoose.model('out_message', OutMessageSchema);

// Mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_CONNECTION_STRING); 

// Function to Incoming Messages
const logIncomingMessage = (session, next) => {
    try {
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

module.exports = { initMiddleware: initMiddleware }