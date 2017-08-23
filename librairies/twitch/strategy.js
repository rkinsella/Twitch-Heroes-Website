var ul = require('util'),
	os = require('passport-oauth').OAuth2Strategy,
	ie = require('passport-oauth').InternalOAuthError;

function Strategy(options, verify) {
	options = options || {};
	options.authorizationURL = options.authorizationURL || 'https://api.twitch.tv/kraken/oauth2/authorize';
	options.tokenURL = options.tokenURL || 'https://api.twitch.tv/kraken/oauth2/token';
	
	os.call(this, options, verify);
	this.name = 'twitch';
	
	this._oauth2.setAuthMethod('OAuth');
	this._oauth2.useAuthorizationHeaderforGET(true);
}

//Inherit from "os".
ul.inherits(Strategy, os);

/**
 * Retrieve the profile from Twitch.
 */
Strategy.prototype.userProfile = function(accessToken, done) {
	this._oauth2.get('https://api.twitch.tv/kraken/user', accessToken, function (err, body, res) {
		if (err) { return done(new ie('failed to fetch user profile', err)); }
		
		try {
			var json = JSON.parse(body);

			var profile = { provider: 'twitch'};
			profile.id = json._id;
			profile.username = json.name;
			profile.email = json.email;
			profile._raw = body;
			profile._json = json;

			done(null, profile);
		} catch(e) {
			done(e);
		}
	});
};

module.exports = Strategy;
