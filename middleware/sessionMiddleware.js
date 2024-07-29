const env = require('../.env/secret.json');
const session = require('express-session');

const sessionMiddleware = session({
    secret: env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,    
    cookie: { secure: false } // Change to true when using HTTPS
});

module.exports = sessionMiddleware;