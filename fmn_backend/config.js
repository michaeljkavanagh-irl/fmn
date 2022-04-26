// config.js
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN
};