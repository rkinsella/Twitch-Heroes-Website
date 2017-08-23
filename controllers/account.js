/*
	Module: account.js - Controller for account module
	Version: 1.0 - 2017-05-20

	Copyright: Twitch-heroes.com, 2017 all rights reserved
	Authors: Ryan Kinsella, Clayton Munger
	Site: twitch-heroes.com
*/
//Setting extended modules
var web = require('../librairies/imports');
var app = require('../utils/app.js');
var connection = require('../utils/db.js');
var async = require("async");

//######################Account##########################
app.get('/account', function(req, res) {
    //if user is authenticated
    if (req.user) {
        //if no stats session make one and render it there
        if (!req.session.account) {
            updateAccountSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.accountexpire < Date.now()) {
                updateAccountSession(req, res);
            } else {
                //if a stats session does exist, render here
                res.render('account', {
                    user: req.user,
                    rows: req.session.account,
                    page_name: 'account'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

app.get('/account/usekey', function(req, res) {
    //var keyRoll = Math.floor(Math.random() * 3 + 1); 

    if (parseInt(req.session.account[0].num_keys) > 0) {
        var randomGold = (Math.floor(Math.random() * 10 + 20))*1000; 
        req.session.account[0].num_keys = req.session.account[0].num_keys - 1;
        addGoldSubtractKey(req, res, randomGold);

    }

    res.redirect('/account');


});

function addGoldSubtractKey(req, res, gold) {
    var post = [parseInt(gold), req.user.username];
    connection.query("UPDATE TwitchHeroes.users SET gold = gold + ?, num_keys = num_keys - 1 WHERE login = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query addGoldSubtractKey');
        }
    });
}

app.get('/account/rgb', function(req, res) {
    var red = req.query['red'];
    var green = req.query['green'];
    var blue = req.query['blue'];
    var user_id = req.session.user_id;
    //if no input set to 0
    if (red == '') {
        red = 0;
    }

    if (green == '') {
        green = 0;
    }

    if (blue == '') {
        blue = 0;
    }

    //if greater than 255 set to 255
    if (parseInt(red) > 255) {
        red = 255;
    }

    if (parseInt(green) > 255) {
        blue = 255;
    }

    if (parseInt(blue) > 255) {
        blue = 255;
    }

    //if negative, set to 0
    if (parseInt(red) < 0) {
        red = 0;
    }

    if (parseInt(blue) < 0) {
        blue = 0;
    }

    if (parseInt(blue) < 0) {
        blue = 0;
    }

    updateRGB(red, green, blue, user_id, req, res);
});

function updateRGB(red, green, blue, user_id, req, res) {

        var post = [parseInt(red), parseInt(green), parseInt(blue), parseInt(user_id)];
        connection.query("update TwitchHeroes.users "
                    + "set red = ?, green = ?, blue = ? "
                    + "where user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateRGB');
            res.render('account', {
                user: req.user,
                page_name: 'account'
            });
        } else {
            res.redirect('/account');
        }
    });
}

function updateAccountSession(req, res) {
    connection.query("select hat, class, num_keys from TwitchHeroes.users where user_id = ?", [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateAccountSession');
            res.render('account', {
                user: req.user,
                page_name: 'account'
            });
        } else {
            req.session.account = rows;
            req.session.accountexpire = Date.now() + 1000;
            res.render('account', {
                user: req.user,
                rows: req.session.account,
                page_name: 'account'
            });
        }
    });
}

//#######################HAT#############################
app.get('/account/hat', function(req, res, next) {

    //if user is authenticated
    if (req.user) {
        if (req.session.hattimer) {
            if (req.session.hattimer < Date.now()) {
                hatSession(req, res);
            }
            if (req.session.hattimer > Date.now()) {
                res.redirect('/account');
            }
        }
        if (!req.session.hattimer) {
            hatSession(req, res);
        }
    } else {
        res.redirect('/');
    }
});

function hatSession(req, res) {
    var post = [parseInt(req.query.hat), req.session.user_id];
    connection.query("UPDATE TwitchHeroes.users SET hat = ? WHERE user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in hatSession');
            res.redirect('/account');
        } else {
            req.session.hattimer = Date.now() + 1000;
            res.redirect('/account');
        }
    });
}

//#######################CLASS#############################
app.get('/account/class', function(req, res, next) {
    //if user is authenticated
    if (req.user) {
        if (req.session.classtimer) {
            if (req.session.classtimer < Date.now()) {
                classSession(req, res);
            }
            if (req.session.classtimer > Date.now()) {
                res.redirect('/account');
            }
        }
        if (!req.session.classtimer) {
            classSession(req, res);
        }
    } else {
        res.redirect('/');
    }
});

function classSession(req, res) {
    var post = [parseInt(req.query.class), req.session.user_id];
    connection.query("UPDATE TwitchHeroes.users SET class = ? WHERE user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in classSession');
            res.redirect('/account');
        } else {
            req.session.classtimer = Date.now() + 1000;
            res.redirect('/account');
        }
    });
}