/*
    Module: auction.js - Controller for auction module
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
app.get('/auction', function(req, res) {
    //if user is authenticated
    if (req.user) {
        if (req.session.auction) {
            res.render('auction', {
                user: req.user,
                rows: req.session.auction,
                page_name: 'auction'
            });
        }
        else {
            res.render('auction', {
                user: req.user,
                page_name: 'auction'
            });
        }
        
    }
    else {
        res.redirect('/');
    }
});

app.get('/auction/search', function(req, res) {
    //if user is authenticated
    if (req.user) {
        if (!req.session.auctionexpire) {
            req.session.auctionexpire = Date.now();
        }
        if (!req.session.auction) {
            buildSearchOptions(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.auctionexpire < Date.now()) {
                buildSearchOptions(req, res);
            } else {
                //if a session does exist, render here
                res.render('auction', {
                    user: req.user,
                    rows: req.session.auction,
                    page_name: 'auction'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function buildSearchOptions(req, res) {
    //gets the variables from the search fields
    var user_id = req.session.user_id;
    //var sort = req.query.sort[0];

    var armor_type = req.query.armortype;
    var quality = req.query.quality;
    var auctionowner = req.query.auctionowner;

    var damage = req.query['damage'];
    var health = req.query['health'];
    var crit = req.query['crit'];
    var lifesteal = req.query['lifesteal'];
    var strength = req.query['strength'];
    var dexterity = req.query['dexterity'];
    var intelligence = req.query['intelligence'];
    var armor = req.query['armor'];
    var mindamage = req.query['mindamage'];
    var maxdamage = req.query['maxdamage'];

    //if any of the variables returned are empty, sets to 0 (if user leaves it blank)
    if (damage == '') {
        damage = 0;
    }

    if (health == '') {
        health = 0;
    }

    if (crit == '') {
        crit = 0;
    }

    if (lifesteal == '') {
        lifesteal = 0;
    }

    if (strength == '') {
        strength = 0;
    }

    if (dexterity == '') {
        dexterity = 0;
    }

    if (intelligence == '') {
        intelligence = 0;
    }

    if (armor == '') {
        armor = 0;
    }

    if (mindamage == '') {
        mindamage = 0;
    }

    if (maxdamage == '') {
        maxdamage = 0;
    }
         
    //pass the variables to query
    searchForItems(user_id, quality, armor_type, auctionowner, damage, health, crit, armor, lifesteal, mindamage, maxdamage, strength, intelligence, dexterity, req, res);
}

function searchForItems(user_id, quality, armor_type, auctionowner, damage, health, crit, armor, lifesteal, mindamage, maxdamage, strength, intelligence, dexterity, req, res) {
    var post;
    var query;
    if (parseInt(armor_type) != 0 && parseInt(quality) != 0 && parseInt(auctionowner) == 0) {
        post = [parseInt(user_id), parseInt(quality), parseInt(armor_type), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? AND i.quality = ? "
                        + "AND i.armor_type = ? "
                        + "AND i.damage >= ? AND i.health >= ? AND i.crit >= ? "
                        + "AND CASE WHEN i.armor_type = 1 OR i.armor_type = 2 OR i.armor_type = 3 OR i.armor_type = 8 THEN i.item_level ELSE 0 END + i.armor >= ? "
                        + "AND i.lifesteal >= ? AND i.mindamage >= ? and i.maxdamage >= ? AND i.strength >= ?  "
                        + "AND i.intelligence >= ? AND i.dexterity >= ? "
                        + "ORDER BY sell_price asc, date_created desc;"
    }

    if (parseInt(armor_type) == 0 && parseInt(quality) != 0 && parseInt(auctionowner) == 0) {
        post = [parseInt(user_id), parseInt(quality), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? and i.quality = ? "
                        + "AND damage >= ? AND health >= ? AND crit >= ? "
                        + "AND CASE WHEN armor_type = 1 OR armor_type = 2 OR armor_type = 3 OR armor_type = 8 THEN item_level ELSE 0 END + armor >= ? "
                        + "AND lifesteal >= ? AND mindamage >= ? and maxdamage >= ? AND strength >= ?  "
                        + "AND intelligence >= ? AND dexterity >= ? "
                        + "ORDER BY sell_price asc, date_created desc;"
    }

    if (parseInt(armor_type) != 0 && parseInt(quality) == 0 && parseInt(auctionowner) == 0) {
        post = [parseInt(user_id), parseInt(armor_type), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? "
                        + "AND i.armor_type = ? "
                        + "AND i.damage >= ? AND i.health >= ? AND i.crit >= ? "
                        + "AND CASE WHEN i.armor_type = 1 OR i.armor_type = 2 OR i.armor_type = 3 OR i.armor_type = 8 THEN i.item_level ELSE 0 END + i.armor >= ? "
                        + "AND i.lifesteal >= ? AND i.mindamage >= ? and i.maxdamage >= ? AND i.strength >= ?  "
                        + "AND i.intelligence >= ? AND i.dexterity >= ? "
                        + "ORDER BY sell_price asc, date_created desc;"
    }

    if (parseInt(armor_type) == 0 && parseInt(quality) == 0 && parseInt(auctionowner) == 0) {
        post = [parseInt(user_id), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? "
                        + "AND damage >= ? AND health >= ? AND crit >= ? "
                        + "AND CASE WHEN armor_type = 1 OR armor_type = 2 OR armor_type = 3 OR armor_type = 8 THEN item_level ELSE 0 END + armor >= ? "
                        + "AND lifesteal >= ? AND mindamage >= ? and maxdamage >= ? AND strength >= ?  "
                        + "AND intelligence >= ? AND dexterity >= ? "
                        + "ORDER BY sell_price asc, date_created desc;"
    }

    //my auctions
    if (parseInt(armor_type) != 0 && parseInt(quality) != 0 && parseInt(auctionowner) == 1) {
        post = [parseInt(user_id), parseInt(quality), parseInt(armor_type), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity), parseInt(user_id)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? AND i.quality = ? "
                        + "AND i.armor_type = ? "
                        + "AND i.damage >= ? AND i.health >= ? AND i.crit >= ? "
                        + "AND CASE WHEN i.armor_type = 1 OR i.armor_type = 2 OR i.armor_type = 3 OR i.armor_type = 8 THEN i.item_level ELSE 0 END + i.armor >= ? "
                        + "AND i.lifesteal >= ? AND i.mindamage >= ? and i.maxdamage >= ? AND i.strength >= ?  "
                        + "AND i.intelligence >= ? AND i.dexterity >= ? "
                        + "AND ai.user_id = ? "
                        + "ORDER BY sell_price asc, date_created desc"
    }

    if (parseInt(armor_type) == 0 && parseInt(quality) != 0 && parseInt(auctionowner) == 1) {
        post = [parseInt(user_id), parseInt(quality), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity), parseInt(user_id)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? and i.quality = ? "
                        + "AND damage >= ? AND health >= ? AND crit >= ? "
                        + "AND CASE WHEN armor_type = 1 OR armor_type = 2 OR armor_type = 3 OR armor_type = 8 THEN item_level ELSE 0 END + armor >= ? "
                        + "AND lifesteal >= ? AND mindamage >= ? and maxdamage >= ? AND strength >= ?  "
                        + "AND intelligence >= ? AND dexterity >= ? "
                        + "AND ai.user_id = ? "
                        + "ORDER BY sell_price asc, date_created desc"
    }

    if (parseInt(armor_type) != 0 && parseInt(quality) == 0 && parseInt(auctionowner) == 1) {
        post = [parseInt(user_id), parseInt(armor_type), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity), parseInt(user_id)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? "
                        + "AND i.armor_type = ? "
                        + "AND i.damage >= ? AND i.health >= ? AND i.crit >= ? "
                        + "AND CASE WHEN i.armor_type = 1 OR i.armor_type = 2 OR i.armor_type = 3 OR i.armor_type = 8 THEN i.item_level ELSE 0 END + i.armor >= ? "
                        + "AND i.lifesteal >= ? AND i.mindamage >= ? and i.maxdamage >= ? AND i.strength >= ?  "
                        + "AND i.intelligence >= ? AND i.dexterity >= ? "
                        + "AND ai.user_id = ? "
                        + "ORDER BY sell_price asc, date_created desc"
    }

    if (parseInt(armor_type) == 0 && parseInt(quality) == 0 && parseInt(auctionowner) == 1) {
        post = [parseInt(user_id), parseInt(damage), parseInt(health), parseInt(crit), parseInt(armor), parseInt(lifesteal), 
                parseInt(mindamage), parseInt(maxdamage), parseInt(strength), parseInt(intelligence), parseInt(dexterity), parseInt(user_id)];

        query = "SELECT ai.login as sellerLogin, u.login as buyerLogin, ai.user_id as sellerUID,  "
                        + "u.user_id as buyerUID, ai.sell_price, ai.date_created, i.item_id, i.item_name, i.armor_type, i.item_level,  "
                        + "i.quality,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength,  "
                        + "i.intelligence, i.dexterity, u.gold "
                        + "FROM TwitchHeroes.auctionListing ai "
                        + "JOIN TwitchHeroes.items i "
                        + "ON ai.item_id = i.item_id "
                        + "JOIN TwitchHeroes.users u "
                        + "WHERE u.user_id = ? "
                        + "AND damage >= ? AND health >= ? AND crit >= ? "
                        + "AND CASE WHEN armor_type = 1 OR armor_type = 2 OR armor_type = 3 OR armor_type = 8 THEN item_level ELSE 0 END + armor >= ? "
                        + "AND lifesteal >= ? AND mindamage >= ? and maxdamage >= ? AND strength >= ?  "
                        + "AND intelligence >= ? AND dexterity >= ? "
                        + "AND ai.user_id = ? "
                        + "ORDER BY sell_price asc, date_created desc;"
    }

    var queryResults = connection.query(query, post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query searchForItems');
            console.log(queryResults.sql);
            res.redirect('/auction');
        } else {
            req.session.auction = rows;
            req.session.auctionexpire = Date.now() + 500;
            storeAuctionSession(rows, req, res);
        }
    });
}

function storeAuctionSession(rows, req, res) {
    req.session.auction = rows;
    redirectToAuction(rows, req, res)
}

function redirectToAuction(rows, req, res) {
    req.session.auction = rows;
    res.redirect('/auction');
}

app.post('/auction/buy', function(req, res) {
    //if user is authenticated
    if (req.user) {
    	getSellPrice(req.body.buy, req, res);
    } else {
        res.redirect('/');
    }
});

function getSellPrice(iid, req, res) {
    var sell_price = 0;
    var buyerUID = req.session.user_id;
    var post = [parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('select sell_price from TwitchHeroes.auctionListing where item_id = ?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in getAuctionSellPrice');
                res.redirect('/auction');
            }
            else {
                sell_price = rows[0].sell_price;

                if (typeof sell_price == 'undefined') {
                    res.redirect('/auction');
                }

                else {
                    if (req.session.auction[0].gold > sell_price) {
                        getUIDOfSeller(sell_price, buyerUID, iid, req, res);
                    }

                    if (req.session.auction[0].gold < sell_price) {
                        res.redirect('/auction');
                    }
                }
                    
            }
        });
}

function getUIDOfSeller(sell_price, buyerUID, iid, req, res) {
    var post = [parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('select user_id from TwitchHeroes.auctionListing where item_id = ?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in getUIDOfSeller');
                res.redirect('/auction');
            }
            else {
                if (typeof rows[0].user_id == 'undefined') {
                    res.redirect('/auction');
                }
                else {
                    addGold(sell_price, buyerUID, rows[0].user_id, iid, req, res);
                }
            }
        });
}

function addGold(sell_price, buyerUID, sellerUID, iid, req, res) {
    
    var post = [parseInt(sell_price), parseInt(sellerUID)];
    connection.query("UPDATE TwitchHeroes.users SET gold = gold + ? WHERE user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query addGold');
        }
        else {
            removeGold(sell_price, buyerUID, iid, req, res);
        }
    });
}

function removeGold(sell_price, buyerUID, iid, req, res) {
 
    var post = [parseInt(sell_price), parseInt(buyerUID)];
    connection.query("UPDATE TwitchHeroes.users SET gold = gold - ? WHERE user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query removeGold');
        }
        else {
            insertItemIntoInventory(buyerUID, iid, sell_price, req, res);
        }
    });
}



function insertItemIntoInventory(buyerUID, iid, sell_price, req, res) {
    var post = [parseInt(buyerUID), parseInt(iid)];
    connection.query("INSERT INTO TwitchHeroes.inventoryItems ("
                    + "user_id, item_id"
                    + ") "
                    + "VALUES(?, ?);", 
                    post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query insertItemIntoInventory');
            res.redirect('/auction');
        } else {
            deleteItemFromAuction(buyerUID, iid, sell_price, req, res);
        }
    });
}

function deleteItemFromAuction(buyerUID, iid, sell_price, req, res) {
    var post = [parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('DELETE FROM TwitchHeroes.auctionListing WHERE item_id=?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in deleteItemFronAuction');
                res.redirect('/auction');
            }
            else {
                res.redirect('/auction');
            }
        });
}

app.post('/auction/takeoff', function(req, res) {
    //if user is authenticated
    if (req.user) {
        deleteItemFromAuctionTakeOff(req.body.takeoff, req.session.user_id, req,res);
    } else {
        res.redirect('/');
    }
});

function deleteItemFromAuctionTakeOff(iid, uid, req, res) {
    var post = [parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('DELETE FROM TwitchHeroes.auctionListing WHERE item_id=?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in deleteItemFromAuctionTakeOff');
                res.redirect('/auction');
            }
            else {
                insertItemIntoInventoryTakeOff(iid, uid, req, res);
            }
        });
}

function insertItemIntoInventoryTakeOff(iid, uid, req, res) {
    var post = [parseInt(uid), parseInt(iid)];
    connection.query("INSERT INTO TwitchHeroes.inventoryItems ("
                    + "user_id, item_id"
                    + ") "
                    + "VALUES(?, ?);", 
                    post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query insertItemIntoInventoryTakeOff');
            res.redirect('/auction');
        } else {
            res.redirect('/auction');
        }
    });
}

