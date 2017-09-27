"use strict";

// Packages declaration
const botUtils = require('../libs/bot-utils');

// Environment variables load 
require('dotenv').config();

// Define if we are going to use emulator in local environment
const useEmulator = botUtils.getUseEmulator();
const connector = botUtils.buildConnector(useEmulator);

botUtils.buildBot(connector);
botUtils.startServer(useEmulator, connector);