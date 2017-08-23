/*
	Module: shop.js - Controller for shop module
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

//######################Shop##########################
app.get('/shop', function(req, res) {
    //if user is authenticated
    if (req.user) {
        //if no stats session make one and render it there
        if (!req.session.shop) {
            updateShopSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.shopexpire < Date.now()) {

                updateShopSession(req, res);
            } else {
                //if a stats session does exist, render here
                res.render('shop', {
                    user: req.user,
                    rows: req.session.shop,
                    page_name: 'shop'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateShopSession(req, res) {
    connection.query("SELECT u.gold, IFNULL(b.damageBuff,0) 'damageBuff', IFNULL(b.armorBuff,0) 'armorBuff', IFNULL(b.xpbuff,0) 'xpbuff', IFNULL(b.whitebuff,0) 'whitebuff', IFNULL(b.bluebuff,0) 'bluebuff' FROM TwitchHeroes.users u LEFT JOIN TwitchHeroes.buffs b ON b.user_id = u.user_id WHERE u.user_id = ?;", [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateShopSession');
            res.render('shop', {
                user: req.user
            });
        } else {
            req.session.totalGold = rows[0].gold;
            req.session.shop = rows;
            req.session.shopexpire = Date.now() + 500;
            res.render('shop', {
                user: req.user,
                rows: req.session.shop,
                page_name: 'shop'
            });
        }
    });
}

//###########################BUFFS###############################
app.post('/shop/buff', function(req, res, next) {

    var buffName = req.body.buff;
    var gold = req.session.totalGold;

    switch (buffName) {
        case 'damagebuff':
        case 'armorbuff':
        case 'whitebuff':

            if (gold >= 1000) {
                buffSession(req, res, buffName);
            }
            if (gold < 1000) {
                res.redirect('/shop');
            }
            break;

        case 'bluebuff': 
            if (gold >= 3000) {
                buffSession(req, res, buffName);
            }
            if (gold < 3000) {
                res.redirect('/shop');
            }
            break;
        case 'xpbuff':
            if (gold >= 15000) {
                buffSession(req, res, buffName);
            }
            if (gold < 15000) {
                res.redirect('/shop');
            }
            break;
        case 'allbuffs':
            if (gold >= 21000) {
                buffSession(req, res, buffName);
            }
            if (gold < 21000) {
                res.redirect('/shop');
            }
            break;
        default:
            res.redirect('/shop');

    }

});

function buffSession(req, res, buffName) {
    //if user is authenticated
    if (req.user) {
        var newdate = Date.now() + 3600000;

        if (buffName != 'allbuffs') {
            var post = [parseInt(newdate), req.session.user_id];
            connection.query("UPDATE TwitchHeroes.buffs SET " + buffName + " = ? WHERE user_id = ?;", post, function(error, rows, fields) {
                if (error) {
                    console.log('Error with buffSession');
                    res.redirect('/shop');
                } else {

                    if (buffName == 'damagebuff') {
                        removeGold(req, res, -1000, buffName);
                        res.redirect('/shop');
                    } 
                    if (buffName == 'armorbuff') {
                        removeGold(req, res, -1000, buffName);
                        res.redirect('/shop');
                    }

                    if (buffName == 'whitebuff') {
                        removeGold(req, res, -1000, buffName);
                        res.redirect('/shop');
                    } 

                    if (buffName == 'bluebuff') {
                        removeGold(req, res, -3000, buffName);
                        res.redirect('/shop');
                    } 
                    if (buffName == 'xpbuff') {
                        removeGold(req, res, -15000, buffName);
                        res.redirect('/shop');
                    } 
                    
                }
            });
        }


        if (buffName == 'allbuffs') {
            var post = [parseInt(newdate), parseInt(newdate),parseInt(newdate),parseInt(newdate),parseInt(newdate),req.session.user_id];
            connection.query("UPDATE TwitchHeroes.buffs SET damagebuff = ?, armorbuff = ?, whitebuff = ?, bluebuff = ?, xpbuff = ? WHERE user_id = ?;", post, function(error, rows, fields) {
                if (error) {
                    console.log('Error with allBuffs');
                    res.redirect('/shop');
                } else {
                    removeGold(req, res, -21000, buffName);
                    res.redirect('/shop');
                }
                    
                
            });
        }
    } else {
        res.redirect('/');
    }
}

//###########################BUFFS###############################
app.post('/shop/bankslot', function(req, res, next) {

    var gold = req.session.totalGold;

    if (gold >= 100000) {
        buybankSlot(req, res);
    }
    if (gold < 100000) {
        res.redirect('/shop');
    }
            
});

function buybankSlot(req, res) {
    //if user is authenticated
    if (req.user) {

        connection.query("update TwitchHeroes.users set bankslots = bankslots + 1 where user_id = ?;", req.session.user_id, function(error, rows, fields) {
            if (error) {
                console.log('Error with buybankSlot');
                res.redirect('/shop');
            } else {
                removeGold(req, res, -100000, 'bankslot');
                res.redirect('/shop');
            }
        });
        
    } else {
        res.redirect('/');
    }
}



function removeGold(req, res, gold, buffName) {
    var post = [parseInt(gold), req.user.username];
    connection.query("UPDATE TwitchHeroes.users SET gold = gold + ? WHERE login = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query removeGold');
        }
        else {
            req.session.totalGold = req.session.totalGold + gold;
            logBuff(buffName, req, res);
        }
    });
}

function logBuff(buffName, req, res) {
    var post = [req.session.user_id, req.user.username, buffName];
    connection.query("INSERT INTO TwitchHeroes.buffLog ( "
                    + "user_id, login, buff_name "
                    + ") "
                    + "VALUES(?, ?, ?) ", post, function(error, rows, fields) { 
        if (error) {
            console.log('Error in query insertBuffLog');
            res.redirect('/shop');
        } 
    });
}
