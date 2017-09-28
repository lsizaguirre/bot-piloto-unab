"use strict";

// Environment variables load
require('dotenv').config();

// External packages declaration
const builder          = require("botbuilder"),
	  botbuilder_azure = require("botbuilder-azure"),
	  path             = require('path'),
	  util             = require('util');
	  //quickReplies = require('botbuilder-quickreplies');

// Internal packages declaration
const middleware       = require('../libs/middleware'),
	  poi              = require('../libs/client_location_service'),
	  botUtils         = require('../libs/bot-utils'),
	  dashbotWrapper   = require('../libs/dashbot-wrapper');

// Define if we are going to use emulator in local environment
const useEmulator     = botUtils.getUseEmulator(),
	  connector       = botUtils.buildConnector(useEmulator),
	  bot             = botUtils.buildBot(connector);

dashbotWrapper.setDashbot(bot);
//bot.use(quickReplies.QuickRepliesMiddleware);

if (useEmulator)
	botUtils.startLocalServer(connector);
else
	module.exports = { default: connector.listen() }