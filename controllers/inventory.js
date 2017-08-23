/*
    Module: inventory.js - Controller for inventory module
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

//######################Inventory##########################
app.get('/equipped', function(req, res) {
    //if user is authenticated
    if (req.user) {
        //if no session make one and render it there
        if (!req.session.equipped) {
            updateEquippedSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.equippedexpire < Date.now()) {
                updateEquippedSession(req, res);
            } else {
                //if a session does exist, render here
                res.render('equipped', {
                    user: req.user,
                    rows: req.session.equipped,
                    page_name: 'equipped'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateEquippedSession(req, res) {
    var sql = "SELECT qq.*, u.inventory_slots 'slots' FROM  " +
              "( " +
              "SELECT ii.user_id 'User_Id','Inventory',i.item_name, i.quality, i.item_id,i.armor_type,i.item_level,i.damage,i.health,i.armor, i.crit, i.lifesteal, i.mindamage, i.maxdamage, i.strength, i.intelligence, i.dexterity " +
              "FROM TwitchHeroes.items i  " +
              "JOIN TwitchHeroes.inventoryItems ii ON ii.item_id = i.item_id  " +
              "UNION  " +
              "SELECT ei.user_id 'User_Id','Equipped',i.item_name, i.quality, i.item_id,i.armor_type,i.item_level,i.damage,i.health,i.armor,i.crit,i.lifesteal, i.mindamage, i.maxdamage, i.strength, i.intelligence, i.dexterity " +
              "FROM TwitchHeroes.items i  " +
              "JOIN TwitchHeroes.equippedItems ei ON ei.item_id = i.item_id " +
              ") qq  " +
              "LEFT JOIN TwitchHeroes.users u ON qq.User_Id = u.user_id WHERE u.user_id = ? ORDER BY Inventory desc, ((qq.item_level * 10) + qq.crit + (qq.lifesteal*5) + (qq.item_level * 10) + (qq.damage * 5) + qq.health + (qq.armor * 10)) desc";
    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateRankingSession');
            res.render('equipped', {
                user: req.user
            });
        } else {
            //If we do not have any items we set items to default 100
            if (typeof rows[0] == 'undefined') {
                rows.slots = 100;
            } else {
                rows.slots = rows[0].slots;

            }
            var numItems = 0;
            if (rows.length > 0) {
                var sellallvalue = 0;
                for (var z = 0; z < rows.length; z++) {
                    if (rows[z].Inventory == 'Inventory') {
                        sellallvalue = sellallvalue + (rows[z].quality * 10 * rows[z].item_level);
                        numItems++;
                    }
                }
                req.session.sellallvalue = sellallvalue;
            }
            req.session.equipped = rows;
            req.session.equippedexpire = Date.now() + 250;
            res.render('equipped', {
                user: req.user,
                rows: rows,
                page_name: 'equipped'
            });
        }
    });
}

app.post('/equipped', function(req, res, next) {
    res.render('equipped', {
                user: req.user,
                rows: req.session.equipped,
                page_name: 'equipped',
                tab_name: req.body.tab
            });
    
});

function renderInventory(tab, req, res) {
     res.render('equipped', {
                user: req.user,
                rows: req.session.equipped,
                page_name: 'equipped',
                tab_name: tab
            });
}

app.post('/equipped/unequip', function(req, res, next) {
    var iid = req.body.unequip;
    connection.query("SELECT user_id FROM TwitchHeroes.users WHERE login=?;", [req.user.username], function(error, rows, fields) {
        if (error) {
            console.log('Error in query unequip');
            res.redirect('/equipped');
        } else {
            var uid = rows[0].user_id;
            deleteItemFromEquipped(uid, iid);
            insertItemIntoInventory(uid, iid);
            res.redirect('/equipped');
        }
    });
});

app.post('/equipped/store', function(req, res, next) {

     //if user is authenticated
    if (req.user) {
        //if no session make one and render it there
        if (!req.session.storeitemexpire) {
            storeItem(req.session.user_id, req.body.store, req, res);
            redirectToEquipped(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.storeitemexpire < Date.now()) {
                storeItem(req.session.user_id, req.body.store, req, res);
                redirectToEquipped(req, res);
            } else {
                redirectToEquipped(req, res);
            }
        }
    } else {
        res.redirect('/');
    }
});

function storeItem(uid, iid, req, res) {
    var post = [parseInt(iid), parseInt(uid), parseInt(uid), parseInt(iid)];
                connection.query("INSERT IGNORE INTO TwitchHeroes.storageItems (user_id,item_id) "
                                 + "SELECT u.user_id, ? "
                                 + "FROM TwitchHeroes.users u  "
                                 + "LEFT JOIN TwitchHeroes.storageItems sI ON sI.user_id = u.user_id "
                                 + "WHERE u.user_id = ?  "
                                 + "AND (SELECT COUNT(*) FROM TwitchHeroes.storageItems WHERE user_id = ?) <= u.bankslots "
                                 + "AND 1 = (SELECT COUNT(*) FROM TwitchHeroes.inventoryItems WHERE item_id = ?)  "
                                 + "GROUP BY u.user_id;", 
                    post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query store');
            res.redirect('/equipped');
        } else {
            deleteItemFromInventoryOnStore(uid, iid, req, res);
        }
    });
}

function deleteItemFromInventoryOnStore(uid, iid, req, res) {
    var post = [parseInt(uid), parseInt(uid), parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query("DELETE ti "
                        + "FROM users u "
                        + "JOIN TwitchHeroes.inventoryItems ti ON u.user_id = ti.user_id "
                        + "WHERE (SELECT COUNT(*) FROM TwitchHeroes.storageItems WHERE user_id = ?) <= u.bankslots "
                        + "AND u.user_id = ? AND ti.item_id = ?;"
                        , post, function(error, rows, fields) { 
            if (error) {
                console.log('Error in deleteItemFromInventory');
               // res.redirect('/equipped');
            }
            else {
                req.session.storeitemexpire = Date.now() + 250;
            }
        });
}

function redirectToEquipped(req, res) {
    res.redirect('/equipped');
}
 
app.post('/equipped/click', function(req, res, next) {
    //if user is authenticated
    if (req.user) {
        var iid = req.body.click;
        //if no session make one and render it there
        makeClickedTrue(iid, req, res)
        res.redirect('/equipped');
    } else {
        res.redirect('/');
    }
});

function makeClickedTrue(iid, req, res) {
    if (req.session.equipped) {
        for (var i = 0; i < req.session.equipped.length; i++) {
            if (req.session.equipped[i].item_id == iid) {
                req.session.equipped[i].clicked = 'true';
            }
            if (req.session.equipped[i].item_id != iid) {
                req.session.equipped[i].clicked = 'false';
            }
        }
    }
}

function deleteItemFromMemory(iid, req, res) {
    if (req.session.equipped) {
        for (var i = 0; i < req.session.equipped.length; i++) {
            if (req.session.equipped[i].item_id == iid) {
                req.session.equipped[i].sold = 'true';
            }
        }
    }
}

function inventorySellSession(iid, req, res) {
    connection.query("SELECT user_id FROM TwitchHeroes.users WHERE login=?;", [req.user.username], function(error, rows, fields) {
        if (error) {
            console.log('Error in query inventorySellSession');
            res.redirect('/equipped');
        } else {
            var uid = rows[0].user_id;
            if (res && req) {
                sellItemFromInventory(uid, iid, req, res);
                //add gold, makes sure the item is not sold first
                if (req.session.equipped) {
                    for (var i = 0; i < req.session.equipped.length; i++) {
                        if (req.session.inventory[i].item_id == iid) {
                            if (req.session.equipped[i].sold != 'true') {
                                req.session.equipped[i].sold = 'true';
                                addGold(req, res, 10);
                            }
                        }
                    }
                }
            }

        }
    });
}

app.post('/equipped/sellall', function(req, res, next) {
    if (req.body.sellall.split(',') == 'undefined') {
        res.redirect('/equipped');
    }
    var sellInfo = req.body.sellall.split(',');
    if (req.session.sellalltimer) {
        if (req.session.sellalltimer < Date.now()) {
            var b = req.session.sellallvalue;
            var a = sellInfo[0];
            req.session.sellallvalue = 0;
            equippedSellAllSession(req, res, a, b);
        }
    } else {
        var b = req.session.sellallvalue;
        var a = sellInfo[0];
        req.session.sellallvalue = 0;
        equippedSellAllSession(req, res, a, b);
    }
});

function equippedSellAllSession(req, res, webItemCount, sellItemValue) {
    sellAllItems(req, res, webItemCount, sellItemValue);
    req.session.sellalltimer = Date.now() + 500;
}


app.post('/equipped/equip', function(req, res, next) {
    var iid = req.body.equip;
    makeEquipButtonsDisabled(req, res, iid)
    if (req.session.equippedtimer) {
        if (req.session.equippedtimer < Date.now()) {
            if (iid) {
                inventoryEquipSession(iid, req, res);
            }
        } else {
            res.redirect('/equipped');
        }
    } else {
        inventoryEquipSession(iid, req, res);
    }
});

function makeEquipButtonsDisabled(req, res, iid) {
    for (var i = 0; i < req.session.equipped.length; i++) {
        if (req.session.equipped[i].item_id == iid) {
            req.session.equipped[i].disabled = 'true';
        }
    }
}

function makeEquipButtonsAllDisabled(req, res) {
    req.session.allbuttonsdisabled = 'true';
}

function inventoryEquipSession(iid, req, res) {
    connection.query("SELECT user_id FROM TwitchHeroes.users WHERE login=?;", [req.user.username], function(error, rows, fields) {
        if (error) {
            console.log('Error in query inventoryEquipSession');
            res.redirect('/equipped');
        } else {
            var uid = rows[0].user_id;
            req.session.equippedtimer = Date.now() + 2000;
            getItemTypeInventory(uid, iid, req, res);
            res.redirect('/equipped');
        }
    });
}

//get the type of the item beeing equipped
function getItemTypeInventory(uid, iid, req, res) {
    var post = [parseInt(uid), parseInt(iid)];
    connection.query("SELECT i.armor_type FROM TwitchHeroes.users u JOIN TwitchHeroes.inventoryItems ei ON ei.user_id = u.user_id JOIN TwitchHeroes.items i ON i.item_id = ei.item_id WHERE u.user_id = ? and ei.item_id = ? limit 1;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query getItemTypeInventory');
        } else {
            if (typeof rows[0] != undefined && rows[0]) {
                if (typeof rows[0].armor_type != undefined && rows[0].armor_type) {
                    getItemEquippedWithArmorType(uid, rows[0].armor_type, iid);
                }
            } else {
                if (req && res) {
                    res.redirect('equipped');
                }
            }
        }
    });
}

//get id of that type from equipped
function getItemEquippedWithArmorType(uid, armor_type, iid) {
    var post = [parseInt(armor_type), parseInt(uid)];
    connection.query("SELECT i.item_id FROM TwitchHeroes.users u JOIN TwitchHeroes.equippedItems ei ON ei.user_id = u.user_id JOIN TwitchHeroes.items i ON i.item_id = ei.item_id WHERE i.armor_type=? AND u.user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in  getItemEquippedWithArmorType');
        } else {
            if (rows[0] != null) {
                var equippedID = rows[0].item_id;
                //delete item of that type from equipped
                deleteItemFromEquipped(uid, equippedID);
                //insert deleted item from equipped into inventory
                insertItemIntoInventory(uid, equippedID);
            }
            if (parseInt(iid) >= 0) {
                deleteItemFromInventory(uid, iid);
                insertItemIntoEquipped(uid, iid);
            }
        }
    });
}

function deleteItemFromEquipped(uid, iid) {
    var post = [parseInt(uid), parseInt(iid)];
    connection.query('DELETE FROM TwitchHeroes.equippedItems WHERE user_id=? AND item_id=?;', post, function(error, rows, fields) {
        if (error) {
            console.log('Error in deleteItemFromEquipped');
            res.redirect('/equipped');
        }
    });
}

function deleteItemFromInventory(uid, iid) {
    var post = [parseInt(uid), parseInt(iid)];
    if (typeof iid != 'undefined')
        connection.query('DELETE FROM TwitchHeroes.inventoryItems WHERE user_id=? AND item_id=?;', post, function(error, rows, fields) {
            if (error) {
                console.log('Error in deleteItemFromInventory');
                res.redirect('/equipped');
            }
        });
}

function sellAllItems(req, res, webItemCount, sellItemValue) {
    var queryItemCount;
    var sql = "SELECT COUNT(*) 'ti' FROM TwitchHeroes.inventoryItems WHERE user_id=? AND item_id != 0";
    connection.query(sql, [req.session.user_id], function(error, totalItems, fields) {
        if (error) {
            console.log("Error In Query in sellAllItems: " + sql);
            res.redirect('/equipped');
        } else {
            queryItemCount = totalItems[0].ti;
            sell(req, res, totalItems[0].ti, webItemCount, sellItemValue);
        }
    });
    res.redirect('/equipped');
}

function sell(req, res, queryItemCount, webItemCount, sellItemValue) {
    var upper = webItemCount + 5;
    var lower = webItemCount - 5;
    if (queryItemCount < upper && queryItemCount > lower) {
        connection.query('DELETE FROM TwitchHeroes.inventoryItems WHERE user_id=?;', [req.session.user_id], function(error, rows, fields) {
            if (error) {
                console.log('Error in sell');
                res.redirect('/equipped');
            } else {
                if (req.session.equipped.sellall != 'true') {
                    req.session.equipped.sellall = 'true';
                    addGold(req, res, sellItemValue);
                }
            }
        });
    }
}

function insertItemIntoInventory(uid, iid) {
    var post = {
        user_id: parseInt(uid),
        item_id: parseInt(iid)
    };
    connection.query('INSERT INTO TwitchHeroes.inventoryItems SET ?;', post, function(error, rows, fields) {
        if (error) {
            console.log('Error in items into inventory');
            res.redirect('/equipped');
        }
    });
}

function insertItemIntoEquipped(uid, iid) {
    var post = {
        user_id: parseInt(uid),
        item_id: parseInt(iid)
    };
    connection.query('INSERT INTO TwitchHeroes.equippedItems SET ?;', post, function(error, rows, fields) {
        if (error) {
            console.log(query.sql);
            res.redirect('/equipped');
        }
    });
}

function addGold(req, res, gold) {
    var post = [parseInt(gold), req.user.username];
    connection.query("UPDATE TwitchHeroes.users SET gold = gold + ? WHERE login = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query addGold');
        }
    });
}