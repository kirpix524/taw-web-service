'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');

router.post('/getSprEdizm', function (req, res, next) {
	let answer = {}
	getSprEdizm()
		.then(result => {
			answer.sprEdizm = result;
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/saveEdizm', function (req, res, next) {
	let config = req.body;
	saveEdizm(config)
		.then(result => {
			let answer = {};
			if (config.mode == "new") {
				answer.id_edizm = result.id_edizm;
			}
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

function getSprEdizm() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM edizm"
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
					'id_edizm': dataRow.id_edizm,
					'name_edizm': dataRow.name_edizm,
					'actual': dataRow.actual
				})
			}
			resolve(dataArray);
		});
	});
}

function saveEdizm(config) {
	return new Promise((resolve, reject) => {
		let query = "";
		if (config.mode == "new") {
			query = "INSERT INTO edizm (name_edizm,actual)"
			query=query+" VALUES ('" + config.edizm.name_edizm + "',"
			query=query+" '" + config.edizm.actual + "');"
		} else {
			query = "UPDATE edizm s SET 	s.name_edizm='" + config.edizm.name_edizm + "',"
			query=query+" 				s.actual='" + config.edizm.actual + "'"
			query=query+" WHERE s.id_edizm=" + config.edizm.id_edizm + ";"
		}
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (config.mode != "new") { resolve(); return; }
			mysql.query("SELECT LAST_INSERT_ID() `id_edizm`;", function (err, res) {
				if (err) {
					reject(err);
					return;
				}
				if (!("length" in res)) {
					reject("Не удалось получить код новой еденицы измерения!");
					return;
				}
				resolve({'id_edizm':res[0].id_edizm});
				return;
			})
		});
	});
}

module.exports = router;