// ALWAYS RETURN IMAGES AS BUFFERS!

// Importing required modules
const fs = require('fs');

// Setting up sharp
const sharp = require('sharp');
const path = require('path');

async function resize(resizedPath, imagePath = null, imageBuffer = null) {
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
            fit: 'contain',
            withoutEnlargement: true
        })
        .toFile(resizedPath);
        return true;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

//TODO: Modify saveImage and resizeProductImage to save in an amazon bucket
async function saveImage(imageObj, productName, sufixName) {
    // Converts buffer
    let base64 = imageObj.base64;
    let buffer = base64ToBuffer(base64);

    // Get image filetype
    let filetype = await detectFileType(buffer)

    // Update and format name
    let imageName = updateImageName(productName, sufixName);

    // New URL (databank formated)
    let newUrl = updateUrl(imageName, filetype);

    imageObj.url = newUrl

    // URL for the new thumbnails
    fs.writeFile(`public/${newUrl}`, buffer, (err) => {
        if (err) {
            throw err;
        }
    });
}

async function resizeProductImage(imageObj, req, productName, sufixName) {
    /*
    * Resizes an image to 200x200 and 400x400 pixels and saves it to images path.
    * @param {obj} imageObj - The object of the specific image you're resizing (received via req).
    * @param {array} req - The array of imageObj in your req.
    * @param {string} productName - Name of the product to be attached into the image.
    * @param {string} sufixName - XXX.
    */
    try {
        // Converts buffer
        let base64 = imageObj.base64;
        let buffer = base64ToBuffer(base64);

        // Get image filetype
        let filetype = await detectFileType(buffer)

        // Update and format name
        let imageName = updateImageName(productName, sufixName);

        // New URL (databank formated)
        let newUrl = updateUrl(imageName, filetype);

        // URL for the new thumbnails
        let thumbUrl = await resizeWithBuffer(buffer, newUrl, filetype);

        // Declare new thumb reqs
        // TODO: thumb200 is being passed as undefined or []
        let thumb200 = {}, thumb400 = {};
        thumb200.metadata = JSON.parse(JSON.stringify(imageObj.metadata)) 
        thumb400.metadata = JSON.parse(JSON.stringify(imageObj.metadata))

        // Modify thumb req metadata as need
        thumb200.metadata.url = thumbUrl[0];
        thumb200.metadata.is_thumb = true;
        thumb200.metadata.has_thumb = false;
        
        thumb400.metadata.url = thumbUrl[1];
        thumb400.metadata.is_thumb = true;
        thumb400.metadata.has_thumb = false;

        // Append thumbs into existing req
        req.push({ ...thumb200 }, { ...thumb400 });
    } catch (err) {
        throw err;
    }
}

async function resizeWithBuffer(buffer, url, filetype) {
    try {
        const thumbUrlArr = [];
        
        let dotPosition = url.lastIndexOf('.');
        url = url.slice(0, dotPosition);

        // 200px
        let newUrl = `public/${url}-200px.${filetype}`
        await sharp(buffer)
        .resize({
            width: 200,
            height: 200,
            fit: 'contain',
            withoutEnlargement: true
        })
        .toFile(newUrl);
        thumbUrlArr.push(newUrl);
        
        // 400px
        newUrl = `public/${url}-400px.${filetype}`
        await sharp(buffer)
        .resize({
            width: 400,
            height: 400,
            fit: 'cover',
            withoutEnlargement: true
        })
        .toFile(newUrl);
        thumbUrlArr.push(newUrl);
    
        return thumbUrlArr;
    } catch (err) {
        throw err;
    }
}

async function resizeWithPath(imagePath, url, filetype) {
    /*
    * Resizes an image to 200x200 pixels and saves it to the specified path.
    * Returns true if the image was resized successfully, false otherwise.
    * @param {string} imagePath - The path to the original image.
    * @param {string} url - The path to save the resized image.
    * @param {string} filetype - Current filetype
    */
    // TODO: url does not have filetype attached. Fix this
    try {
        if(checkImageExists(url) || !checkImageExists(imagePath)) return false;
        await sharp(imagePath)
        .resize({
            width: 200,
            height: 200,
            fit: 'contain',
            withoutEnlargement: true
        })
        .toFile(`public/${url}.${filetype}`);
        return true;
    } catch (err) {
        throw err;
    }
}

function checkImageExists(imagePath) {
    return fs.existsSync(imagePath);
}

function base64ToBuffer(base64) {
    return Buffer.from(base64, 'base64');
}

function updateImageName(productName, sufixName) {
    console.log({productName, sufixName});
    let imageName = `${productName}_${sufixName}`;
    imageName = formatName(imageName);

    console.log({ formated: imageName });

    return imageName;
}

function updateUrl(imageName, filetype) {
    return `images/${imageName}.${filetype}`;
}

function formatName(name) {
    return name.replace(/[- ]/g, '_');
}

async function detectFileType(base64) {
    try {
        // Importing ImageType reader directly
        const { default: ImageType } = await import('image-type');
        const fileType = await ImageType(base64);

        if (!fileType.ext) throw new Error('File type not detected.');
        return fileType.ext;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    saveImage,
    resizeProductImage,
    resizeWithPath,
    resized
}