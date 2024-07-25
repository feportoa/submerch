const sharp = require('sharp');
const express = require('express');
const router = express.Router();

const path = '../public/images/diane.jpg';

router.get('/metadata', async (req, res) => {
    const metadata = await sharp(path).metadata();
    return res.status(200).json(metadata);
});

module.exports = sharp;