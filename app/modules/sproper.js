'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');

router.post('/getSprOper', function (req, res, next) {
	let answer = {}
	getSprOper()
		.then(result => {
			answer.sprOper = result;
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/saveOper', function (req, res, next) {
	let config = req.body;
	saveOper(config)
		.then(result => {
			let answer = {};
			if (config.mode == "new") {
				answer.id_oper = result.id_oper;
			}
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

function getSprOper() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM oper"
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
					'id_oper': dataRow.id_oper,
					'name_oper': dataRow.name_oper,
					'need_kk': dataRow.need_kk,
					'actual': dataRow.actual
				})
			}
			resolve(dataArray);
		});
	});
}

function saveOper(config) {
	return new Promise((resolve, reject) => {
		let query = "";
		if (config.mode == "new") {
			query = "INSERT INTO oper (name_oper,need_kk,actual)"
			query=query+" VALUES ('" + config.oper.name_oper + "',"
			query=query+" '" + config.oper.need_kk + "',"
			query=query+" '" + config.oper.actual + "');"
		} else {
			query = "UPDATE oper s SET 	s.name_oper='" + config.oper.name_oper + "',"
			query=query+" 				s.need_kk='" + config.oper.need_kk + "',"
			query=query+" 				s.actual='" + config.oper.actual + "'"
			query=query+" WHERE s.id_oper=" + config.oper.id_oper + ";"
		}
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (config.mode != "new") { resolve(); return; }
			mysql.query("SELECT LAST_INSERT_ID() `id_oper`;", function (err, res) {
				if (err) {
					reject(err);
					return;
				}
				if (!("length" in res)) {
					reject("Не удалось получить код нового склада!");
					return;
				}
				resolve({'id_oper':res[0].id_oper});
				return;
			})
		});
	});
}

module.exports = router;