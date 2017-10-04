'use strict';

const request = require('request');

exports.AllLocations = (bot_id, type_location) => {

	let options = {  
		url: process.env.LOC_HOST,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8'
		},
		qs : {
			bot: bot_id,
			type: type_location
		}
	};
	console.log('Options:' + JSON.stringify(options, null, 2));
	return MakeCall(options);
}

exports.NearLocations = (bot_id, type_location, latitude, longitude, distance = 5000) => {

	let options = {  
		url: process.env.LOC_HOST + '/near',
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8'
		},
		qs : {
			bot: bot_id,
			type: type_location,
			latitude: latitude,
			longitude: longitude,
			distance: distance
		}
	};
	console.log(options);
	return MakeCall(options);
}

exports.SearchLocations = (bot_id, type_location, q) => {

	let options = {  
		url: process.env.LOC_HOST + '/search',
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8'
		},
		qs : {
			bot: bot_id,
			type: type_location,
			q: q
		}
	};
	console.log(options);
	return MakeCall(options);
}

let MakeCall = options => {
	return new Promise((resolve, reject) => {
		request(options, function (error, response, body) {
			if (error) {
				return reject(error);
			}
			const data = JSON.parse(body);
			return resolve(data);
		});
	});
}