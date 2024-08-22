const express = require('express');
const { pgQuery } = require('../utils/db.js');
const { saveImage, resizeProductImage } = require('../utils/imageProcessing.js');

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

        const sql = "INSERT INTO products (name, description, is_new, technical_specs, price, manufacturer_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;";
        const params = [userReq.name, userReq.description, userReq.is_new, userReq.technical_specs, userReq.price, userReq.manufacturer_id];

        let query = await pgQuery(sql, params);

        return res.status(201).json({ message: "New product added successfully. id: " + query[0].id });
    } catch (err) {
        next(err);
    }
});

router.post('/register', async (req, res, next) => {
    /* TODO: 
    * ADD COMMENTS!!
    * Add session authentication,
    * Get uploader_id via session,
    * Process images with sharp,
    * Detect if filetype is valid (block exe, sh, gif and other unwanted types)
    * Get image buffer as Base64 from frontend,
    * Remove logs
    */
    try {
        const userReq = req.body;
        /*
        Nome do produto
        Descrição do produto
        É novo?
        Preço
        Quantidade disponível
        Está disponível?
        (SEÇÃO, NÃO CAMPO) Especificações técnicas:
        Profundidade de operação
        Velocidade de cruzeiro
        Quantidade de passageiros (Esse é um "map", um lista que você pode aumentar e adicionar 2 valores, 1 em números (quantidade de passageiros) e um em valor (valor adicional desse veículo com X assentos a mais))
        Dimensões (3 campos, width, height e depth em METROS)
        Peso (Em kilos)
        Janelas
        Modelo
        Classes (Uma lista com nomes de classes que eu ainda vou decidir quais são)

        (SEÇÃO, NÃO CAMPO) Imagens do produto
        Upload de várias imagens
        (SUBSEÇÃO, NÃO CAMPO) Configuração das imagens:
        Titulo
        Descrição
        Alt text
        É thumb?
        Têm thumb? (Só aparece se o usuário não marcar que é thumb)

        Fabricante (Escolher de uma lista de fabricantes cadastrados)
        */

        /* INSERT INTO products (name, description, is_new, price, quantity, is_available, technical_specs. manufacturer_id)*/
        /* INSERT INTO images (title, description, alt, is_thumb, has_thumb) */

        const insertImageQuery = `
            INSERT INTO images (title, description, alt_text, file_name, file_type, file_size_bytes, url, is_thumb, has_thumb, has_alpha, width_px, height_px, uploader_id)
            VALUES ${userReq.images.map((_, index) => {
                const offset = index * 13; // 13 columns per image
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`;
              }).join(', ')}
            RETURNING id;
        `;

        const insertProductQuery = `
        INSERT INTO products (name, description, is_new, technical_specs, price, manufacturer_id, quantity, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
        `;
        
        const productParams = Object.entries(userReq.product).map(([_, value]) => value);
        const imagesParams = userReq.images.map(obj => Object.entries(obj.metadata).map(([_, value]) => value)).flat(Infinity);
        
        userReq.images.forEach(async (element) => {
            // TODO: change `'test'` to current suffix (image keyword)
            await saveImage(element, userReq.product.name, 'test');
            if(element.metadata.has_thumb) {
                console.log("Resizing image. ");
                await resizeProductImage(element, userReq.images, userReq.product.name, 'test');
            }
        });

        let [imagesId, productId] = await Promise.all([
            pgQuery(insertImageQuery, imagesParams),
            pgQuery(insertProductQuery, productParams),
        ]);

        const insertRelationProductImages = `
        INSERT INTO product_images (product_id, image_id)
        VALUES ${userReq.images.map((_, index) => {
            const offset = index * 2; // 2 columns per image
            return `($${offset + 1}, $${offset + 2})`;
          }).join(', ')}
        `;

        let relationParams = [];

        for (let i = 0; i < userReq.images.length; i++) {
            relationParams.push(productId[0].id);
            relationParams.push(imagesId[i].id);
        }
        
        await pgQuery(insertRelationProductImages, relationParams);

        return res.status(201).json({ message: "Insertions made successfully." });

    } catch (err) {
        next(err);
    }
});

router.delete('/removeProduct', async (req, res, next) => {
    try {
        const userReq = req.body;

        // TODO: Create a function to see if the product has dependencies (product_images, user, etc)
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