// ALWAYS RETURN IMAGES AS BUFFERS!

// Importing required modules
const fs = require('fs');

// Setting up sharp
const sharp = require('sharp');
const path = require('path');

async function resize(imagePath, resizedPath) {
    /*
    * Resizes an image to 200x200 pixels and saves it to the specified path.
    * Returns true if the image was resized successfully, false otherwise.
    * @param {string} imagePath - The path to the original image.
    * @param {string} resizedPath - The path to save the resized image.
    */
    try {
        if(checkImageExists(resizedPath) || !checkImageExists(imagePath)) return false;
        await sharp(imagePath)
        .resize({
            width: 200,
            height: 200,
            fit: 'cover',
            withoutEnlargement: true
        })
        .toFile(resizedPath);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function checkImageExists(imagePath) {
    return fs.existsSync(imagePath);
}