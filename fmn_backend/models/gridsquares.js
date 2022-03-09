const mongoose =  require('mongoose');

/**
 * Outline for MongoDB Schema
 */
const gridSquaresSchema = mongoose.Schema({
    properties: {type: Object, required: false},
    geometry: {type: Object, required: true}
});

module.exports = mongoose.model('GridSquares', gridSquaresSchema);