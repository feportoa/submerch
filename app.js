const userRoutes = require('./routes/userRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const manufacturerRoutes = require('./routes/manufacturerRoutes.js');

const { connectDB } = require('./db.js');
const express = require('express');
const app = express();
const PORT = 8080;
const HOST = 'localhost';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB()
.then(() => {

    // Serves static images
    app.use('/static', express.static('./public/images'));
    
    // Serves html files
    app.use(express.static('public/html/'));
    
    // Serves JavaScript and CSS files (Used by html)
    app.use(express.static('public'));
    
    // Routes
    app.use('/api/', userRoutes);
    app.use('/api/', productRoutes);
    app.use('/api/', manufacturerRoutes);

    app.listen(PORT, HOST, () => {
        console.log(`App listening on ${HOST}:${PORT}`);
    });
})
.catch(err => {
    console.error("Error connecting to the database: ", err)
})
