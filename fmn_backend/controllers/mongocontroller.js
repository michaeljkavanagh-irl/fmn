require('dotenv').config();
const requestProm = require('request-promise');
const https = require('https');
const request = require('request');
const mongoose = require('mongoose');
const TAG = 'MongoController: ';
const CommentDoc = require('../models/comment');
const PlacesDoc = require('../models/places');
const GridSquaresDoc = require('../models/gridsquares');
const { time, Console } = require('console');
const fetch = require('node-fetch');
const sleep = require('sleep');

    /** ================================ Search Project Content ========================================= */
    exports.searchThreadContent = (req,res,next) => {
      console.log('test');
        const searchKey = req.query.value;
       /*  String.prototype.toObjectId = function() {
          var ObjectId = (require('mongoose').Types.ObjectId);
          return new ObjectId(this.toString());
        };
        var id = mongoose.Types.ObjectId(userId); */
        console.log(req.query);
        CommentDoc.aggregate([
          {   
              $search: {
                "autocomplete": {
                  "path": "comment",
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
          res.status(500).json({error:'Something went wrong fetching threads'});
        })
      }
    /** ================================ Search Project Content ========================================= */


    /** ================================ Store Polygon Features ========================================= */
      exports.storeFeatures = (req,response,next) => {
        console.log(req.body.polygons);
        let docsArrPoly = [];

        for (let polygon of req.body.polygons) {
          newDoc = {properties: polygon.properties, 
                    geometry: polygon.geometry}
          docsArrPoly.push(newDoc);
        }

        GridSquaresDoc.deleteMany()
        .then(dropResponse => {
          GridSquaresDoc.insertMany(docsArrPoly)
            .then(mongoresponse => {     
                console.log(mongoresponse);  
                response.status(200).json({polygons:docsArrPoly});
            })
            .catch(error => {
                console.log(error);
                response.status(500).json({
                    message:'Failed to write Polygon Square Grids to MongoDB',
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
      
    }
    /** ================================ Store Polygon Features ========================================= */



    /** ================================ Search Google Places ========================================= */
    exports.searchPlaces = (req,response,next) => {
      console.log(req.body);
      const apiKey = process.env.GOOGLE_API_KEY;

     // what we get [minX, minY, maxX, maxY]
     // what we need [maxX, minY, minX, maxY]
     // x = long
     // y = lat
      let westLng = req.body.westLng;
      let southLat = req.body.southLat;
      let eastLng = req.body.eastLng;
      let northLat = req.body.northLat;
     // let bbox = req.body.bbox;
      let lat = req.body.lat;
      let lng = req.body.lng;
      let radius = req.body.radius; 
      let numRadius = parseInt(radius);
      let refactoredRadius = Math.round(numRadius*0.75);

  
      /** Criteria for 15 MIN CITY */
      /** Groceries , Medical, Culture, Education, Transit, Leisure */
      var placesURL;
      let urls = [];
      let dataArr = [];
      let docsArr = [];
      let differentTypes = ['Education Facility', 'Park-Recreation Area', 'Sports Facility/Venue', 'Convenience Store', 
      'Hospital or Health Care Facility', 'Tourist Attraction', 'Bus Stop', 'Train Station'];
        for (let type of differentTypes) {
          console.log('creating URL for: '+type+ ' with a radius of: '+radius);
       /*    placesURL = 'https://discover.search.hereapi.com/v1/'+
          'discover?apiKey=20FbZzEd0daRqXGutKvdTnUHAY0k9LLaXKLgVvmuFQU'+
          '&in=circle:'+lat+','+lng+';r='+refactoredRadius+''+
          '&limit=50'+
          '&q='+type+''; */


          placesURL = 'https://discover.search.hereapi.com/v1/'+
          'discover?apiKey=20FbZzEd0daRqXGutKvdTnUHAY0k9LLaXKLgVvmuFQU'+
          '&in=bbox:'+westLng+','+southLat+','+eastLng+','+northLat+
          //';r='+refactoredRadius+''+
         //'&in=bbox:'+bbox+';r='+refactoredRadius+''+ 
         '&limit=100'+
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
       // centroidsArr.push({centroid: req.body.centroids[i].geometry.coordinates, categories:dataArr});
        for (let category of dataArr) {
          for (let item of category.items) {

              console.log(item);
              var mastercategory;
              if (item.categories[0].name === 'Education Facility' || item.categories[0].name === 'School' ) {
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
              else if (item.categories[0].name === 'Tourist Attraction') {
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



        PlacesDoc.deleteMany()
        .then(dropResponse => {
          PlacesDoc.insertMany(docsArr)
            .then(mongoresponse => {     
                //console.log(mongoresponse);  
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
      //pk.eyJ1Ijoib3VyY29sbGVjdGl2ZSIsImEiOiJja2Nmem44bGowbjVyMnJwYndlcHpueTl4In0.ZTTDR6WlA6BNA4JFxbNj4Q

      /** MapBox Isochrone Option */
      if (req.query.time) {
        console.log('in here');
        var isoChroneURL = 'https://api.mapbox.com/isochrone/v1/mapbox/'+
        mode+'/'+lng+','+lat+
        '?contours_minutes='+
        time+'&polygons=true&access_token=pk.eyJ1Ijoib3VyY29sbGVjdGl2ZSIsImEiOiJja2Nmem44bGowbjVyMnJwYndlcHpueTl4In0.ZTTDR6WlA6BNA4JFxbNj4Q';
        console.log(isoChroneURL);
       // request(isoChroneURL).pipe(res);
       request(isoChroneURL).on('response', function(response) {
        console.log(response.statusCode) // 200
        //console.log(response.headers['content-type']) // 'image/png'
      }).pipe(res);
      } else {
        console.log('in here 2');
      var isoChroneURL = 'https://api.mapbox.com/isochrone/v1/mapbox/'+
        mode+'/'+lng+','+lat+
        '?contours_minutes=15&polygons=true&access_token=pk.eyJ1Ijoib3VyY29sbGVjdGl2ZSIsImEiOiJja2Nmem44bGowbjVyMnJwYndlcHpueTl4In0.ZTTDR6WlA6BNA4JFxbNj4Q';
        //console.log(isoChroneURL);
        //console.log(request(isoChroneURL));
 
         request.get(isoChroneURL).on('response', function(response) {
          //console.log(response.statusCode); // 200
          console.log(response); // 'image/png'
        }).pipe(res); 

       /*  fetch(isoChroneURL) 
        .then(response => response.json())
        .then(data => console.log(data))
        .pipe(res); */
    }


    /** Here API Isochrone Option */

    /* if (req.query.time) {
      if (req.query.time == 10) {
        time = 600;
      } else if (req.query.time == 15) {
        time = 900;
      } else if (req.query.time == 20) {
        time = 1200;
      }
      var hereIsoChroneURL = 'https://isoline.router.hereapi.com/v8/isolines'+
      '?apiKey=20FbZzEd0daRqXGutKvdTnUHAY0k9LLaXKLgVvmuFQU'+
      '&transportMode=pedestrian'+
      '&origin='+lat+','+lng+
      '&range[values]='+time+
      '&range[type]=time'; 
      request(hereIsoChroneURL).pipe(res);
    } else {
      var hereIsoChroneURL = 'https://isoline.router.hereapi.com/v8/isolines'+
      '?apiKey=20FbZzEd0daRqXGutKvdTnUHAY0k9LLaXKLgVvmuFQU'+
      '&transportMode=pedestrian'+
      '&origin='+lat+','+lng+
      '&range[values]=900'+
      '&range[type]=time'; 
      request(hereIsoChroneURL).pipe(res);
    } */

   
    /*     curl -X GET \
  'https://isoline.router.hereapi.com/v8/isolines?transportMode=pedestrian&origin=52.51578,13.37749&range[type]=time&range[values]=300'
 */        


  }
      /** ================================ Update MapBox IsoChrone ========================================= */