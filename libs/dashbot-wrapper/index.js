'use strict';

const setDashbot = bot => {
	const dashbotApiMap = {
		'facebook': process.env.DASHBOT_API_KEY,
		'webchat': process.env.DASHBOT_API_KEY,
		'skype': process.env.DASHBOT_API_KEY,
		'emulator': process.env.DASHBOT_API_KEY
	};
	const dashbot = require('dashbot')(dashbotApiMap).microsoft;
	dashbot.setFacebookToken(process.env.FACEBOOK_PAGE_TOKEN)

	bot.use(dashbot);
}

module.exports = {
	setDashbot: setDashbot
};

