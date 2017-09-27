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

if (useEmulator)
    botUtils.startLocalServer(connector); 
else
    module.exports = { default: connector.listen() }


