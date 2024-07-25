# How to set up the project

- Install Node.js (version 18.20.4 OR version 18 LTS) and npm
- Install dependencies
- Install postgresql
- Set up data in postgresql:
    - CREATE ROLE submerch WITH LOGIN PASSWORD 'submerchAdmin';
    - CREATE DATABASE submerch OWNER TO submerch;

## The files

- Frontend, static files and images goes in the `/public` folder. 
    - HTML files goes into the `/html` folder.
    - CSS files goes into the `/styles` folder.
    - The Frontend JavaScript files goes into the `/js` folder.
    - The `/static` folder only has STATIC IMAGES, images that doesn't belong to a user or a product in the databank
    - The `/images` folder contains the images that are related to a user or a product