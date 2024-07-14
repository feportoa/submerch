const express = require('express');
const { pgQuery } = require('../db.js');

const router = express.Router();

router.get('/allProducts', async (req, res) => {
    try {
        const sql = "SELECT * FROM products WHERE availability = true;"
        const queryRes = await pgQuery(sql);

        return res.status(200).json(queryRes);
    } catch (err) {
        res.status(200).json('Internal server error: ' + err.message);
        throw err;
    }
});

router.post('/newProduct', async (req, res) => {
    try {
        const userReq = req.body;

        const sql = "INSERT INTO products (name, description, is_new, technical_specs, price, manufacturer_id) VALUES ($1, $2, $3, $4, $5, $6);";
        const params = [userReq.name, userReq.description, userReq.is_new, userReq.technical_specs, userReq.price, userReq.manufacturer_id];

        pgQuery(sql, params)
        return res.status(200).json("New product added successfully.");
    } catch (err) {
        res.status(500).json('Internal server error: ' + err);
        throw err;
    }
});

router.delete('/removeProduct', async (req, res) => {
    try {
        const userReq = req.body;

        const params = [userReq.id];
        const sql = "DELETE FROM products WHERE id = $1;";
        await pgQuery(sql, params);

        return res.status(200).json("Removed products successfully.");
    } catch (err) {
        res.status(500).json('Internal server error: ' + err.message);
        throw err;
    }
});

module.exports = router;