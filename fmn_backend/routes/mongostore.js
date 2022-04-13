const express = require("express");
const MongoController = require('../controllers/mongocontroller');
const Multer = require('multer');
const router = express.Router();
const TAG = 'MongoRouter: ';
require('dotenv').config();

//Multer for Files and data layers
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 350 * 1024 * 1024, // no larger than 100mb, you can change as needed.
    },
    metadata: {
        contentType: 'application/gzip',
        contentEncoding: 'gzip'
      },
  });


router.get("/threads/search", MongoController.searchThreadContent);
router.post("/places", MongoController.searchPlaces);
//router.post("/features", MongoController.storeFeatures);
router.get("/isochrone", MongoController.updateIsochrone);

/** Route to fetch the header level Project Data Layers */
//router.get("", MongoController.fetchData);

const MIME_TYPE_MAP = {
    'application/json':'json',
    'applicaiton/octet-stream':'.shp',
    'application/x-dbf':'dbf',
    'application/octet-stream':'shx',
    'text/csv':'csv',
    'application/zip': 'zip'
}

const IMAGE_MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg'
};

module.exports = router;