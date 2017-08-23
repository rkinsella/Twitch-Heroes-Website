/*
	Module: Stats.js - Controller for stats module
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

//######################STATS##########################
app.get('/stats', function(req, res) {
    //if user is authenticated
    if (req.user) {
        updateStatsSession(req, res);
    } else {
        res.redirect('/');
    }
});

//Grabs user stats and updates the session
function updateStatsSession(req, res) {
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
            + "WHERE u.user_id = ?;";

    connection.query(sql, [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateStatsSession');
            res.render('stats', {
                user: req.user,
                page_name: 'stats'
            });
        } else {
            getRank(req, res, rows, function(err, req, res, rows) {
                if (err) {
                    console.log('Error with getRank');
                }
                req.session.stats = rows;
                if (Number.isInteger(rows.rank)) {
                    req.session.stats.rank = rows.rank;
                } else {
                    rows.rank = req.session.stats.rank;
                }
                req.session.statsexpire = Date.now() + 5000;
                res.render('stats', {
                    user: req.user,
                    rows: req.session.stats,
                    page_name: 'stats'
                });
            });
        }
    });
}

//Gathers the rank of the user
function getRank(req, res, rows, callback) {
    var sql = "SELECT user_id FROM users ORDER BY exp DESC";
    connection.query(sql, function(error, users, fields) {
        if (error) {
            console.log('Error in query' + error);
            callback(new Error("An error has occured"));
        } else {
            rows.rank = (users.map(function(e) {
                return e.user_id;
            }).indexOf(req.session.user_id) + 1);
            callback(null, req, res, rows);
        }
    });
}