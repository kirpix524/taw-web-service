'use strict'
var express = require('express');
var router = express.Router();
let log = require('../lib/log')(module);
let sf = require('../lib/stringfunctions');
let mysql = require('../services/mysqlClient');
let fs = require('fs');
let sprdolgn = require('./modules/sprdolgn');
let sprsotr = require('./modules/sprsotr');
let sprskl = require('./modules/sprskl');
let sproper = require('./modules/sproper');
let spredizm = require('./modules/spredizm');
let sprnomen = require('./modules/sprnomen');
let googledrive = require('./modules/googledrive');

router.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

router.use('/', sprdolgn);
router.use('/', sprsotr);
router.use('/', sprskl);
router.use('/', sproper);
router.use('/', spredizm);
router.use('/', sprnomen);
router.use('/', googledrive);


// С демонстрационного сервера, может пригодиться
// 

let sprNom = {
	'0': "Доска шлифованая 50см",
	'1': "Доска шлифованая 100см",
	'2': "Ручка медная",
	'3': "Профиль алюминиевый 100см",
	'4': "Саморез 40мм (100шт)"
}

let sprAct = {
	'0': "Получение комплектующих со склада",
	'1': "Шлифовка",
	'2': "Распил",
	'3': "Сборка",
	'4': "Передача готового изделия на склад"
}

router.get('/', function (req, res, next) {
	let strOut = '<html><head><title>Сервер торговля и склад</title><meta charset="UTF-8"><h1>Сервер торговля и склад</h1></head><body><h1>Сервер торговля и склад</h1></body></html>';
	res.send(strOut);
});

// router.get('/excel', function (req, res, next) {
// 	// Require library
// 	var excel = require('excel4node');

// 	// Create a new instance of a Workbook class
// 	var workbook = new excel.Workbook();

// 	// Add Worksheets to the workbook
// 	var worksheet = workbook.addWorksheet('Sheet 1');
// 	var worksheet2 = workbook.addWorksheet('Sheet 2');

// 	// Create a reusable style
// 	var style = workbook.createStyle({
// 		font: {
// 			color: '#FF0800',
// 			size: 12
// 		},
// 		numberFormat: '$#,##0.00; ($#,##0.00); -'
// 	});

// 	// Set value of cell A1 to 100 as a number type styled with paramaters of style
// 	worksheet.cell(1, 1).number(100).style(style);

// 	// Set value of cell B1 to 300 as a number type styled with paramaters of style
// 	worksheet.cell(1, 2).number(200).style(style);

// 	// Set value of cell C1 to a formula styled with paramaters of style
// 	worksheet.cell(1, 3).formula('A1 + B1').style(style);

// 	// Set value of cell A2 to 'string' styled with paramaters of style
// 	worksheet.cell(2, 1).string('string').style(style);

// 	// Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
// 	worksheet.cell(3, 1).bool(true).style(style).style({ font: { size: 14 } });

// 	workbook.write('Excel.xlsx');

// 	res.status(202).send('ok');
// })

