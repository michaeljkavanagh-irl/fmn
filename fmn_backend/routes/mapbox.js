const express = require("express");
const MapBoxController = require('../controllers/mapbcontroller')
const router = express.Router();

router.get("/image", MapBoxController.fetchStaticImage);

module.exports = router;