"use strict"
let express = require('express');
var bodyParser = require('body-parser');
let http = require('http');
let config = require('./config');
let log = require('./lib/log')(module);
let app = express();
var index = require('./app/server.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', index);

app.use(function (err, req, res, next) {
    if (err) {
        // console.log(err.stack);
        err.addData="route "+req.connection.parser.incoming.url;
        log.error(err);
        // srvf.claim(err);
    }
})

let server = app.server = http.createServer(app);

server.listen(config.get("server:port"), '0.0.0.0', function () {
    log.info('server listening on port ' + config.get("server:port"));
});