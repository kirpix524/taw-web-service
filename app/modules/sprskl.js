'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');

router.post('/getSprSkl', function (req, res, next) {
	let answer = {}
	getSprSkl()
		.then(result => {
			answer.sprSkl = result;
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

router.post('/saveSkl', function (req, res, next) {
	let config = req.body;
	saveSkl(config)
		.then(result => {
			let answer = {};
			if (config.mode == "new") {
				answer.id_skl = result.id_skl;
			}
			res.status(202).send(JSON.stringify(answer));
		}, (err) => {
			log.error(err);
			res.status(500).send(err);
		});
});

function getSprSkl() {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM skl"
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
					'id_skl': dataRow.id_skl,
					'name_skl': dataRow.name_skl,
					'actual': dataRow.actual
				})
			}
			resolve(dataArray);
		});
	});
}

function saveSkl(config) {
	return new Promise((resolve, reject) => {
		let query = "";
		if (config.mode == "new") {
			query = "INSERT INTO skl (name_skl,actual)"
			query=query+" VALUES ('" + config.skl.name_skl + "',"
			query=query+" '" + config.skl.actual + "');"
		} else {
			query = "UPDATE skl s SET 	s.name_skl='" + config.skl.name_skl + "',"
			query=query+" 				s.actual='" + config.skl.actual + "'"
			query=query+" WHERE s.id_skl=" + config.skl.id_skl + ";"
		}
		mysql.query(query, function (err, res) {
			if (err) {
				reject(err);
				return;
			}
			if (config.mode != "new") { resolve(); return; }
			mysql.query("SELECT LAST_INSERT_ID() `id_skl`;", function (err, res) {
				if (err) {
					reject(err);
					return;
				}
				if (!("length" in res)) {
					reject("Не удалось получить код нового склада!");
					return;
				}
				resolve({'id_skl':res[0].id_skl});
				return;
			})
		});
	});
}

module.exports = router;