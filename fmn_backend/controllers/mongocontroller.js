require('dotenv').config();
const requestProm = require('request-promise');
const https = require('https');
const request = require('request');
const mongoose = require('mongoose');
const TAG = 'MongoController: ';
const PlacesDoc = require('../models/places');

    /** ================================ Search Project Content ========================================= */
    exports.searchThreadContent = (req,res,next) => {
        const searchKey = req.query.value;
        console.log(req.query);
        PlacesDoc.aggregate([
          {   
              $search: {
                "autocomplete": {
                  "path": "title",
                  "query": searchKey
                }
            },
          },
        ])
        .then(threadResults => {
          if (threadResults) {
            console.log(threadResults);
              return res.status(200).json({
              results: threadResults
            })
          }
        })
        .catch(error => {
          console.log(error);
          res.status(500).json({error:'Oooops, something went wrong fetching places'});
        })
      }
    /** ================================ Search Project Content ========================================= */


    /** ================================ Search Google Places ========================================= */
    exports.searchPlaces = (req,response,next) => {
      let lat = req.body.lat;
      let lng = req.body.lng;
      let radius = req.body.radius; 
      let numRadius = parseInt(radius);
      let refactoredRadius = Math.round(numRadius*0.75);

  
      /** Criteria for 15 MIN CITY */
      /** Groceries , Medical, Culture, Education, Transport, Outdoor */
      var placesURL;
      let urls = [];
      let dataArr = [];
      let docsArr = [];
      let differentTypes = ['Education Facility', 'Park-Recreation Area', 'Sports Facility/Venue', 'Convenience Store', 
      'Hospital or Health Care Facility', 'Tourist Attraction', 'Bus Stop', 'Train Station'];
        for (let type of differentTypes) {
          console.log(TAG+ 'creating URL for: '+type+ ' with a radius of: '+radius);
          placesURL = 'https://discover.search.hereapi.com/v1/'+
          'discover?apiKey='+process.env.placesAPIkey+
          '&in=circle:'+lng+','+lat+';r='+refactoredRadius+''+
          '&limit=50'+
          '&q='+type+'';

        urls.push(placesURL);
         
      }
      const promises = urls.map(url => requestProm(url));
      Promise.all(promises).then((data) => {
        dataArr.push(JSON.parse(data[0]));
        dataArr.push(JSON.parse(data[1]));
        dataArr.push(JSON.parse(data[2]));
        dataArr.push(JSON.parse(data[3]));
        dataArr.push(JSON.parse(data[4]));
        dataArr.push(JSON.parse(data[5])); 
        dataArr.push(JSON.parse(data[6])); 
        dataArr.push(JSON.parse(data[7])); 

        //  Turn HERE respononse into Mongo Docs 
        for (let category of dataArr) {
          for (let item of category.items) {

              var mastercategory;
                if (item.categories === undefined) {
                  mastercategory = 'Other';
              }
                else if (item.categories[0].name === 'Education Facility' || item.categories[0].name === 'School' ) {
                  mastercategory = 'School';
                }
                else if (item.categories[0].name === 'Recreation Center' || item.categories[0].name === 'Park-Recreation Area'
                || item.categories[0].name === 'Sports Facility/Venue') {
                  mastercategory = 'Park';
                }
                else if (item.categories[0].name === 'Family/General Practice Physicians' || item.categories[0].name === 'Healthcare and Healthcare Support Services' 
                || item.categories[0].name === 'Medical Services/Clinics') {
                  mastercategory = 'Hospital';
                }
                else if (item.categories[0].name === 'Bus Stop' || item.categories[0].name === 'Train Station') {
                  mastercategory = 'Transport';
                }
                else if (item.categories[0].name === 'Convenience Store' || item.categories[0].name === 'Grocery') {
                  mastercategory = 'Grocery';
                }
                else if (item.categories[0].name === 'Tourist Attraction' || item.categories[0].name === 'Historical Monument' || item.categories[0].name === 'Landmark Attraction') {
                  mastercategory = 'Tourist Attraction';
                }
                else {
                  mastercategory = 'Other';
                }
              

            newDoc = {
              title: item.title,
              categories: item.categories,
              location: {type: "Point", coordinates: [item.position.lng, item.position.lat]},
              distance: item.distance,
              address: item.address,
              criteria: mastercategory
            }
            docsArr.push(newDoc);
          }
        }


        /** Clear out the previous data that was saved for the last location before adding new places data */
        PlacesDoc.deleteMany()
        .then(dropResponse => {
          PlacesDoc.insertMany(docsArr)
            .then(mongoresponse => {     
                response.status(200).json({categories:dataArr});
            })
            .catch(error => {
                console.log(error);
                response.status(500).json({
                    message:'Failed to write Here Response Docs to MongoDB',
                    error: error
                })
            }); 
        })
        .catch(error => {
          console.log(error);
          response.status(500).json({
            message:'Failed to drop Collection in MongoDB',
            error: error
        })         
      }); 
  })
}
    /** ================================ Search Google Places ========================================= */

    /** ================================ Update Mapbox IsoChrone ========================================= */
    exports.updateIsochrone = (req,res,next) => {
      console.log(req.query);
      accessToken = process.env.MAPBOX_TOKEN;
      var lng = req.query.lng;
      var lat = req.query.lat;
      var mode = req.query.mode; //E.G. Walking, Cycling or Driving
      var time = req.query.time; //E.G. 10mins, 15mins or 20mins

      /** MapBox Isochrone Option */
      if (req.query.time) {
        var isoChroneURL = 'https://api.mapbox.com/isochrone/v1/mapbox/'+
        mode+'/'+lng+','+lat+
        '?contours_minutes='+
        time+'&polygons=true&access_token='+process.env.mapboxkey;
        console.log(isoChroneURL);
        request(isoChroneURL).on('response', function(response) {
        console.log(response.statusCode) // 200
      }).pipe(res);
      } 
      else {
        var isoChroneURL = 'https://api.mapbox.com/isochrone/v1/mapbox/'+
        mode+'/'+lng+','+lat+
        '?contours_minutes=15&polygons=true&access_token='+process.env.mapboxkey;
         request.get(isoChroneURL).on('response', function(response) {
          console.log(response);
        }).pipe(res); 

      }       
  }
      /** ================================ Update MapBox IsoChrone ========================================= */