const mongoose =  require('mongoose');

/**
 * Outline for MongoDB Schema
 */
const placesSchema = mongoose.Schema({
    title: {type: String, required: true},
    address: {type: Object, required: false},
    categories: {type: [Object], required: false},
    location: {type: Object, required: false},
    distance: {type: Number, required: false},
    criteria: {type: String, required: true}
});

module.exports = mongoose.model('Places', placesSchema);