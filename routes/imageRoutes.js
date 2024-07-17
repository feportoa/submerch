const fs = require('fs');

// Setting up sharp
const path = require('path');
const sharp = require('sharp');

// Setting up PSQL
const { pgQuery } = require('../utils/db.js');

// Setting up express
const express = require('express');
const router = express.Router();

router.get('/:image_name', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, '..', 'public', 'images', req.params.image_name);

        const imageBuffer = await sharp(imagePath).toBuffer();
        const metadata = await sharp(imageBuffer).metadata();

        // Set correct MIME to content-type
        res.set('Content-Type', `image/${metadata.format}`);

        return res.status(200).send(imageBuffer);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

router.get('/getThumbnail/:image_name', async (req, res) => {

    try {
        
        const imagePath = path.join(__dirname, '..', 'public', 'images', req.params.image_name);
        const resizedImagePath = path.join(__dirname, '..', 'public', 'images', `thumbnail_${req.params.image_name}`);
        
        // If resized image doesn't exists, resized it and send
        if (!hasResized(resizedImagePath)) {
            await sharp(imagePath)
            .resize({
                width: 200,
                height: 200,
                fit: 'inside',
                withoutEnlargement: false
            })
            .toFile(resizedImagePath);
        }

        // Fetching image metadata
        const resizedBuffer = await sharp(resizedImagePath).toBuffer();
        const metadata = await sharp(resizedBuffer).metadata();
        
        // Set correct MIME to content-type
        res.set('Content-Type', `image/${metadata.format}`);
        
        return res.status(200).send({id: 1, name: 'Mini diane', img: resizedBuffer});
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

function hasResized(resizedPath) {
    return fs.existsSync(resizedPath);
}

module.exports = router;