/*
    Module: rank.js - Controller for rank module
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

//######################Rank##########################
app.get('/ranking', function(req, res) {
    //if user is authenticated
    if (req.user) {
        //if no session make one and render it there
        if (!req.session.rankingexpire) {
            updateRankingSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.rankingexpire < Date.now()) {
                updateRankingSession(req, res);
            } else {
                //if a session does exist, render here
                res.render('ranking', {
                    user: req.user,
                    rows: req.session.ranking,
                    page_name: 'ranking',
                    tab_name: 'level'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateRankingSession(req, res) {
    var sql = "SELECT login, exp, numtimes_rebirthed, "
            + "SUM(i.damage) + 5 + FLOOR((16/3)*LOG10(u.exp)) + SUM(i.mindamage) + SUM(i.strength) + SUM(i.intelligence) + SUM(i.dexterity) as minDamage, "
            + "SUM(i.damage) + 5 + FLOOR((16/3)*LOG10(u.exp)) + SUM(i.maxdamage) + SUM(i.strength) + SUM(i.intelligence) + SUM(i.dexterity) as maxDamage, "
            + "SUM(i.crit) as totalCrit,  SUM(i.lifesteal) as totalLifesteal, "
            + "SUM(i.health) + 50 + FLOOR(32*LOG10(u.exp)) as totalHealth, player_kills,  "
            + "SUM(CASE WHEN i.armor_type = 1 OR i.armor_type = 2 OR i.armor_type = 3 OR i.armor_type = 8 THEN i.item_level ELSE 0 END) + SUM(i.armor)  as totalArmor "
            + "FROM TwitchHeroes.equippedItems ei "
            + "JOIN TwitchHeroes.items i ON i.item_id = ei.item_id "
            + "INNER JOIN TwitchHeroes.users u "
            + "ON u.user_id = ei.user_id "
            + "GROUP BY ei.user_id "
            + "ORDER BY exp desc;";
    connection.query(sql, function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateRankingSession');
            res.render('ranking', {
                user: req.user
            });
        } else {
            req.session.ranking = rows;
            req.session.rankingexpire = Date.now() + 2500;
            res.render('ranking', {
                user: req.user,
                rows: rows,
                page_name: 'ranking',
                tab_name: 'level'
            });
        }
    });
}

app.post('/ranking', function(req, res, next) {

    renderRank(req.body.tab, req, res);

});


function renderRank(tab, req, res) {
     res.render('ranking', {
                user: req.user,
                rows: req.session.ranking,
                page_name: 'ranking',
                tab_name: tab
            });
}