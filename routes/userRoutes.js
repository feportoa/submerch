const fetch = require('node-fetch');

const express = require('express');
const { pgQuery } = require('../db.js');

const router = express.Router()

router.get('/api/hello', (req, res) => {
    res.json({message: "Hallo Welt!"})
});

router.get('/api/allUsers', async (req, res) => {
    try {
        const sql = "SELECT * FROM users;"
        const test = await pgQuery(sql);
        return res.json(test);
    } catch (err) {
        console.error("Error fetching users: " + err);
        res.status(500).json( { error: `Internal server error: ${err}`} );
    }
});

router.post('/api/postUser', async (req, res) => {
    try {
        const userReq = req.body;
        const userAlreadyExists = await userExists(userReq.email);

        let sql = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
        let queryValues = [userReq.name, userReq.email, userReq.password];

        if (!userAlreadyExists) {
            await pgQuery(sql, queryValues);
    
            return res.status(200).json("User created successfuly.");
        } else
            throw new Error("User already exists.");
    } catch (err) {
        console.error(err);
        res.status(500).json( { error: `Internal server error: ${err.message}`} );
    }
});

async function userExists(email) {
    try {
        let sql = 'SELECT * FROM users WHERE email = $1;';
        let queryValues = [email];
        
        const user = await pgQuery(sql, queryValues);
        return user.length > 0; // Returns true if exists
    } catch (err) {
        console.error(`Error in getUser function: ${err}`);
        throw err;
    }
}

module.exports = router;