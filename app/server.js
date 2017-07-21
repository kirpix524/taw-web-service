'use strict'
var express = require('express');
var router = express.Router();
let log = require('../lib/log')(module);
let sf = require('../lib/stringfunctions');
let mysql = require('../services/mysqlClient');
let fs = require('fs');

router.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

router.post('/getSprDolgn', function (req, res, next) {
	let answer = {}
	getSprDolgn()
		.then(result => {
			answer.sprDolgn = result;
			getSprRoles().then(result => {
				answer.sprRoles = result;
				res.status(202).send(JSON.stringify(answer));
			}, (err) => {
				log.error(err);
				res.status(500).send(err);
			})
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/saveDolgn', function (req, res, next) {
	let config = req.body;
	saveDolgn(config)
		.then(result => {
			let answer = {};
			if (config.mode == "new") {
				answer.id_dolgn = result.id_dolgn;
			}
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

function getSprDolgn() {
	return new Promise((resolve, reject) => {
		let query = "SELECT d.*,r.name_role  FROM dolgn d LEFT JOIN roles r ON d.id_role=r.id_role"
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
				dataArray.push({
					'id_dolgn': dataRow.id_dolgn,
					'name_dolgn': dataRow.name_dolgn,
					'id_role': dataRow.id_role,
					'name_role': dataRow.name_role,
					'actual': dataRow.actual
				})
			}
			resolve(dataArray);
		});
	});
}

function getSprRoles() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM roles"
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
				dataArray.push({
					'id_role': dataRow.id_role,
					'name_role': dataRow.name_role,
				})
			}
			resolve(dataArray);
		});
	});
}

function saveDolgn(config) {
	return new Promise((resolve, reject) => {
		let query = "";
		if (config.mode == "new") {
			query = "INSERT INTO dolgn (name_dolgn,id_role,actual) VALUES ('" + config.dolgn.name_dolgn + "', " + config.dolgn.id_role + ", '" + config.dolgn.actual + "');"
		} else {
			query = "UPDATE dolgn d SET d.name_dolgn='" + config.dolgn.name_dolgn + "',d.id_role=" + config.dolgn.id_role + ",d.actual='" + config.dolgn.actual + "' WHERE d.id_dolgn=" + config.dolgn.id_dolgn + ";"
		}
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (config.mode != "new") { resolve(); return; }
			mysql.query("SELECT LAST_INSERT_ID() `id_dolgn`;", function (err, res) {
				if (err) {
					reject(err);
					return;
				}
				if (!("length" in res)) {
					reject("Не удалось получить код новой должности!");
					return;
				}
				resolve({'id_dolgn':res[0].id_dolgn});
				return;
			})
		});
	});
}

router.post('/getSprSotr', function (req, res, next) {
	let answer = {}
	getSprSotr()
		.then(result => {
			answer.sprSotr = result;
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/saveSotr', function (req, res, next) {
	let config = req.body;
	saveSotr(config)
		.then(result => {
			let answer = {};
			if (config.mode == "new") {
				answer.id_sotr = result.id_sotr;
			}
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

function getSprSotr() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM sotr"
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
				dataArray.push({
					'id_sotr': dataRow.id_sotr,
					'name_sotr': dataRow.name_sotr,
					'birth': sf.formatDate(dataRow.birth,"dd.mm.yyyy"),
					'phone': dataRow.phone,
					'id_dolgn': dataRow.id_dolgn,
					'status': dataRow.status
				})
			}
			resolve(dataArray);
		});
	});
}

function saveSotr(config) {
	return new Promise((resolve, reject) => {
		console.dir(config);
		let query = "";
		if (config.mode == "new") {
			query = "INSERT INTO sotr (name_sotr,birth,phone,status,id_dolgn)"
			query=query+" VALUES ('" + config.sotr.name_sotr + "',"
			query=query+" '" + config.sotr.birth + "',"
			query=query+" '" + config.sotr.phone + "',"
			query=query+" '" + config.sotr.status + "',"
			query=query+" " + config.sotr.id_dolgn + ");"
		} else {
			query = "UPDATE sotr s SET 	s.name_sotr='" + config.sotr.name_sotr + "',"
			query=query+" 				s.birth='" + sf.formatDate(config.sotr.birth,"yyyy-mm-dd") + "',"
			query=query+" 				s.phone='" + config.sotr.phone + "',"
			query=query+" 				s.status='" + config.sotr.status + "',"
			query=query+" 				s.id_dolgn=" + config.sotr.id_dolgn
			query=query+" WHERE s.id_sotr=" + config.sotr.id_sotr + ";"
		}
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (config.mode != "new") { resolve(); return; }
			mysql.query("SELECT LAST_INSERT_ID() `id_sotr`;", function (err, res) {
				if (err) {
					reject(err);
					return;
				}
				if (!("length" in res)) {
					reject("Не удалось получить код нового сотрудника!");
					return;
				}
				resolve({'id_sotr':res[0].id_sotr});
				return;
			})
		});
	});
}

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

router.get('/excel', function (req, res, next) {
	// Require library
	var excel = require('excel4node');

	// Create a new instance of a Workbook class
	var workbook = new excel.Workbook();

	// Add Worksheets to the workbook
	var worksheet = workbook.addWorksheet('Sheet 1');
	var worksheet2 = workbook.addWorksheet('Sheet 2');

	// Create a reusable style
	var style = workbook.createStyle({
		font: {
			color: '#FF0800',
			size: 12
		},
		numberFormat: '$#,##0.00; ($#,##0.00); -'
	});

	// Set value of cell A1 to 100 as a number type styled with paramaters of style
	worksheet.cell(1, 1).number(100).style(style);

	// Set value of cell B1 to 300 as a number type styled with paramaters of style
	worksheet.cell(1, 2).number(200).style(style);

	// Set value of cell C1 to a formula styled with paramaters of style
	worksheet.cell(1, 3).formula('A1 + B1').style(style);

	// Set value of cell A2 to 'string' styled with paramaters of style
	worksheet.cell(2, 1).string('string').style(style);

	// Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
	worksheet.cell(3, 1).bool(true).style(style).style({ font: { size: 14 } });

	workbook.write('Excel.xlsx');

	res.status(202).send('ok');
})

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

module.exports = router;