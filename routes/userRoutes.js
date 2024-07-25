const express = require('express');
const { pgQuery } = require('../utils/db.js');

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const sql = "SELECT * FROM users;"
        const queryRes = await pgQuery(sql);
        return res.json(queryRes);
    } catch (err) {
        console.error("Error fetching users: " + err);
        res.status(500).json( { message: `Internal server error: ${err}`} );
    }
});

router.post('/addUser', async (req, res) => {
    try {
        const userReq = req.body;
        const userData = await userExists(userReq.email);

        let sql = 'INSERT INTO users (name, email, password, user_type) VALUES ($1, $2, $3, $4)';
        let queryValues = [userReq.name, userReq.email, userReq.password, userReq.user_type];
        if (userData.length > 0) return res.status(400).json({ message: "UNAUTHORIZED: User already exists." });
            
        await pgQuery(sql, queryValues);

        return res.status(201).json({ message: "User created successfuly." });
    } catch (err) {
        console.error(err);
        res.status(500).json( { message: `Internal server error: ${err.message}`} );
    }
});

router.delete('/removeUser', async (req, res) => {
    try {
        const userReq = req.body;

        const userData = await userExists(userReq.email);

        // If user does NOT exists, returns
        if (!userData) return res.status(500).json({ message: `User \"${userReq.email}\" does not exists in database` });
        
        // If user has dependencies and haven't forceDeleted, returns
        const hasDependencies = await hasUploads(userData.id);
        if (hasDependencies && !userReq.forceDelete) return res.status(403).json({ message: "FORBIDDEN: Cannot delete user with uploads. Set forceDelete to true to override." });
        
        // If user forceDeletes the dependencies, continue
        const params = [userReq.email];
        const sql = "DELETE FROM users WHERE email = $1;"
        await pgQuery(sql, params);

        return res.status(204).json({ message: "User \"" + userReq.email + "\" deleted successfully" })
    } catch (err) {
        res.status(500).json({ message: "Internal server error: " + err.message });
    }
});

async function userExists(email) {
    /*
    * Checks if user exists in database
    * Returns an array with [userId, true] if exists, [null, false] otherwise
    */
    try {
        let sql = 'SELECT * FROM users WHERE email = $1;';
        let queryValues = [email];
        
        const user = await pgQuery(sql, queryValues);
        return user; // Returns true if exists
    } catch (err) {
        throw err;
    }
}

async function hasUploads(id) {
    try {
        const params = [id];
        
        let sql = "SELECT * FROM user_orders WHERE user_id = $1;";
        const user_orders = await pgQuery(sql, params);

        sql = "SELECT * FROM images WHERE uploader_id = $1;"
        const images = await pgQuery(sql, params);

        sql = "SELECT * FROM orders WHERE user_id = $1;"
        const orders = await pgQuery(sql, params);

        // If has relation, returns true
        return (user_orders.length > 0 || images.length > 0 || orders.length > 0); 
    } catch (err) {
        throw err;
    }
}

module.exports = router;