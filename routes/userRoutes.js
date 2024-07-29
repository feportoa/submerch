const bcrypt = require('bcrypt');
const express = require('express');
const { pgQuery } = require('../utils/db.js');

const router = express.Router()

router.get('/', /*authenticateToken, authorizeRole('ADMIN'),*/ async (req, res, next) => {
    try {
    } catch (err) {
        next(err);
    }
});

router.get('/all', authenticateToken, authorizeRole('ADMIN'), async (req, res, next) => {
    try {
        const sql = "SELECT * FROM users;"
        const queryRes = await pgQuery(sql);
        return res.json(queryRes);
    } catch (err) {
        next(err);
    }
});

// TODO: Validate authentication in other routes
router.post('/login', async (req, res, next) => {
    try {
        
        const userData = req.body;

        const user = await userExists(userData.email);
        if(!user) return res.status(401).json({ message: 'Authentication failed' });

        const passwordMatch = await bcrypt.compare(userData.password, user[0].password);
        if(!passwordMatch) return res.status(401).json({ message: 'Authentication failed' });

        const roleLevels = {
            'ADMIN': 3,
            'MANUFACTURER': 2,
            'CLIENT': 1
        }

        const userId = user[0].id;
        const roleLevel = roleLevels[user[0].user_type];

        const token = jwt.sign({ userId, roleLevel }, env.JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({ token });
    } catch (err) {
        next(err);
    }
});


router.post('/addUser', async (req, res, next) => {
    try {
        const userReq = req.body;
        const userData = await userExists(userReq.email);
        
        // Check if user already exists
        if (userData.length > 0) return res.status(400).json({ message: "UNAUTHORIZED: User already exists." });

        const hashedPassword = await hashPassword(userReq.password);
        let sql
        let queryValues = []

        // Check if user_type field is filled and formats sql and query values
        if (!userReq.user_type){
            sql = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
            queryValues = [userReq.name, userReq.email, hashedPassword];
        } 
        else {
            sql = 'INSERT INTO users (name, email, password, user_type) VALUES ($1, $2, $3, $4)';
            queryValues = [userReq.name, userReq.email, hashedPassword, userReq.user_type];
        }
        
        await pgQuery(sql, queryValues);

        return res.status(201).json({ message: "User created successfuly." });
    } catch (err) {
        next(err);
    }
});

router.delete('/removeUser', async (req, res, next) => {
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
        next(err);
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

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    
    return new Promise((resolve, reject) => {
        bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
            if (err) reject(err);
            resolve(hash);
        });
    });
}

module.exports = router;