'use strict';

let mysql = require('mysql');
let config = require('../config');
let log = require('../lib/log')(module);
let mysql_connection;


let getConnection = function(){
    let connOpts = {
        host     : config.get('mysql:host'),
        port     : config.get('mysql:port'),
        user     : config.get('mysql:user'),
        password : config.get('mysql:password'),
        database : config.get('mysql:database')
    }
    mysql_connection = mysql.createConnection(connOpts);

    mysql_connection.on('error', function(err) {
        log.error(err.code); // 'ER_BAD_DB_ERROR'
        //console.log('err',err.code);
        getConnection();
    });

    mysql_connection.connect(function(err) {
        if (err) {
            log.error('error connecting: ' + err.stack);
            process.exit(1);
            return;
        }

        log.info('connected as id ' + mysql_connection.threadId);
        //console.log('connected as id ' + mysql_connection.threadId);
    });
};

getConnection();
module.exports = mysql_connection;