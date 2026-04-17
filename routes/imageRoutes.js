const fs = require('fs');

// Setting up sharp
const path = require('path');
const sharp = require('sharp');

// Setting up PSQL
const { pgQuery } = require('../utils/db.js');

// Setting up express
const express = require('express');
const { saveImage, resize } = require('../utils/imageProcessing.js');
const router = express.Router();

router.post('/newImage', async (req, res, next) => {
    try {
        // TODO: Upload image as base64 to public/images
        // This image is detached from anything right now. It needs to be attached to a product, not only a user. Change await saveImage on line 60 when done
        const userReq = req.body;

        const sql = `
            INSERT INTO images (
                title,
                description,
                alt_text,
                file_name,
                file_type,
                file_size_bytes,
                url,
                is_thumb,
                has_thumb,
                has_alpha,
                width_px,
                height_px,
                uploader_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING id;
            `;

        const params = [
            userReq.title,
            userReq.description,
            userReq.alt_text,
            userReq.file_name,
            userReq.file_type,
            userReq.file_size_bytes,
            userReq.url,
            userReq.is_thumb,
            userReq.has_thumb,
            userReq.has_alpha,
            userReq.width_px,
            userReq.height_px,
            userReq.uploader_id
        ];

        if (userReq.is_thumb) {
            let filename = userReq.file_name;
            let imagePath = path.join(__dirname, '..', 'public', 'images', filename);
            await resize(imagePath)
        }
        await saveImage(userReq, "")
        let query = await pgQuery(sql, params);

        return res.status(201).json({ message: "Image inserted successfully. Check image id: " + query[0].id });
    } catch (err) {
        next(err);
    }
});

router.get('/id/:image_id', async (req, res, next) => {
    try {

        const sql = "SELECT * FROM images WHERE id = $1";

        const imageData = await pgQuery(sql, [req.params.image_id]);

        const filename = imageData[0].file_name;
        const imagePath = path.join(__dirname, '..', 'public', 'images', filename);

        // Check for existence of image before processing, if not exists, return 404
        if(!fs.existsSync(imagePath))
            return res.status(404).json({ message: 'Image not found' });

        const imageBuffer = await sharp(imagePath).toBuffer();
        const metadata = await sharp(imageBuffer).metadata();

        // Set correct MIME to content-type
        res.set('Content-Type', `image/${metadata.format}`);

        return res.status(200).send(imageBuffer);

    } catch (err) {
        next(err);
    }
});

router.get('/:image_name', async (req, res, next) => {
    try {  
        const imagePath = path.join(__dirname, '..', 'public', 'images', req.params.image_name);

        // Check for existence of image before processing, if not exists, return 404
        if(!fs.existsSync(imagePath))
            return res.status(404).json({ message: 'Image not found' });
        
        const imageBuffer = await sharp(imagePath).toBuffer();
        const metadata = await sharp(imageBuffer).metadata();

        // Set correct MIME to content-type
        res.set('Content-Type', `image/${metadata.format}`);
        
        return res.status(200).send(imageBuffer);
    } catch (err) {
        next(err);
    }
});

router.get('/getThumbnail/:image_name', async (req, res) => {

    try {
        
        const imagePath = path.join(__dirname, '..', 'public', 'images', req.params.image_name);
        
        // If original image doesn't exists, return 404
        if(!fs.existsSync(imagePath))
            return res.status(404).json({ message: 'Image not found' });

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
        
        return res.status(200).send(resizedBuffer);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

function hasResized(resizedPath) {
    return fs.existsSync(resizedPath);
}

module.exports = router;