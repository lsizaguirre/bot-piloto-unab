/*
TO DO:
- Validar que ocurre cuando process.env.LOC_HOST es undefined
 */
'use strict';

const request = require('request');

exports.AllLocations = botid => {

	let options = {  
		url: process.env.LOC_HOST,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8'
		},
		qs : {
			botid: botid
		}
	};
	return MakeCall(options);
}

exports.NearLocations = (botid, longitude, latitude, distance = 5000) => {

	let options = {  
		url: process.env.LOC_HOST + '/near',
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8'
		},
		qs : {
			botid: botid,
			longitude: longitude,
			latitude: latitude,
			distance: distance
		}
	};
	return MakeCall(options);
}

exports.SearchLocations = (botid, q) => {

	let options = {  
		url: process.env.LOC_HOST + '/search',
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8'
		},
		qs : {
			botid: botid,
			q: q
		}
	};
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