router.post('/addMove', function (req, res, next) {
	console.log('/addMove');
	console.dir(req.body.req);
	let config = JSON.parse(req.body.req);
	addMove(config)
		.then(result => {
			res.status(202).send(JSON.stringify(result));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.get('/report', function (req, res, next) {
	// let path = require('path');
	// res.sendFile(path.resolve("index.html"));
	getOst()
		.then(arrOst => {
			getMoves()
				.then(arrMoves => {
					res.send(getHTML(arrOst, arrMoves));
				}, (err) => {
					res.status(500).send(err);
				})

		}, (err) => {
			res.status(500).send(err);
		})
});


router.post('/getLogs', function (req, res, next) {
	getLogs(req)
		.then(result => {
			res.status(202).send(JSON.stringify(result));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/addOst', function (req, res, next) {
	console.log('/addOst');
	console.dir(req.body.req);
	let config = JSON.parse(req.body.req);
	addOst(config)
		.then(result => {
			res.status(202).send(JSON.stringify(result));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/init', function (req, res, next) {
	console.log('/init');
	init();
	res.status(202).send('ok');
});

async function getLogs(req) {
	try {
		let dateFrom = new Date(req.body.yearFrom, req.body.monthFrom, req.body.dayFrom);
		let dateTo = new Date(req.body.yearTo, req.body.monthTo, req.body.dayTo);
		let timeFrom = req.body.timeFrom || "00:00:00";
		let timeTo = req.body.timeTo || "00:00:00";
		let daysBetween = sf.daysBetween(dateFrom, dateTo);
		let logs = [];
		for (let days = 0; days <= daysBetween; days++) {
			let date = new Date(dateFrom);
			date.setDate(date.getDate() + days);
			let fileName = __dirname + "/../log/" + sf.formatDate(date, 'yyyy-mm-dd') + ".log";
			let pars = {
				'dateTimeFrom': null,
				'dateTimeTo': null,
				'dateLog': date,
				'errOnly': req.body.errOnly,
				'kobor': req.body.kobor
			}
			if (days == 0) {
				pars.dateTimeFrom = dateFrom;
				pars.dateTimeFrom.setHours(sf.CNumber(sf.piece(timeFrom, ":", 1)), sf.CNumber(sf.piece(timeFrom, ":", 2)), sf.CNumber(sf.piece(timeFrom, ":", 3)));
				pars.dateTimeTo = dateTo;
				pars.dateTimeTo.setHours(23, 59, 59);
			}
			if (days == daysBetween) {
				if (days != 0) {
					pars.dateTimeFrom = dateFrom;
					pars.dateTimeTo = dateTo;
				}
				pars.dateTimeTo.setHours(sf.CNumber(sf.piece(timeTo, ":", 1)), sf.CNumber(sf.piece(timeTo, ":", 2)), sf.CNumber(sf.piece(timeTo, ":", 3)));
			}
			logs = await readLogsFromFile(fileName, pars, logs)
		}
		return logs;
	} catch (err) {
		log.error(err);
		srvf.claim(err);
	}
};

function readLogsFromFile(fileName, pars, logs) {
	return new Promise((resolve, reject) => {
		let strDateLog = sf.formatDate(pars.dateLog);
		fs.access(fileName, fs.constants.R_OK, (err) => {
			if (err) {
				resolve(logs);
				return
			}
			fs.readFile(fileName, function (err, contents) {
				if (err) {
					reject(err);
					return
				}
				if (typeof contents == "undefined") {
					resolve(logs);
					return
				}
				let logLines = contents.toString().split("\n");
				for (let line = 0; line < logLines.length; line++) {
					if (logLines[line] != "") {
						let obj = JSON.parse(logLines[line])
						obj.date = strDateLog;
						if (((pars.errOnly == 'errOnly') && (obj.level != 'error')) || ((pars.errOnly == 'infoOnly') && (obj.level != 'info'))) {
							continue
						}
						if ((pars.kobor != '') && (obj.kobor != pars.kobor)) {
							continue
						}
						if (obj.timestamp != '') {
							if ((pars.dateTimeFrom != null) && (pars.dateTimeTo != null) && (pars.dateLog != null)) {
								let dateTimeLog = new Date(pars.dateLog);
								dateTimeLog.setHours(sf.CNumber(sf.piece(obj.timestamp, ":", 1)), sf.CNumber(sf.piece(obj.timestamp, ":", 2)), sf.CNumber(sf.piece(obj.timestamp, ":", 3)));
								if (((+dateTimeLog) > (+pars.dateTimeFrom)) && ((+dateTimeLog) < (+pars.dateTimeTo))) {
									logs.push(obj);
								}
							} else {
								logs.push(obj);
							}

						}

					}
				}
				resolve(logs);
			});
		});

	})
}

function addMove(move) {
	return new Promise((resolve, reject) => {
		let movement = "";
		switch (move.typeMove) {
			case "com":
				movement = "Для номенклатуры " + sprNom[move.codeNom] + " выполнен приход " + move.quant;
				break
			case "exp":
				movement = "Для номенклатуры " + sprNom[move.codeNom] + " выполнен расход " + move.quant;
				break
			case "start":
				movement = "Начато выполнение действия " + sprAct[move.codeAct];
				break
			case "end":
				movement = "Завершено выполнение действия " + sprAct[move.codeAct];
				break
			default:
				reject("unknown typeMove");
				return
		}
		let query = "INSERT INTO movement SET movement.DtTm = CURRENT_TIMESTAMP, movement.Movement='" + movement + "'";
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			resolve('ok');
		});
	});

}

function addOst(ost) {
	return new Promise((resolve, reject) => {
		let nameNom = sprNom[ost.codeNom];
		let query = "INSERT INTO ost SET ost.NameNom='" + nameNom + "', ost.CodeNom='" + ost.codeNom + "', ost.CurOst=" + ost.curOst + " ";
		query = query + " ON DUPLICATE KEY UPDATE ost.CurOst=" + ost.curOst + ", ost.NameNom='" + nameNom + "'";
		console.log(query);
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			resolve('ok');
		});
	});

}

function getOst() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM ost"
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (!("length" in res)) {
				resolve([]);
				return
			}
			let dataArray = [];
			for (let i = 0; i < res.length; i++) {
				let dataRow = res[i];
				if (dataRow.curost > 0) {
					dataArray.push({ 'namenom': dataRow.namenom, 'curost': dataRow.curost })
				}
			}
			resolve(dataArray);
		});
	});
}

