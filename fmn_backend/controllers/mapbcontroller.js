var express = require('express');
var app = express();
var request = require('request');

exports.fetchStaticImage = (req,res,next) => {

    /** Need to check for Session Data Layers and amend URL if necessary*/

    /** May need some defaults in here in case empty params are sent in */

    var newURL = 'https://api.mapbox.com/styles/v1/ourcollective/' + req.query.style_id + '/static'
    + '/' + req.query.lng +','+ req.query.lat + ',' + req.query.zoom + ',' + 
    req.query.bearing + '/1000x1000/?access_token='+req.query.token ;

    if (req.query.layerId) {
        newURL = newURL + '&layer_id=' + req.query.layerId + '&source=' + req.query.layerId
    }

    if(req.query.type) {
        newURL = newURL + '&type=' + req.query.type

        if (type === 'fill' || type === 'Polygon') {
            newURL = newURL + '&setFilter=["==", "$type", "polygon"]'
        }
    };

    console.log(newURL);
    request(newURL).pipe(res);
}