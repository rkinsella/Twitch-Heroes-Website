var session = require('express-session');

exports.bodyparser = require('body-parser');
exports.config = require('../config');
exports.cookieparser = require('cookie-parser');
exports.ejslocals = require('ejs-locals');
exports.express = require('express');
exports.favicon = require('serve-favicon');
exports.http = require('http');
exports.method = require('method-override');
exports.passport = require('passport');
exports.path = require('path');
exports.session = session;
exports.strategy = require('./twitch').Strategy;

// Connect-Mongo depends on Express-Session.
exports.mongosession = require('connect-mongo')(session);









