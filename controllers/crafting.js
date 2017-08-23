/*
	Module: account.js - Controller for crafting module
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
app.get('/crafting', function(req, res) {
     //if user is authenticated
    if (req.user) {
        //if no stats session make one and render it there
        if (!req.session.crafting) {
            updateCraftingSession(req, res);
        } else {
            //if the session is expired, query again
            if (req.session.craftingexpire < Date.now()) {
                updateCraftingSession(req, res);
            } else {
                //if a crafting session does exist, render here
                res.render('crafting', {
                    user: req.user,
                    rows: req.session.crafting,
                    page_name: 'crafting'
                });
            }
        }
    } else {
        res.redirect('/');
    }
});

function updateCraftingSession(req, res) {
	connection.query("SELECT crafting_exp, stone, wood, gold "
					+ "FROM TwitchHeroes.users "
					+ "WHERE user_id = ?;", [req.session.user_id], function(error, rows, fields) {
        if (error) {
            console.log('Error in query updateCraftingSession');
            res.render('crafting', {
                user: req.user,
                page_name: 'crafting'
            });
        } else {
            req.session.crafting = rows;
            req.session.craftingexpire = Date.now() + 250;
            renderCrafting (req, res)
        }
    });
}

app.get('/crafting/ring', function(req, res, next) {
	var amount = req.query['amount'];
	var item_level = req.query['craft'];


	if (amount == '') {
        amount = 1;
    }

    if (parseInt(amount) <= 0) {
    	amount = 1;
    }

     //if user is authenticated
    if (req.user) {
       	createMultipleItems(amount, item_level, 10, req, res);
       	res.redirect('/crafting');
    } else {
        res.redirect('/');
    }

});

app.get('/crafting/necklace', function(req, res, next) {
	var amount = req.query['amount'];
	var item_level = req.query['craft'];

	if (amount == '') {
        amount = 1;
    }

    if (parseInt(amount) <= 0) {
    	amount = 1;
    }
     //if user is authenticated
    if (req.user) {
       	createMultipleItems(amount, item_level, 11, req, res);
       	res.redirect('/crafting');
    } else {
        res.redirect('/');
    }

});

function createMultipleItems(amount, item_level, armor_type, req, res) {

	var craftingLevel = Math.floor(Math.sqrt(req.session.crafting[0].crafting_exp));
	var stone = req.session.crafting[0].stone;
	var wood = req.session.crafting[0].wood;
	var gold = req.session.crafting[0].gold;

	var craft = false;

	//check if unsufficient funds 
	if (armor_type == 10 || armor_type == 11) {
		if (parseInt(item_level) == 1 && gold >= 100*amount && wood >= 3*amount && stone >= 3*amount) {
			craft = true;
		}

		if (parseInt(item_level) == 2 && gold >= 200*amount && wood >= 6*amount && stone >= 6*amount && craftingLevel >= 10) {
			craft = true;
		}

		if (parseInt(item_level) == 3 && gold >= 300*amount && wood >= 9*amount && stone >= 9*amount && craftingLevel >= 20) {
			craft = true;
		}

		if (parseInt(item_level) == 4 && gold >= 400*amount && wood >= 12*amount && stone >= 12*amount && craftingLevel >= 30) {
			craft = true;
		}

		if (parseInt(item_level) == 5 && gold >= 500*amount && wood >= 15*amount && stone >= 15*amount && craftingLevel >= 40) {
			craft = true;
		}

		if (parseInt(item_level) == 6 && gold >= 1000*amount && wood >= 18*amount && stone >= 18*amount && craftingLevel >= 50) {
			craft = true;
		}

		if (parseInt(item_level) == 7 && gold >= 1500*amount && wood >= 21*amount && stone >= 21*amount && craftingLevel >= 60) {
			craft = true;
		}

		if (parseInt(item_level) == 8 && gold >= 2500*amount && wood >= 25*amount && stone >= 25*amount && craftingLevel >= 70) {
			craft = true;
		}
	}

	if (craft == true) {
		for (var i=0; i < amount; i++) {
			createItem(item_level, armor_type, req, res);
		}
	}

	if (craft == false) {
		res.redirect('/crafting');
	}
}

function createItem(item_level, armor_type, req, res) {

	var damage = 0;
	var health = 0;
	var armor = 0;
	var crit = 0;
	var lifesteal = 0;

	var stat1 = 0;
	var stat2 = 0;
	var stat3 = 0;

	// quality roll random 1 to 10
	var qualityRoll = Math.floor(Math.random() * 10 + 1);  
	
	var quality;

	if (parseInt(qualityRoll) <= 3) {
		quality = 1;
	}

	else if (parseInt(qualityRoll) <= 6) {
		quality = 2;
	}

	else if (parseInt(qualityRoll) <= 9 ) {
		quality = 3;
	}

	if (parseInt(qualityRoll) == 10) {
		quality = 4;
	}
	

	// stat random 1 to 5
	var stat1 = Math.floor(Math.random() * 5 + 1);  
	var stat2 = Math.floor(Math.random() * 5 + 1);  
	var stat3 = Math.floor(Math.random() * 5 + 1);  
	
	while (stat1 == stat2) {
		stat2 = Math.floor(Math.random() * 5 + 1);  
	}

	while (stat1 == stat3 || stat2 == stat3 ) {
		stat3 = Math.floor(Math.random() * 5 + 1);  
		
	}

	if (parseInt(quality) == 1) {

		switch (stat1) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 1); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*40 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 3); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 1); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 1); 
				break;
			default:
				break;
		}
	}

	if (parseInt(quality) == 2) {
		switch (stat1) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 1); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*40 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 3); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 1); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 1); 
				break;
			default:
				break;
		}

		switch (stat2) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 1); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*40 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 3); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 1); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 1); 
				break;
			default:
				break;
		}
	}

	if (parseInt(quality) == 3) {
		switch (stat1) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 1); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*40 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 3); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 1); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 1); 
				break;
			default:
				break;
		}

		switch (stat2) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 1); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*40 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 3); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 1); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 1); 
				break;
			default:
				break;
		}

		switch (stat3) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 1); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*40 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 3); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 1); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 1); 
				break;
			default:
				break;
		}
	}

	if (parseInt(quality) == 4) {
		switch (stat1) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 3); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*50 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 4); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 3); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 2); 
				break;
			default:
				break;
		}

		switch (stat2) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 3); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*50 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 4); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 3); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 2); 
				break;
			default:
				break;
		}

		switch (stat3) {
			case 1:
				damage = Math.floor(Math.random() * item_level*3 + 3); 
				break;
			case 2:
				health = Math.floor((Math.random() * item_level+ 1)*50 + 1); 
				break;
			case 3:
				armor = Math.floor(Math.random() * item_level + 4); 
				break;
			case 4:
				crit = Math.floor((Math.random() * item_level + 1)*2 + 3); 
				break;
			case 5:
				lifesteal = Math.floor(Math.random() * item_level + 2); 
				break;
			default:
				break;
		}
	}

	if (armor_type == 10) {
		if (parseInt(item_level) == 1) {
			insertItemIntoDB (armor_type, item_level, 'Wooden Ring', quality, damage, health, armor, crit, lifesteal, -3, -3, -100, req, res);
		}
	
		if (parseInt(item_level) == 2) {
			insertItemIntoDB (armor_type, item_level, 'Iron Ring', quality, damage, health, armor, crit, lifesteal, -6, -6, -200, req, res);
		}

		if (parseInt(item_level) == 3) {
			insertItemIntoDB (armor_type, item_level, 'Steel Ring', quality, damage, health, armor, crit, lifesteal, -9, -9, -300, req, res);
		}


		if (parseInt(item_level) == 4) {
			insertItemIntoDB (armor_type, item_level, 'Gold Ring', quality, damage, health, armor, crit, lifesteal, -12, -12, -400, req, res);
		}


		if (parseInt(item_level) == 5) {
			insertItemIntoDB (armor_type, item_level, 'Diamond Ring', quality, damage, health, armor, crit, lifesteal, -15, -15, -500, req, res);
		}


		if (parseInt(item_level) == 6) {
			insertItemIntoDB (armor_type, item_level, 'Emerald Ring', quality, damage, health, armor, crit, lifesteal, -18, -18, -1000, req, res);
		}


		if (parseInt(item_level) == 7) {
			insertItemIntoDB (armor_type, item_level, 'Ruby Ring', quality, damage, health, armor, crit, lifesteal, -21, -21, -1500, req, res);
		}

		if (parseInt(item_level) == 8) {
			insertItemIntoDB (armor_type, item_level, 'Sapphire Ring', quality, damage, health, armor, crit, lifesteal, -25, -25, -2500, req, res);
		}

	}

	if (armor_type == 11) {
		if (parseInt(item_level) == 1) {
			insertItemIntoDB (armor_type, item_level, 'Wooden Necklace', quality, damage, health, armor, crit, lifesteal, -3, -3, -100, req, res);
		}
	
		if (parseInt(item_level) == 2 ) {
			insertItemIntoDB (armor_type, item_level, 'Iron Necklace', quality, damage, health, armor, crit, lifesteal, -6, -6, -200, req, res);
		}

		if (parseInt(item_level) == 3) {
			insertItemIntoDB (armor_type, item_level, 'Steel Necklace', quality, damage, health, armor, crit, lifesteal, -9, -9, -300, req, res);
		}

		if (parseInt(item_level) == 4) {
			insertItemIntoDB (armor_type, item_level, 'Gold Necklace', quality, damage, health, armor, crit, lifesteal, -12, -12, -400, req, res);
		}

		if (parseInt(item_level) == 5) {
			insertItemIntoDB (armor_type, item_level, 'Diamond Necklace', quality, damage, health, armor, crit, lifesteal, -15, -15, -500, req, res);
		}

		if (parseInt(item_level) == 6) {
			insertItemIntoDB (armor_type, item_level, 'Emerald Necklace', quality, damage, health, armor, crit, lifesteal, -18, -18, -1000, req, res);
		}

		if (parseInt(item_level) == 7) {
			insertItemIntoDB (armor_type, item_level, 'Ruby Necklace', quality, damage, health, armor, crit, lifesteal, -21, -21, -1500, req, res);
		}

		if (parseInt(item_level) == 8) {
			insertItemIntoDB (armor_type, item_level, 'Sapphire Necklace', quality, damage, health, armor, crit, lifesteal, -25, -25, -2500, req, res);
		}
		
	}

}

function insertItemIntoDB (armor_type, item_level, item_name, quality, damage, health, armor, crit, lifesteal, stone, wood, gold, req, res) {
	var post = [parseInt(armor_type), item_name, parseInt(item_level), parseInt(quality), parseInt(damage), parseInt(health), parseInt(armor), parseInt(crit), parseInt(lifesteal)];
	connection.query("INSERT INTO TwitchHeroes.items ( "
					+ "armor_type, item_name, item_level,quality,damage,health,armor,crit,lifesteal) "
					+ "Values (?, ?, ?, ?, ?, ?, ?, ?, ?) ", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query insertNewRing');
            renderCrafting (req, res);
        } else {
			insertItemIntoInventory(rows.insertId, item_level, stone, wood, gold, req, res);
        }
    });
}

function insertItemIntoInventory (item_id, item_level, stone, wood, gold, req, res) {
	var post = [parseInt(req.session.user_id), parseInt(item_id)];
	connection.query("INSERT INTO TwitchHeroes.inventoryItems ( "
					+ "user_id, item_id) "
					+ "Values (?,?) ", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query insertRingIntoInventory');
            renderCrafting (req, res);
        } else {
        	addCraftingEXPStoneWood(req, res, item_level, stone, wood, gold)
			
        }
    });
}

function addCraftingEXPStoneWood(req, res, item_level, stone, wood, gold) {

    var post = [parseInt(item_level), parseInt(stone), parseInt(wood),  parseInt(gold), req.user.username];
    connection.query("UPDATE TwitchHeroes.users SET crafting_exp = crafting_exp + ?, stone = stone + ?, wood = wood + ?, gold = gold + ? WHERE login = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query addCraftingEXP');
        }

        else {
        	//remove the resources from the session to prevent abuse
			req.session.crafting[0].gold =  req.session.crafting[0].gold - gold;
			req.session.crafting[0].stone =  req.session.crafting[0].stone - stone;
			req.session.crafting[0].wood =  req.session.crafting[0].wood - wood;
        }
    });
}

function renderCrafting (req, res) {
	res.render('crafting', {
                user: req.user,
                rows: req.session.crafting,
                page_name: 'crafting'
            });
}

app.get('/crafting/convert', function(req, res) {
    //if user is authenticated
    if (req.user) {
        assignCraftingVariables(req, res);
        
    } else {
        res.redirect('/');
    }
});

function assignCraftingVariables(req, res) {
	var resource = req.query.resource;
	var amount = req.query['amount'];
	var currentStone = req.session.crafting[0].stone;
	var currentWood = req.session.crafting[0].wood;
	var user_id = req.session.user_id;

	var newStone = 0;
	var newWood = 0;

	if (amount == '') {
        res.redirect('/crafting');
    }

    // stone is selected
    if (resource == '1' && parseInt(amount) > 0) {
    	newStone = amount * (-1);
    	newWood = amount/2;
    	
		if (parseInt(currentStone) >= parseInt(amount)) {
			convertResources(user_id, newStone, newWood, req, res);
		}

		if (parseInt(currentStone) < parseInt(amount)) {
			res.redirect('/crafting');
		}
   			
    }

    // wood is selected
    if (resource == '2' && parseInt(amount) > 0) {
    	newWood = amount * (-1);
    	newStone = amount/2;
    	
		if (parseInt(currentWood) >= parseInt(amount)) {
			convertResources(user_id, newStone, newWood, req, res);
		}

		if (parseInt(currentWood) < parseInt(amount)) {
			res.redirect('/crafting');
		}	
    }

}
 
function convertResources(user_id, stone, wood, req, res) {
	var post = [parseInt(stone), parseInt(wood), parseInt(user_id)];

	connection.query("UPDATE TwitchHeroes.users SET stone = stone + ?, wood = wood + ? WHERE user_id = ?;", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query convertResources');
            renderCrafting (req, res);
        } else {
        	res.redirect('/crafting');
			
        }
    });
}

function insertItemIntoInventory (item_id, item_level, stone, wood, gold, req, res) {
	var post = [parseInt(req.session.user_id), parseInt(item_id)];
	connection.query("INSERT INTO TwitchHeroes.inventoryItems ( "
					+ "user_id, item_id) "
					+ "Values (?,?) ", post, function(error, rows, fields) {
        if (error) {
            console.log('Error in query insertRingIntoInventory');
            renderCrafting (req, res);
        } else {
        	addCraftingEXPStoneWood(req, res, item_level, stone, wood, gold)
			
        }
    });
}