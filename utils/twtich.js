/*
	Module: twitch.js - module for twitch passport
	Version: 1.0 - 2017-05-20

	Copyright: Twitch-heroes.com, 2017 all rights reserved
	Authors: Ryan Kinsella, Clayton Munger
	Site: twitch-heroes.com
*/
var web = require('../librairies/imports');

/**
 * Use this middleware to protect a page.
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
/**
 * Serialize / deserialize a user.
 */
web.passport.serializeUser(function(user, done) {
    done(null, user);
});

web.passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

/**
 * Use Twitch Strategy along with passport to retrieve the user's informations.
 */
web.passport.use(new web.strategy({
        clientID: web.config.clientID,
        clientSecret: web.config.clientSecret,
        callbackURL: web.config.callbackURL,
        scope: "user_read"
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
            return done(null, profile);
        });
    }
));