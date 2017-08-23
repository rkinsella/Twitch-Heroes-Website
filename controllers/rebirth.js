/*
	Module: rebirth.js - Controller for rebirth module
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
app.get('/rebirth', function(req, res) {
    //if user is authenticated
    if (req.user) {
        //if no stats session make one and render it there
        if (!req.session.rebirth) {
            updateRebirthSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.rebirthexpire < Date.now()) {
                updateRebirthSession(req, res);
            } else {
                //if a rebirth session does exist, render here
                res.render('rebirth', {
                    user: req.user,
                    rows: req.session.rebirth,
                    page_name: 'rebirth'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateRebirthSession(req, res) {
    var post = [parseInt(req.session.user_id), parseInt(req.session.user_id)];
    connection.query("select * "
                    + "FROM TwitchHeroes.talents t "
                    + "JOIN TwitchHeroes.users u "
                    + "WHERE u.user_id = ? and t.user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateRebirthSession');
            res.render('rebirth', {
                user: req.user,
                page_name: 'rebirth'
            });
        } else {

            if (rows.length > 0) {
                req.session.rebirth = rows;
                req.session.rebirthexpire = Date.now() + 250;
                res.render('rebirth', {
                    user: req.user,
                    rows: req.session.rebirth,
                    page_name: 'rebirth'
                });
            }

            if (rows.length == 0) {
                addTalentTreeForUserIfNone(req, res);
                res.redirect('/rebirth');
            }
        }
    });
}

function addTalentTreeForUserIfNone(req, res) {

    var sql = "INSERT INTO TwitchHeroes.talents(user_id) VALUES(?);"

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in addTalentTreeForUserIfNone: " + sql);
            res.redirect('/rebirth');
        }

    });

}

app.get('/rebirth/reset', function(req, res, next) {

     //if user is authenticated
    if (req.user) {
        if (req.session.rebirth[0].total_souls > 0) {
           resetTalents(req, res);
           resetSouls(req, res);
        }
        res.redirect('/rebirth');
    } else {
        res.redirect('/');
    }

});

function resetSouls(req, res) {

    var sql = "UPDATE TwitchHeroes.talents SET available_souls = total_souls  WHERE user_id = ?;"

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in resetSouls: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

app.get('/rebirth/rebirth', function(req, res, next) {

     //if user is authenticated
    if (req.user) {
        var level =  Math.floor(16*(Math.log10(req.session.rebirth[0].exp)));
        if (level >= 120) {
            updateSouls(req, res);
            req.session.rebirth[0].exp = 0;

            if (req.session.rebirth[0].keepcraftinglevel == 0) {
                resetExp(req, res);
            }

            if (req.session.rebirth[0].keepcraftinglevel > 0) {
                resetExpNotCrafting(req, res);
            }
            
            incrementNumTimesRebirthed(req, res);
            deleteInventoryItems(req, res);
            deleteEquippedItems(req, res);
            deleteBankItems(req, res);
            deleteAuctionItems(req, res);
        }
        res.redirect('/rebirth');
    } else {
        res.redirect('/');
    }

});

function resetExp(req, res) {

    var sql = "UPDATE TwitchHeroes.users SET exp = 1, crafting_exp = 0, stone = 0, wood = 0 WHERE user_id = ?;"

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in resetExp: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

function resetExpNotCrafting(req, res) {

    var sql = "UPDATE TwitchHeroes.users SET exp = 1, stone = 0, wood = 0 WHERE user_id = ?;"

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in resetExpNotCrafting: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

function incrementNumTimesRebirthed(req, res) {

    var post = [parseInt(req.session.user_id)];
    var sql = "UPDATE TwitchHeroes.users SET numtimes_rebirthed = numtimes_rebirthed + 1 WHERE user_id = ?;"

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in incrementNumTimesRebirthed: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

function updateSouls(req, res) {

    newSouls = req.session.rebirth[0].exp/5000000 + 120;
    var post = [parseInt(newSouls), parseInt(newSouls), parseInt(req.session.user_id)];
    var sql = "UPDATE TwitchHeroes.talents SET total_souls = total_souls + ?, available_souls = available_souls + ? WHERE user_id = ?;"

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in updateSouls: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

function setAvailableSoulsToCurrentSouls(req, res) {

    var post = [parseInt(req.session.user_id)];
    var sql = "UPDATE TwitchHeroes.talents t SET available_souls = t.total_souls WHERE user_id = ?;"

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in setAvailableSoulsToCurrentSouls: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

function resetTalents(req, res) {

    var post = [parseInt(req.session.user_id)];
    var sql = "UPDATE TwitchHeroes.talents t SET t.strength = 0, t.dexterity = 0, t.intelligence = 0, t.crit = 0, t.lifesteal = 0, t.armor = 0, t.health = 0, t.keepweapon = 0, t.keeparmor = 0, t.keepboots = 0, t.keephelmet = 0, t.keepgloves = 0, t.keepleggings = 0, t.keepbelt = 0, t.keepring = 0, t.keepnecklace = 0, t.keepcraftinglevel = 0 WHERE user_id = ?;"

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in resetTalents: " + sql);
            res.redirect('/rebirth');
        } 
    });

}

function deleteInventoryItems(req, res) {

    var sql = "DELETE FROM TwitchHeroes.inventoryItems WHERE user_id = ?;";

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in deleteInventoryItems: " + sql);
            res.redirect('/rebirth');
        } 
    });
}

function deleteEquippedItems(req, res) {

    var sql = "DELETE ei "
            + "FROM TwitchHeroes.equippedItems AS ei "
            + "INNER JOIN TwitchHeroes.items AS i ON i.item_id = ei.item_id "
            + "WHERE user_id = ?";

    if (req.session.rebirth[0].keephelmet > 0) {
        var temp = " AND i.armor_type != 1"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keeparmor > 0) {
        var temp = " AND i.armor_type != 2"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepboots > 0) {
        var temp = " AND i.armor_type != 3"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepweapon > 0) {
        var temp = " AND i.armor_type != 6"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepbelt > 0) {
        var temp = " AND i.armor_type != 7"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepleggings > 0) {
        var temp = " AND i.armor_type != 8"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepgloves > 0) {
        var temp = " AND i.armor_type != 9"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepring > 0) {
        var temp = " AND i.armor_type != 10"
        sql = sql.concat(temp);
    }

    if (req.session.rebirth[0].keepnecklace > 0) {
        var temp = " AND i.armor_type != 11"
        sql = sql.concat(temp);
    }

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in deleteEquippedItems: " + sql);
            res.redirect('/rebirth');
        } 
    });
}

function deleteBankItems(req, res) {

    var sql = "DELETE FROM TwitchHeroes.storageItems WHERE user_id = ?;";

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in deleteBankItems: " + sql);
            res.redirect('/rebirth');
        } 
    });
}

function deleteAuctionItems(req, res) {

    var sql = "DELETE FROM TwitchHeroes.auctionListing WHERE user_id = ?;";

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in deleteAuctionItems: " + sql);
            res.redirect('/rebirth');
        } 
    });
}

app.get('/rebirth/buyskill', function(req, res, next) {

     //if user is authenticated
    if (req.user) {
        var talentType = req.query['talent'];
        getTalentLevel(talentType, req, res);
        res.redirect('/rebirth');
    } else {
        res.redirect('/');
    }
});

function getTalentLevel(talentType, req, res) {

    var q1 = "SELECT ";
    var q2 = " FROM TwitchHeroes.talents WHERE user_id = ?;";
    var sql = q1.concat(talentType.concat(q2));

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in getTalentLevel: " + sql);
            res.redirect('/rebirth');
        } else {
            getAvailableSouls(talentType, rows, req, res);
        }
    });
}

function getAvailableSouls(talentType, talentLevel, req, res) {

    var sql = "SELECT available_souls FROM TwitchHeroes.talents WHERE user_id = ?;";

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in getAvailableSouls: " + sql);
            res.redirect('/rebirth');
        } else {
            var availableSouls = rows[0].available_souls;
            calculateSouls(talentType, talentLevel, availableSouls, req, res);
        }
    });

}

function calculateSouls(talentType, talentLevel, availableSouls, req, res) {
    var subtractedSouls = 0;
    switch (talentType) {
            case 'crit':
                subtractedSouls = (talentLevel[0].crit)*2 + 2;
                break;
            case 'strength':
                subtractedSouls = (talentLevel[0].strength)*1 + 1;
                break;
            case 'dexterity':
                subtractedSouls = (talentLevel[0].dexterity)*1 + 1;
                break;
            case 'intelligence':
                subtractedSouls = (talentLevel[0].intelligence)*1 + 1;
                break;
            case 'health':
                subtractedSouls = (talentLevel[0].health)*1 + 1;
                break;
            case 'armor':
                subtractedSouls = (talentLevel[0].armor)*2 + 2;
                break;
            case 'lifesteal':
                subtractedSouls = (talentLevel[0].lifesteal)*3 + 3;
                break;
            case 'keepweapon':
            case 'keeparmor':
            case 'keephelmet':
            case 'keepboots':
            case 'keepgloves':
            case 'keepleggings':
            case 'keepbelt':
            case 'keepring':
            case 'keepnecklace':
                subtractedSouls = 100;
                break;
            case 'keepcraftinglevel':
                subtractedSouls = 150;
                break;   
    }

    if (availableSouls >= subtractedSouls && subtractedSouls != 0) {

        //if ()
        req.session.rebirth[0].available_souls = req.session.rebirth[0].available_souls - subtractedSouls;
        addTalentLevel(talentType, talentLevel, subtractedSouls, req, res);
    }
}

function addTalentLevel(talentType, talentLevel, subtractedSouls, req, res) {

    var q1 = "UPDATE TwitchHeroes.talents SET ";
    var q2 = " = "
    var q3 = " + 1 WHERE user_id = ?;";
    var sql = q1.concat(talentType.concat(q2));
    sql = sql.concat(talentType.concat(q3));

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in addTalentLevel: " + sql);
            res.redirect('/rebirth');
        } else {
            updateAvailableSouls(talentType, talentLevel, subtractedSouls, req, res);
        }
    });

}

function updateAvailableSouls(talentType, talentLevel, subtractedSouls, req, res) {

    var sql = "UPDATE TwitchHeroes.talents SET available_souls = available_souls - ? WHERE user_id = ?;";
    var post = [parseInt(subtractedSouls), parseInt(req.session.user_id)];

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log("Error In Query in updateAvailableSouls: " + sql);
            res.redirect('/rebirth');
        } else {
            
        }
    });

}