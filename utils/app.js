/*
	Module: app.js - app setup module
	Version: 1.0 - 2017-05-20

	Copyright: Twitch-heroes.com, 2017 all rights reserved
	Authors: Ryan Kinsella, Clayton Munger
	Site: twitch-heroes.com
*/
var web = require('../librairies/imports');
var app = module.exports = web.express();

app.set('port', process.env.PORT || web.config.port);
app.engine('ejs', web.ejslocals);
app.set('views', __dirname + '/../views');
app.set('view engine', 'ejs');
app.use(web.favicon(__dirname + '/../public/images/twitchicon.png'));
app.use(web.cookieparser(web.config.cookieSecret));
app.use(web.bodyparser());
app.use(web.method());

var session = web.session({
    store: new web.mongosession({
        url: web.config.mongoURL,
        maxAge: web.config.sessionMaxAge,
    }),
    secret: web.config.sessionSecret
});

app.use(session);
app.use(web.passport.initialize());
app.use(web.passport.session());
app.use(web.express.static(web.path.join(__dirname + '/../public')));

//export app
module.exports = app;