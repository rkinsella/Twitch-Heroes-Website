/*
	Module: account.js - Controller for lookup module
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
app.get('/lookup', function(req, res) {
    //if user is authenticated
    if (req.user) {

        if (!req.session.lookup) {
        res.render('lookup', {
                user: req.user,
                page_name: 'lookup',
                rows: null
            });
        } else {
            res.render('lookup', {
                user: req.user,
                page_name: 'lookup',
                rows: req.session.lookup
            });
        }
    } else {
        res.redirect('/');
    }
});

app.get('/lookup/herolookup', function(req, res) {
    //if user is authenticated
    if (req.user) {
        var login = req.query['login'];

        console.log(login);
        lookUpUser(login, req, res);
    } else {
        res.redirect('/');
    }
});

//Grabs user stats and updates the session
function lookUpUser(login, req, res) {
    var sql = "SELECT u.exp, u.gold, u.monster_kills, u.deaths, u.class, u.player_kills, "
            + "SUM(i.damage) + 5 + FLOOR((16/3)*LOG10(u.exp)) + SUM(i.mindamage) + SUM(i.strength) + SUM(i.intelligence) + SUM(i.dexterity) + IF(t.strength IS NULL,0,t.strength) + IF(t.dexterity IS NULL,0,t.dexterity) + IF(t.intelligence IS NULL,0,t.intelligence) as minDamage, "
            + "SUM(i.damage) + 5 + FLOOR((16/3)*LOG10(u.exp)) + SUM(i.maxdamage) + SUM(i.strength) + SUM(i.intelligence) + SUM(i.dexterity) + IF(t.strength IS NULL,0,t.strength) + IF(t.dexterity IS NULL,0,t.dexterity) + IF(t.intelligence IS NULL,0,t.intelligence) as maxDamage, "
            + "SUM(i.crit) + IF(t.crit IS NULL,0,t.crit) as totalCrit, "
            + "SUM(i.lifesteal) + IF(t.lifesteal IS NULL,0,t.lifesteal) as totalLifesteal, "
            + "SUM(i.health) + 50 + FLOOR(32*LOG10(u.exp)) + IF(t.health IS NULL,0,t.health*100) as totalHealth, "
            + "SUM(i.strength) + IF(t.strength IS NULL,0,t.strength) as totalStrength, "
            + "SUM(i.dexterity) + IF(t.dexterity IS NULL,0,t.dexterity) as totalDexterity, "
            + "SUM(i.intelligence) + IF(t.intelligence IS NULL,0,t.intelligence) as totalIntelligence, "
            + "SUM(CASE WHEN i.armor_type = 1 OR i.armor_type = 2 OR i.armor_type = 3 OR i.armor_type = 8 THEN i.item_level ELSE 0 END) + SUM(i.armor) + IF(t.armor IS NULL,0,t.armor) as totalArmor "
            + "FROM TwitchHeroes.users u LEFT JOIN TwitchHeroes.equippedItems ei ON ei.user_id = u.user_id "
            + "LEFT JOIN TwitchHeroes.items i ON i.item_id = ei.item_id "
            + "LEFT JOIN TwitchHeroes.talents t ON t.user_id = u.user_id "
            + "WHERE u.login = ?;";

    connection.query(sql, login, function(error, rows, fields) {
        if (error) {
            console.log('Error in query lookUpUser');
            res.render('lookup', {
                user: req.user,
                page_name: 'lookup',
                rows: ''
            });
        } else {
            console.log(rows);
            if (rows.length > 0) {
                req.session.lookup = rows;
            }
            
            res.redirect('/lookup');  
        }
    });
}