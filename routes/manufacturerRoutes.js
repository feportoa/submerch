const productRoutes = require('./productRoutes.js');

const express = require('express');
const { pgQuery } = require('../db.js')

const router = express.Router();

router.get('/allManufacturers', async (req, res) => {
    try {
        const sql = "SELECT * FROM manufacturers;";
        const queryRes = await pgQuery(sql);

        return res.status(200).json(queryRes);
    } catch (err) {
        res.status(500).json('Internal server error: ' + err.message);
        throw err;
    }
});

router.post('/addManufacturer', async (req, res) => {
    try {
        const userReq = req.body;
    
        const params = [userReq.name, userReq.description, userReq.origin_country, userReq.address];
        const sql = "INSERT INTO manufacturers (name, description, origin_country, address) VALUES ($1, $2, $3, $4)";
        
        await pgQuery(sql, params);

        return res.status(200).json("New manufacturer added successfully.");
    } catch (err) {
        res.status(500).json('Internal server error: ' + err.message);
        throw err;
    }
});

router.delete('/removeManufacturer', async (req, res) => {
    try {
        const userReq = req.body;
    
        const manufacturerData = await findByName(userReq.name);

        if(userReq.forceDelete == true) {
            await cleanManufacturersProducts(manufacturerData.id);
        }

        if (manufacturerData != undefined) {
            const params = [manufacturerData.id];
            const sql = "DELETE FROM manufacturers WHERE id = $1";
            
            await pgQuery(sql, params)
            
            return res.status(200).json(`Manufacturer of id ${ manufacturerData.id } deleted successfully.`);
        } else {
            return res.status(500).json('Internal server error: "' + userReq.name + '" not found in database');
        }
    } catch (err) {
        res.status(500).json('Internal server error: ' + err.message);
        throw err;
    }
});

async function findByName(name) {
    try {
        const params = [name];
        const sql = "SELECT id FROM manufacturers WHERE name = $1"
        
        const queryRes = await pgQuery(sql, params);
        return queryRes[0];
    } catch (err) {
        throw err;
    }
}

async function cleanManufacturersProducts(manufacturerId) {
    try {
        const params = [manufacturerId];
        const sql = "DELETE FROM products WHERE manufacturer_id = $1"

        await pgQuery(sql, params);
    } catch (err) {
        throw err;
    }
}

module.exports = router;