const express = require('express');
const { pgQuery } = require('../utils/db.js');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        // Fetch the product with its related thumbnail
        const sql = `SELECT p.id AS product_id,
                            p.uno,
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

        sql = `SELECT * FROM product_images WHERE product_id = $1;`;
        imagesId = await pgQuery(sql, [productData[0].id]);
        
        imagesId.forEach(async (element) => {
            queryRes = await pgQuery(`SELECT id AS image_id,
                                             url,
                                             title,
                                             description,
                                             alt_text,
                                             is_thumb,
                                             file_name,
                                             file_type 
                      FROM images WHERE id = $1 AND is_thumb = FALSE;`, [element.image_id]);
            
            obj.images.push(...queryRes);
        });

        sql = `SELECT * FROM manufacturers WHERE id = $1;`;
        let manufacturerData = await pgQuery(sql, [manufacturerId]);

        obj.manufacturer = manufacturerData;

        return res.status(200).json(obj);
    } catch (err) {
        next(err);
    }
});

router.post('/newProduct', async (req, res, next) => {
    try {
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