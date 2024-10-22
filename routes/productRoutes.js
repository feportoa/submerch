const express = require('express');
const { pgQuery } = require('../utils/db.js');

const router = express.Router();

router.get('/', async (req, res) => {
    try {

        // Fetch the product with its related thumbnail
        const sql = `SELECT p.id AS product_id,
                            p.name,
                            p.description,
                            p.is_new,
                            p.price,
                            p.quantity,
                            p.is_available,
                            p.created_at,
                            i.url,
                            i.is_thumb,
                            i.alt_text,
                            m.name AS manufacturer_name FROM products p
        JOIN product_images pi ON p.id = pi.product_id
        JOIN manufacturers m ON m.id = p.manufacturer_id
        JOIN images i ON i.id = pi.image_id WHERE i.is_thumb = TRUE;`

        const queryRes = await pgQuery(sql);

        return res.status(200).json(queryRes);
    } catch (err) {
        res.status(200).json({ message: 'Internal server error: ' + err.message });
        throw err;
    }
});

router.post('/newProduct', async (req, res) => {
    try {
        const userReq = req.body;

        const sql = "INSERT INTO products (name, description, is_new, technical_specs, price, manufacturer_id) VALUES ($1, $2, $3, $4, $5, $6);";
        const params = [userReq.name, userReq.description, userReq.is_new, userReq.technical_specs, userReq.price, userReq.manufacturer_id];

        pgQuery(sql, params)
        return res.status(200).json({ message: "New product added successfully." });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error: ' + err });
        throw err;
    }
});

router.delete('/removeProduct', async (req, res) => {
    try {
        const userReq = req.body;

        if(!userReq.forceDelete) return res.status(403).json({ message: "FORBIDDEN: Set forceDelete to true to continue" });

        const params = [userReq.id];
        const sql = "DELETE FROM products WHERE id = $1;";
        await pgQuery(sql, params);

        return res.status(200).json({ message: "Removed products successfully." });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error: ' + err.message });
        throw err;
    }
});

module.exports = router;