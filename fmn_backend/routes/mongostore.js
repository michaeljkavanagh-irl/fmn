const express = require("express");
const MongoController = require('../controllers/mongocontroller');
const router = express.Router();
const TAG = 'MongoRouter: ';
require('dotenv').config();

router.get("/places/search", MongoController.searchThreadContent);
router.post("/places", MongoController.searchPlaces);
router.get("/isochrone", MongoController.updateIsochrone);


module.exports = router;