function getMoves() {
	return new Promise((resolve, reject) => {
		let query = "select DATE_FORMAT(CONVERT_TZ(movement.DtTm,'SYSTEM','+04:00'),'%d.%m.%Y %k:%i:%s') as `DtTm`,movement.Movement from movement"
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (!("length" in res)) {
				resolve([]);
				return
			}
			let dataArray = [];
			for (let i = 0; i < res.length; i++) {
				let dataRow = res[i];
				dataArray.push({ 'DtTm': dataRow.DtTm, 'Movement': dataRow.Movement })
			}
			resolve(dataArray);
		});
	});
}

function getHTML(ostArray, movesArray) {
	let html = "<html><head><title>Сервер торговля и склад</title><meta charset='UTF-8'><h1>Сервер торговля и склад</h1></head><body>";
	html = html + '<h1>Текущие остатки</h1>';
	html = html + '<table border="1" cellspacing="2" cellpadding="5" style="max-width:700px; font-size:2em">';
	for (let i = 0; i < ostArray.length; i++) {
		html = html + '<tr>';
		html = html + ' <td width=80%>' + ostArray[i].namenom + '</td>';
		html = html + ' <td width=20%>' + ostArray[i].curost + '</td>';
		html = html + '</tr>';
	}
	html = html + '</table>';
	html = html + '<table border="1" cellspacing="2" cellpadding="5" style="max-width:700px; font-size:2em">';
	html = html + '<h1>Моменты фиксации</h1>';
	for (let i = 0; i < movesArray.length; i++) {
		html = html + '<tr>';
		html = html + ' <td width=30%>' + movesArray[i].DtTm + '</td>';
		html = html + ' <td width=70%>' + movesArray[i].Movement + '</td>';
		html = html + '</tr>';
	}
	html = html + '</table>';
	html = html + '</body></html>';
	return html
}



function init() {
	let query = "DELETE from ost";
	mysql.query(query);
	query = "DELETE from movement";
	mysql.query(query);
}

setInterval(function () {
	mysql.query('SELECT 1');
}, 60000);

//пробуем гугл апи
// var readline = require('readline');
// var google = require('googleapis');
// var googleAuth = require('google-auth-library');

