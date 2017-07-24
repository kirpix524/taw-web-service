'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');

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

module.exports = router;