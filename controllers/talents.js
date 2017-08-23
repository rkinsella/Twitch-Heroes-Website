/*
	Module: talents.js - Controller for talents module
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

//######################Talents##########################

/*
	app.get('/talents', function(req, res){
		//if user is authenticated
		if (req.user) {
			
			//if no stats session make one and render it there
			if (!req.session.account) {
				updateAccountSession (req, res);
			}

			else {
				//if the session is expired, query again
				if (req.session.accountexpire < Date.now()) {
					
					updateAccountSession (req, res);
				}
				//if a stats session does exist, render here
				else
				res.render('account', { user: req.user, rows: req.session.account, page_name: 'account'});
			}
			
		}
		else 
    		res.redirect('/');
		
	});
*/