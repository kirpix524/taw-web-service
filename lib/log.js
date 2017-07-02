'use strict'
let winston = require('winston');
let fs = require('fs');
let env = process.env.NODE_ENV || 'development';
let logDir = 'log';
let path = require('path');

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

let tsFormat = () => (new Date()).toLocaleTimeString();

function getLogger(module) {
    let pathmod = module.filename.split("\\").slice(-2).join("\\");
    return new (winston.Logger)({
        transports: [
            // colorize the output to the console
            new (winston.transports.Console)({
                timestamp: tsFormat,
                colorize: true,
                level: 'info',
                label: pathmod
            }),
            new (require('winston-daily-rotate-file'))({
                filename: path.join(logDir,'/.log'),
                timestamp: tsFormat,
                datePattern: 'yyyy-MM-dd',
                prepend: true,
                level: env === 'development' ? 'verbose' : 'info',
                label: pathmod
            })
        ]
    });
}

module.exports = getLogger;