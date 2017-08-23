/*
	Module: db.js - db setup module
	Version: 1.0 - 2017-05-20

	Copyright: Twitch-heroes.com, 2017 all rights reserved
	Authors: Ryan Kinsella, Clayton Munger
	Site: twitch-heroes.com
*/
//Setting up database mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
    
    //MySQL host
    host: 'localhost',

    //MySQL username
    user: '',

    //MySQL password
    password: '',

    //MySQL databasename
    database: 'TwitchHeroes',
    multipleStatements: true
});

connection.connect(function(error) {
    if (!!error) {
        console.log('Error connecting to MySQL');
    }
});
//set safe updates to false
connection.query("SET SQL_SAFE_UPDATES=0;", function(error, rows, fields) {
    if (!!error) {
        console.log('Error in query');
    }
});

//export file to app
module.exports = connection;