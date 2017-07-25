'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');

router.post('/getSprNomen', function (req, res, next) {
	let answer = {}
	getSprNomen()
		.then(result => {
			answer.sprNomen = result;
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/saveNomen', function (req, res, next) {
	let config = req.body;
	saveNomen(config)
		.then(result => {
			let answer = {};
			if (config.mode == "new") {
				answer.id_nomen = result.id_nomen;
			}
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

function getSprNomen() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM nomen"
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
					'id_nomen': dataRow.id_nomen,
					'name_nomen': dataRow.name_nomen,
					'id_edizm': dataRow.id_edizm,
					'actual': dataRow.actual
				})
			}
			resolve(dataArray);
		});
	});
}

function saveNomen(config) {
	return new Promise((resolve, reject) => {
		let query = "";
		if (config.mode == "new") {
			query = "INSERT INTO nomen (name_nomen,id_edizm,actual)"
			query=query+" VALUES ('" + config.nomen.name_nomen + "',"
			query=query+" '" + config.nomen.id_edizm + "',"
			query=query+" '" + config.nomen.actual + "');"
		} else {
			query = "UPDATE nomen s SET 	s.name_nomen='" + config.nomen.name_nomen + "',"
			query=query+" 				s.id_edizm='" + config.nomen.id_edizm + "',"
			query=query+" 				s.actual='" + config.nomen.actual + "'"
			query=query+" WHERE s.id_nomen=" + config.nomen.id_nomen + ";"
		}
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (config.mode != "new") { resolve(); return; }
			mysql.query("SELECT LAST_INSERT_ID() `id_nomen`;", function (err, res) {
				if (err) {
					reject(err);
					return;
				}
				if (!("length" in res)) {
					reject("Не удалось получить код новой номенклатуры!");
					return;
				}
				resolve({'id_nomen':res[0].id_nomen});
				return;
			})
		});
	});
}

module.exports = router;