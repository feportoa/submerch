const express = require('express');
const { pgQuery } = require('../db.js');

const router = express.Router()

router.get('/hello', (req, res) => {
    res.json({message: "Hallo Welt!"})
});

router.get('/allUsers', async (req, res) => {
    try {
        const sql = "SELECT * FROM users;"
        const queryRes = await pgQuery(sql);
        return res.json(queryRes);
    } catch (err) {
        console.error("Error fetching users: " + err);
        res.status(500).json( { error: `Internal server error: ${err}`} );
    }
});

router.post('/addUser', async (req, res) => {
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

router.delete('/removeUser', async (req, res) => {
    try {
        const userReq = req.body;

        const params = [userReq.email];
        const sql = "DELETE FROM users WHERE email = $1;"
        await pgQuery(sql, params);

        return res.status(200).json("User \"" + userReq.email + "\" deleted successfully")
    } catch (err) {
        res.status(500).json("Internal server error: " + err.message);
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