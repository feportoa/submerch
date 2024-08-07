const env = require('../.env/secret.json');
const session = require('express-session');

const sessionMiddleware = session({
    secret: env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,    
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 7, // Age: 7 days
        secure: env.NODE_ENV === 'production' // Change to true when on production (HTTPS instead of HTTP)
     } 
});

module.exports = sessionMiddleware;