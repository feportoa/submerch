const express = require('express');
const { pgQuery } = require('../utils/db.js');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        // Fetch the product with its related thumbnail
        const sql = `SELECT * FROM all_product_related();`

        const queryRes = await pgQuery(sql);
        
        return res.status(200).json(queryRes);
    } catch (err) {
        next(err);
    }
});

router.get('/all', async (req, res, next) => {
    try {
        const sql = `SELECT * FROM products;`;
        const queryRes = await pgQuery(sql);

        return res.status(200).json(queryRes);
    } catch (err) {
        next(err);
    }
});

router.get('/:uno', async (req, res, next) => {
    try {
        const uno = req.params.uno;
        let obj = {}

        let sql = `SELECT * FROM products WHERE uno = $1;`;

        let productData = await pgQuery(sql, [uno]);
        if (productData.length === 0) return res.status(404).json({ message: "Product not found." });
        
        obj.product = productData;
        obj.images = [];

        let manufacturerId = productData[0].manufacturer_id;
        delete obj.product[0].manufacturer_id; // Remove unecessary data from product

        let [imagesId, manufacturerData] = await Promise.all([
            pgQuery(`SELECT * FROM product_images WHERE product_id = $1;`, [productData[0].id]),
            pgQuery("SELECT * FROM manufacturers WHERE id = $1;", [manufacturerId])
        ]);

        // sql = `SELECT * FROM product_images WHERE product_id = $1;`;
        // imagesId = await pgQuery(sql, [productData[0].id]);
        
        let images = imagesId.map(async (element) => {
            queryRes = await pgQuery(`SELECT id AS image_id,
                                             url,
                                             title,
                                             description,
                                             alt_text,
                                             is_thumb,
                                             file_name,
                                             file_type 
                      FROM images WHERE id = $1;`, [element.image_id]);
            return queryRes[0];
        });

        // sql = `SELECT * FROM manufacturers WHERE id = $1;`;
        // let manufacturerData = await pgQuery(sql, [manufacturerId]);
        
        obj.images = await Promise.all(images);
        obj.manufacturer = manufacturerData;

        return res.status(200).json(obj);
    } catch (err) {
        next(err);
    }
});

router.post('/newProduct', async (req, res, next) => {
    try {
        /* 
        * TODO
        * Use Create Product API in stripe to create a product
        * Use Create Price API in stripe to create a price for the product
        * https://docs.stripe.com/get-started/development-environment?lang=node
        * 
        * Later, you'll need a PaymentIntent in app.js
        */

        const userReq = req.body;

        const sql = "INSERT INTO products (name, description, is_new, technical_specs, price, manufacturer_id) VALUES ($1, $2, $3, $4, $5, $6);";
        const params = [userReq.name, userReq.description, userReq.is_new, userReq.technical_specs, userReq.price, userReq.manufacturer_id];

        pgQuery(sql, params)
        return res.status(201).json({ message: "New product added successfully." });
    } catch (err) {
        next(err);
    }
});

router.delete('/removeProduct', async (req, res, next) => {
    try {
        const userReq = req.body;

        if(!userReq.forceDelete) return res.status(403).json({ message: "FORBIDDEN: Set forceDelete to true to continue" });

        const params = [userReq.id];
        const sql = "DELETE FROM products WHERE id = $1;";
        await pgQuery(sql, params);

        return res.status(204).json({ message: "Removed products successfully." });
    } catch (err) {
        next(err);
    }
});

module.exports = router;