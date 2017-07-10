'use strict'
var express = require('express');
var router = express.Router();
let log = require('../lib/log')(module);
let sf = require('../lib/stringfunctions');
let mysql = require('../services/mysqlClient');
let fs = require('fs');



let arrml = [];

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

router.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

router.get('/', function (req, res, next) {
	let strOut = '<html><head><title>Сервер торговля и склад</title><meta charset="UTF-8"><h1>Сервер торговля и склад</h1></head><body><h1>Сервер торговля и склад</h1></body></html>';
	res.send(strOut);
});

router.get('/report', function (req, res, next) {
	// let path = require('path');
	// res.sendFile(path.resolve("index.html"));
	getReport()
		.then(result => {
			res.send(getHTML(result));
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
		query = query + " ON DUPLICATE KEY UPDATE ost.CurOst=" + ost.curOst + ", ost.NameNom='" + nameNom;
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			resolve('ok');
		});
	});

}

function getReport() {
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
					dataArray.push(dataRow.namenom + ": " + dataRow.curost)
				}
			}
			resolve(dataArray);
		});
	});
}

function getHTML(dataArray) {

	let html = '<html><head><title>Сервер торговля и склад</title><meta charset="UTF-8"><h1>Сервер торговля и склад</h1></head><body>';
	for (let i = 0; i < dataArray.length; i++) {
		html = html + dataArray[i] + '</br>';
	}
	html = html + '</body></html>';
	return html
}

function init() {
	let query = "DELETE from ost";
	mysql.query(query);
	query = "DELETE from movement";
	mysql.query(query);
}

module.exports = router;