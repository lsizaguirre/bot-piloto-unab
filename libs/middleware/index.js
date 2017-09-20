'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    OutMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
    OutMessageModel = mongoose.model('out_message', OutMessageSchema),
    InMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
    InMessageModel = mongoose.model('in_message', InMessageSchema),
    ObjectID = mongoose.Types.ObjectId;

// Environment variables load 
require('dotenv').config();

// Mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_CONNECTION_STRING); 

// Function to Incoming Messages
exports.LogIncomingMessage = (session, next) => {
    try {
        session.message.bot_id = new ObjectID(process.env.BOT_ID);
        new InMessageModel(session.message).save();
        next();
    } catch (error) {
        console.log(error)
    }
}

// Function to Outgoing Messages
exports.LogOutgoingMessage = (event, next) => {
    try {
        event.bot_id = new ObjectID(process.env.BOT_ID);
        new OutMessageModel(event).save();
        next();
    } catch (error) {
        console.log(error)
    }
}