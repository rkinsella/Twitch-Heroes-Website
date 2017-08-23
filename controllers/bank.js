/*
	Module: bank.js - Controller for Bank module
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


app.get('/bank', function(req, res) {
    //if user is authenticated
    if (req.user) {
        //if no stats session make one and render it there
        if (!req.session.bank) {
            updateBankSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.bankexpire < Date.now()) {
                updateBankSession(req, res);
            } else {
                //if a bank session does exist, render here
                res.render('bank', {
                    user: req.user,
                    rows: req.session.bank,
                    page_name: 'bank'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateBankSession(req, res) {
    connection.query("SELECT DISTINCT * "
					+ "FROM TwitchHeroes.users u "
					+ "JOIN TwitchHeroes.storageItems si "
					+ "ON si.user_id = u.user_id "
					+ "JOIN TwitchHeroes.items i ON i.item_id = si.item_id "
					+ "WHERE u.user_id = ?;", [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateBankSession');
            res.render('bank', {
                user: req.user,
                page_name: 'bank'
            });
        } else {
            req.session.bank = rows;
            req.session.bankexpire = Date.now() + 250;
            res.render('bank', {
                user: req.user,
                rows: req.session.bank,
                page_name: 'bank'
            });
        }
    });
}

app.post('/bank/takeout', function(req, res) {
    //if user is authenticated
    if (req.user) {
       deleteItemFromBank(req.session.user_id, req.body.takeout, req, res); 
    } else {
        res.redirect('/');
    }
});

function deleteItemFromBank(uid, iid, req, res) {
    var post = [parseInt(uid), parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('DELETE FROM TwitchHeroes.storageItems WHERE user_id=? AND item_id=?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in deleteItemFromBank');
                res.redirect('/bank');
            }
            else {
                insertItemIntoInventory(uid, iid, req, res);
            }
        });
}

function insertItemIntoInventory(uid, iid, req, res) {
    var post = [parseInt(uid), parseInt(iid)];
    connection.query("INSERT INTO TwitchHeroes.inventoryItems ("
                    + "user_id, item_id"
                    + ") "
                    + "VALUES(?, ?);", 
                    post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query store');
            res.redirect('/bank');
        } else {
            res.redirect('/bank');
        }
    });
}

app.get('/bank/auction', function(req, res) {
    //if user is authenticated
    if (req.user) {
        var gold = parseInt((req.query.gold*1000));
        var silver = parseInt((req.query.silver))

        if (isNaN(gold)) {
            gold = 0;
        }

        if (isNaN(silver)) {
            silver = 0;
        }

        var sell_price = gold + silver;
        
        if (sell_price > 0) {
            deleteItemFromBankAuction(req.user.username, req.session.user_id, req.query.auction, sell_price, req, res);
        }

        if (sell_price <= 0) {
            res.redirect('/bank');
        }
       //deleteItemFromBank(req.session.user_id, req.body.auction, req, res); 
    } else {
        res.redirect('/');
    }
});

function insertItemIntoAuction(login, uid, iid, sell_price, req, res) {
    var post = [login, parseInt(uid), parseInt(iid), parseInt(sell_price)];
    connection.query("INSERT INTO TwitchHeroes.auctionListing ( "
                    + "login, user_id, item_id,sell_price) "
                    + "Values (?, ?, ?, ?);", 
                    post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query insertItemIntoAuction');
            res.redirect('/bank');
        } else {
            res.redirect('/bank');
        }
    });
}

function deleteItemFromBankAuction(login, uid, iid, sell_price, req, res) {
    var post = [parseInt(uid), parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('DELETE FROM TwitchHeroes.storageItems WHERE user_id=? AND item_id=?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in deleteItemFromBankAuction');
                res.redirect('/bank');
            }
            else {
               insertItemIntoAuction(login, uid, iid, sell_price, req, res);
            }
        });
}