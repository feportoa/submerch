const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');

const { pgQuery } = require('../utils/db.js');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware.js');
const env = require('../.env/secret.json');

const router = express.Router();

router.get('/', /*authenticateToken, authorizeRole('ADMIN'),*/ async (req, res, next) => {
    try {
        const User = class {
            constructor() {
                this.user = null,
                this.orders = null,
                this.products = null,
                this.images = null
            }
        };

        // TODO: Create user_images table and connect images with users in the images attribute here.
        const allSqlQueries = {
            user: `SELECT u.id,
                          u.name,
                          u.email,
                          u.user_type,
                          u.created_at
                   FROM users u;`,
            orders: `SELECT o.id AS order_id,
                            o.product_id,
                            o.order_price,
                            o.order_date
                    FROM orders o
                    JOIN users u ON u.id = o.user_id
                    WHERE u.id = $1;`,
            products: `SELECT p.id AS product_id,
                              p.uno,
                              p.name
                        FROM products p
                        JOIN orders o ON o.product_id = p.id
                        WHERE o.user_id = $1`,
            /*images: `SELECT i.id AS image_id,
                            i.url,
                            i.title,
                            i.description,
                            i.alt_text,
                            i.is_thumb,
                            i.file_name,
                            i.file_type
                    FROM images i WHERE i.uploader_id = $1;`*/
        }
        
        let userRes = await pgQuery(allSqlQueries.user);
        let resArr = [];
        
        for (let i = 0; i < userRes.length; i++) {
            let user = new User();
            user.user = userRes[i];
            
            user.orders = await pgQuery(allSqlQueries.orders, [userRes[i].id]);

            user.products = await pgQuery(allSqlQueries.products, [userRes[i].id]);
            
            resArr.push(user);
        };
        
        /*
        const sql = `SELECT u.id,
                        u.name,
                        u.email,
                        u.user_type,
                        u.created_at,
                        o.id AS order_id,
                        o.product_id,
                        o.order_price,
                        o.order_date,
                        p.id AS product_id,
                        p.uno,
                        p.name
                    FROM users u
                    JOIN user_orders uo ON uo.user_id = u.id
                    JOIN orders o ON o.user_id = u.id
                    JOIN products p ON o.product_id = p.id;`;

        queryRes = await pgQuery(sql);
        */
        return res.status(200).json(resArr);
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
        req.session.user = user;
        req.session.user.cart = { // Cart items data should be passed to the payment gateway
            items: {
                totalItems: 0,
                list: [
                    /*{
                        uno: 'xxxxx',
                        price: 1234,
                        quantity: 1,
                        totalPrice: 1234
                    }*/
                ],
                totalPrice: 0
            }
        };
        
        // Deleting sensitive info from session data
        delete req.session.user.password;
        delete req.session.user.id;

        if(!user || user.length < 1) return res.status(401).json({ message: 'Authentication failed' });

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


router.post('/register', async (req, res, next) => {
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
        
        let user = await userExists(userReq.email);
        if(!user || user.length < 1) return res.status(401).json({ message: 'Authentication failed' });

        // Setting up session
        req.session.user = user;
        req.session.user.cart = { // Cart items data should be passed to the payment gateway
            items: {
                totalItems: 0,
                list: [
                    /*{
                        uno: 'xxxxx',
                        price: 1234,
                        quantity: 1,
                        totalPrice: 1234
                    }*/
                ],
                totalPrice: 0
            }
        };

        // Deleting sensitive info from session data
        delete req.session.user.password;
        delete req.session.user.id;

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
        if (!userData || !(userData.length > 0)) return res.status(500).json({ message: `User \"${userReq.email}\" does not exists in database` });
        
        // If user has dependencies and haven't forceDeleted, returns
        const hasDependencies = await hasUploads(userData[0].id);
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
        let sqlUser = "SELECT * FROM user_orders WHERE user_id = $1;";
        let sqlImages = "SELECT * FROM images WHERE uploader_id = $1;"
        let sqlOrders = "SELECT * FROM orders WHERE user_id = $1;"
        let [user_orders, images, orders] = await Promise.all([
        pgQuery(sqlUser, params),
        pgQuery(sqlImages, params),
        pgQuery(sqlOrders, params)
        ]);

        // If has relation, returns true
        return (user_orders.length > 0 || images.length > 0 || orders.length > 0); 
    } catch (err) {
        throw err;
    }
}

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    try {
        return new Promise((resolve, reject) => {
            bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
                if (err) reject(err);
                resolve(hash);
            });
        });
    } catch (err) {
        throw err;
    }
}

module.exports = router;