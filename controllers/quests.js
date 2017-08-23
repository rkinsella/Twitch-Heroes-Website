/*
	Module: account.js - Controller for quests module
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
app.get('/quests', function(req, res) {
    //if user is authenticated
    if (req.user) {
       //if no session make one and render it there
        if (!req.session.quests) {
            updateQuestSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.questsexpire < Date.now()) {
                updateQuestSession(req, res);
            } else {
                //if a session does exist, render here
                res.render('quests', {
                    user: req.user,
                    rows: req.session.quests,
                    page_name: 'quests'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateQuestSession(req, res) {
    var post = [parseInt(req.session.user_id), parseInt(req.session.user_id)];

    var sql =   "SELECT q.quest_id,'Available', q.name, q.description, q.type, 'progress',q.goal,q.repeatable, q.reward, 'status' "
                + "FROM TwitchHeroes.quests q "
                + "WHERE NOT EXISTS "
                + "( "
                + "    SELECT 1 "
                + "    FROM TwitchHeroes.quest_log ql "
                + "    WHERE q.quest_id = ql.quest_id and ql.user_id = ? "
                + ") "
                + "UNION "
                + "SELECT q.quest_id,'Active',q.name, q.description, ql.type, ql.progress,q.goal,q.repeatable, q.reward, ql.completed "
                + "FROM TwitchHeroes.quests q "
                + "JOIN TwitchHeroes.quest_log ql  "
                + "WHERE ql.user_id = ? and ql.quest_id = q.quest_id;"
    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateQuestsSession');
            res.redirect('quests');
        } else {
            req.session.quests = rows;
            req.session.questsexpire = Date.now() + 250;
            res.render('quests', {
                user: req.user,
                rows: rows,
                page_name: 'quests'
            });
        }
    });
}

app.post('/quests/acceptquest', function(req, res, next) {
    insertIntoActiveQuests(req.body.acceptquest, req, res);
});

function insertIntoActiveQuests (questID, req, res) {
    var sql = "INSERT INTO quest_log (user_id, quest_id, type, goal) "
                + "SELECT ?, ?, q.type, q.goal "
                + "FROM quests q "
                + "WHERE q.quest_id = ?"

    var post = [parseInt(req.session.user_id), parseInt(questID), parseInt(questID)];

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log(connection.query);
            console.log('Error in query insertIntoActiveQuests');
            res.redirect('/quests');
        } else {
            res.redirect('/quests');
        }
    });
}

app.post('/quests/completequest', function(req, res, next) {
    var questID = req.body.completequest;
     for (var i=0; i<req.session.quests.length; i++) {
        var status = req.session.quests[i].status;

        if (parseInt(status) == 0 && parseInt(req.session.quests[i].quest_id) == questID) {
            req.session.quests[i].status = 1;
            getQuestReward(req, res, questID);
        }

        if (parseInt(status) != 0 && parseInt(req.session.quests[i].quest_id) == questID) {
            res.redirect('/quests');
        }
         
    }
});

function getQuestReward (req, res, questID) {
    var sql = "SELECT reward FROM TwitchHeroes.quests WHERE quest_id = ?;"
    var post = [parseInt(questID)];

    connection.query(sql, post, function(error, rows, fields) {
        if (error) {
            console.log(connection.query);
            console.log('Error in query getQuestReward');
            res.redirect('/quests');
        } else {
           
            if (parseInt(rows[0].reward) == 10000) {
                addGold(req, res, questID, rows[0].reward);
            }

            if (parseInt(rows[0].reward) == 1) {
                addKey(req, res, questID);
            }
            
        }
    });
}

function addGold(req, res, questID, gold) {
    var post = [parseInt(gold), req.user.username];
    connection.query("UPDATE TwitchHeroes.users SET gold = gold + ? WHERE login = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query addGold');
        }

        else {
            deleteQuestFromActive(req, res, questID);
        }
    });
}

function addKey(req, res, questID) {
    var post = [req.user.username];
    connection.query("UPDATE TwitchHeroes.users SET num_keys = num_keys + 1 WHERE login = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query addKey');
        }

        else {
            deleteQuestFromActive(req, res, questID);
        }
    });
}

function deleteQuestFromActive(req, res, questID) {
    var post = [parseInt(req.session.user_id), parseInt(questID)];
    connection.query("DELETE FROM TwitchHeroes.quest_log WHERE user_id = ? AND quest_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query deleteQuestFromActive');
        }

        else {
            res.redirect('/quests');
        }
    });
}