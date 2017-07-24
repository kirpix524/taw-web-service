'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');

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

module.exports = router;