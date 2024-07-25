const sharp = require('sharp');
const path = require('path');

// Setting up express
const express = require('express');
const router = express.Router();

// Setting images system path
const imagePath = path.join(__dirname, '..', 'public', 'images', 'diane.jpg');

router.get('/metadata', async (req, res) => {
    try {
        // Use this to get all the data needed for the databank
        const imageBuffer = await sharp(imagePath).toBuffer();
        const metadata = await sharp(imageBuffer).metadata();

        return res.status(200).json(metadata);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;