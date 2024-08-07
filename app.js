// Routes import
const userRoutes = require('./routes/userRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const manufacturerRoutes = require('./routes/manufacturerRoutes.js');
const imageRoutes = require('./routes/imageRoutes.js');
const { errorHandler } = require('./middleware/errorMiddleware.js');
const sessionMiddleware = require('./middleware/sessionMiddleware.js');

// Path import
const path = require('path');

// DB import
const { connectDB } = require('./utils/db.js');

// Express import
const express = require('express');
const app = express();
const PORT = 8080;
const HOST = 'localhost';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

connectDB();

// Defining different paths
const publicPath = path.join(__dirname, 'public');
const staticPath = path.join(publicPath, 'images');
const htmlPath = path.join(publicPath, 'html');

// Serves html files
app.use(express.static(htmlPath));

// Serves JavaScript and CSS files (Used by html)
app.use(express.static(publicPath));

// Serves static images
app.use('/static', express.static(staticPath));

// Routes
app.use('/users/', userRoutes);
app.use('/products/', productRoutes);
app.use('/manufacturers/', manufacturerRoutes);
app.use('/images/', imageRoutes);

// ErrorHandler needs to be the last middleware
app.use(errorHandler);

// Booting
app.listen(PORT, HOST, () => {
    console.log(`App listening on ${HOST}:${PORT}`);
});

// function conTry() {
//     connectDB()
//     .then()
//     .catch(async err => {
//         console.error(err);
//         await new Promise(res => setTimeout(res, 5000)); // Retry connection every 5 seconds
//     });
// }