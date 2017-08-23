/*
	Module: twitch-web.js - Main App
	Version: 1.0 - 2017-05-20

	Copyright: Twitch-heroes.com, 2017 all rights reserved
	Authors: Ryan Kinsella, Clayton Munger
	Site: twitch-heroes.com
*/
//Setting up modules
var web = require('./librairies/imports');
var app = require('./utils/app');
var connection = require('./utils/db');
var async = require("async");
//middleware to protect page module 
require('./utils/twitch.js');

/**
 * Static Routes
 */
app.get('/', function(req, res) {
    res.render('index', {
        user: req.user,
        page_name: 'home'
    });
});
app.get('/help', function(req, res) {
    res.render('help', {
        user: req.user,
        page_name: 'help'
    });
});
app.get('/login', function(req, res) {
    res.render('login', {
        user: req.user,
        page_name: 'login'
    });
});
// Logout the user.
app.get('/logout', function(req, res) {

    req.logout();
    req.session.destroy();
    res.redirect('/');
});
// Redirect the user to Twitch for authentication.
app.get('/auth/twitch', web.passport.authenticate('twitch', {
    scope: ['user_read']
}), function(req, res) {});

// Authenticate the user.
app.get('/auth/twitch/callback', web.passport.authenticate('twitch', {
    failureRedirect: '/login'
}), function(req, res) {
    createUser(req, res);
});

web.http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

//Controller For Each View
var stats = require('./controllers/stats');
var shop = require('./controllers/shop');
var rank = require('./controllers/rank');
var inventory = require('./controllers/inventory');
var account = require('./controllers/account');
var account = require('./controllers/crafting');
var account = require('./controllers/auction');
var quests = require('./controllers/quests');
var bank = require('./controllers/bank');
var rebirth = require('./controllers/rebirth');
var rebirth = require('./controllers/lookup');

//###########################General Functions#############################

function getUserID(req, res) {
    connection.query("SELECT user_id FROM TwitchHeroes.users WHERE login=?;", [req.user.username], function(error, rows, fields) {
        if (error) {
            console.log('Error in query getUserId');
            res.redirect('/');
        } else {
            req.session.user_id = rows[0].user_id;
            res.redirect('/');
        }
    });
}

function createUser(req, res) {
    connection.query("INSERT IGNORE TwitchHeroes.users (login,display_name) VALUES (?,?);", [req.user.username, req.user.username], function(error, rows, fields) {
        if (error) {
            console.log('Error in query createUser');
            res.redirect('/');
        } else {
            getUserID(req, res);
        }
    });
}