// // If modifying these scopes, delete your previously saved credentials
// // at ~/.credentials/drive-nodejs-quickstart.json
// var SCOPES = [
// 	'https://www.googleapis.com/auth/drive.metadata.readonly',
// 	'https://www.googleapis.com/auth/drive',
// 	'https://www.googleapis.com/auth/drive.file'
// ];
// var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
// 	process.env.USERPROFILE) + '/.credentials/';
// console.log("TOKEN_DIR:", TOKEN_DIR);
// var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';

// // Load client secrets from a local file.
// fs.readFile('client_secret.json', function processClientSecrets(err, content) {
// 	if (err) {
// 		console.log('Error loading client secret file: ' + err);
// 		return;
// 	}
// 	// Authorize a client with the loaded credentials, then call the
// 	// Drive API.
// 	authorize(JSON.parse(content), listFiles);
// });

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  *
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, callback) {
// 	var clientSecret = credentials.installed.client_secret;
// 	var clientId = credentials.installed.client_id;
// 	var redirectUrl = credentials.installed.redirect_uris[0];
// 	var auth = new googleAuth();
// 	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

// 	// Check if we have previously stored a token.
// 	fs.readFile(TOKEN_PATH, function (err, token) {
// 		if (err) {
// 			getNewToken(oauth2Client, callback);
// 		} else {
// 			oauth2Client.credentials = JSON.parse(token);
// 			callback(oauth2Client);
// 		}
// 	});
// }

// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  *
//  * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback to call with the authorized
//  *     client.
//  */
// function getNewToken(oauth2Client, callback) {
// 	var authUrl = oauth2Client.generateAuthUrl({
// 		access_type: 'offline',
// 		scope: SCOPES
// 	});
// 	console.log('Authorize this app by visiting this url: ', authUrl);
// 	var rl = readline.createInterface({
// 		input: process.stdin,
// 		output: process.stdout
// 	});
// 	rl.question('Enter the code from that page here: ', function (code) {
// 		rl.close();
// 		oauth2Client.getToken(code, function (err, token) {
// 			if (err) {
// 				console.log('Error while trying to retrieve access token', err);
// 				return;
// 			}
// 			oauth2Client.credentials = token;
// 			storeToken(token);
// 			callback(oauth2Client);
// 		});
// 	});
// }

// /**
//  * Store token to disk be used in later program executions.
//  *
//  * @param {Object} token The token to store to disk.
//  */
// function storeToken(token) {
// 	try {
// 		fs.mkdirSync(TOKEN_DIR);
// 	} catch (err) {
// 		if (err.code != 'EEXIST') {
// 			throw err;
// 		}
// 	}
// 	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
// 	console.log('Token stored to ' + TOKEN_PATH);
// }

// /**
//  * Lists the names and IDs of up to 10 files.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function listFiles(auth) {
// 	var service = google.drive('v3');
// 	service.files.list({
// 		auth: auth,
// 		pageSize: 20,
// 		fields: "nextPageToken, files(id, name)"
// 	}, function (err, response) {
// 		if (err) {
// 			console.log('The API returned an error: ' + err);
// 			return;
// 		}
// 		var files = response.files;
// 		if (files.length == 0) {
// 			console.log('No files found.');
// 		} else {
// 			console.log('Files:');
// 			for (var i = 0; i < files.length; i++) {
// 				var file = files[i];
// 				console.log('%s (%s)', file.name, file.id);
// 			}
// 		}
// 	});
// 	var fileMetadata = {
// 		'name': 'My Report',
// 		'mimeType': 'application/vnd.google-apps.spreadsheet'
// 	};
// 	var media = {
// 		mimeType: 'text/csv',
// 		body: fs.createReadStream('/home/surovcevnv/common/git/taw-web-service/app/files/report.csv')
// 	};
// 	service.files.create({
// 		auth: auth,
// 		resource: fileMetadata,
// 		media: media,
// 		fields: 'id'
// 	}, function (err, file) {
// 		if (err) {
// 			// Handle error
// 			console.log(err);
// 		} else {
// 			console.log('File Id:', file.id);
// 		}
// 	});
// }

module.exports = router;