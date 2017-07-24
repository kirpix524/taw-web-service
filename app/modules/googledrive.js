'use strict'
var express = require('express');
var router = express.Router();
let log = require('../../lib/log')(module);
let sf = require('../../lib/stringfunctions');
let mysql = require('../../services/mysqlClient');
let fs = require('fs');


var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';

// // Load client secrets from a local file.
// fs.readFile('client_secret.json', function processClientSecrets(err, content) {
// 	if (err) {
// 		console.log('Error loading client secret file: ' + err);
// 		return;
// 	}
// 	// Authorize a client with the loaded credentials, then call the
// 	// Drive API.
// 	authorize(JSON.parse(content), sendFileToDrive);
// });

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function sendFileToDrive(auth, filename, filepath) {
    // filepath = filepath || '/home/surovcevnv/common/git/taw-web-service/app/files/report.csv';
    filepath = filepath || __dirname+'/../../Excel.xlsx';
    filename = filename || 'Автоотчет';
    var service = google.drive('v3');
    var fileMetadata = {
        'name': filename,
        'mimeType': 'application/vnd.google-apps.spreadsheet'
    };
    var media = {
        mimeType: 'text/csv',
        body: fs.createReadStream(filepath)
    };
    service.files.create({
        auth: auth,
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            // Handle error
            console.log(err);
        } else {
            console.log('File Id:', file.id);
        }
    });
}

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

    // sendFileToDrive(auth, 'Auto excel', __dirname+'/Excel.xlsx');
    // Load client secrets from a local file.
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Drive API.
        authorize(JSON.parse(content), sendFileToDrive);
    });

    res.status(202).send('ok');
})

module.exports = router;