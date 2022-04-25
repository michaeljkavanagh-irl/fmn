import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { MapService } from './map.service';
import { FeatureCollection } from './geojson.model';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, pipe, Subject, Subscription } from 'rxjs';
import { MatDialog, MatSnackBar, MatTable } from '@angular/material';
import { SessionDataLayer } from './datalayer.model';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { map, takeUntil } from 'rxjs/operators';

export interface Time {
  time: string;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})


export class MapComponent implements OnInit, OnDestroy {

  map: mapboxgl;
  value = '';
  files: any[] = [];
  trafficLayerOptions = ['BUS_Labels', 'london_tube', 'London_Bus_Route'];
  mapStyle: string;
  baseUrl: string;
  lat = 51.515098; /** start with default coordinates in London */
  lng = -0.094402;
  dataDocsPerPage = 2;
  currentPage = 1;
  data: any;
  source: any;
  form: FormGroup;
  sourceId: any;
  spinnerMessage = '';
  dataSource: any[] = [];
  searchDataSource: any[] = [];
  noDataFound = false;
  displayedColumns: string[] = [ 'Name'];
  expandedElement: any | null;
  jsonFileType = false;
  loadingInProgress = false;
  fileData: string;
  geometryType: string;
  fileUploading = false;
  mapLoaded = false;
  mapLoading = false;
  commentsVisibility = true;
  archivedCommentsVisibility = false;
  tubeLayerVisibility = false;
  tflAccidentsVisibility = false;
  tflAccidentsClusterVisibility = false;
  tflCycleRoutesVisibility = false;
  tflCycleParkingVisibility = false;
  ptalVisibility = false;
  busLabelsVisibility = false;
  londonPlanningPermissionVisibility = false;
  montrealBixiStationVisibility = false;
  montrealCollisionDataVisibility = false;

  /** Newbies! */
  searchMoviesCtrl = new FormControl();
  isLoading = false;
  errorMsg: string;
  filteredResults: Observable<any>;
  options: string[] = ['One', 'Two', 'Three'];
  comments$: Observable<any[]>;
  private educationCatCount = 0;
  private groceryCatCount = 0;
  private touristAttCatCount = 0;
  private schoolCatCount = 0;
  private hospitalCatCount = 0;
  private parkCatCount = 0;
  private trainCatCount = 0;
  private busCatCount = 0;
  times: Time[] = [
    {time: '10mins'},
    {time: '15mins'},
    {time: '20mins'}
  ];

  title = 'google-places-autocomplete';
  userAddress: string = '';
  userLatitude: string = '';
  userLongitude: string = '';
  marker: any;
  private transportMode = 'walking';
  addressLoaded = false;
  resultsReturned = false;
  qualifyingNeighbourhood = 0;
  currentTime = 15;
  currentTimeString = '15mins';
  private timerSubscription: Subscription;


  private currentMapMarkers: any[] = [];
  private features: Subscription;
  private tempGeoType: string;
  private tempSources: any[] = [];
  private sessionDataLayers: SessionDataLayer[];
  private viewChosen = '';
  private viewChosenName = ''
  private polyPaint: any;
  private pointPaint: any;
  private linePaint: any;
  private polyType: string;
  private pointType: string;
  private lineType: string;
  private propValues: any;
  private propKeys: any;




  autocompleteInput: string;
  queryWait: boolean;

  /** Master Unsubscribe Listener. Will be called 
   * from OnDestroy hook and each subscription has 
   * a corresponding takeUntil for memory management
   */
  private onDestroy$: Subject<void> = new Subject<void>();

  TAG = ' OC~MapComponent: ';
  @ViewChild('fileDropRef', { static: false }) fileDropEl: ElementRef;
  @ViewChild(MatTable, {static:false}) table: MatTable<any>;
  

  constructor(public mapService: MapService,
              private dialog: MatDialog, public snackBar: MatSnackBar) {
   }

  ngOnInit() {
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
       this.lat = position.coords.latitude;
       this.lng = position.coords.longitude;
       this.map.flyTo({
        center: [this.lng, this.lat]
      });
     });

   }

    mapboxgl.accessToken = environment.mapbox.accessToken;
    this.baseUrl = environment.mapbox.baseUrl;
    this.mapStyle = environment.mapbox.constructionLogisticsStyle  ;
    //this.mapService.setMapType('MONOCHROME LIGHT');
    this.map = new mapboxgl.Map({
          container: 'map',
          style: this.baseUrl + this.mapStyle,
          zoom: 10,
          center: [this.lng, this.lat],
          preserveDrawingBuffer: true,
      });
    const dpi = 300;
    Object.defineProperty(window, 'devicePixelRatio', {
          get: function() {
            return dpi / 96;
          }
      });


    /** Add controls for Zoom and Bearing */
    const nav = new mapboxgl.NavigationControl();
    this.map.addControl(nav, 'top-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
      polygon: true,
      trash: true,
      point: true,
      line_string: true
      }
      });
    this.map.addControl(draw, 'top-right');


    /**
     * This might need to be replaced with our images etc
     */
    this.map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
      (error, image) => {
      if (error) { throw error; }
      this.map.addImage('custom-marker', image);
    });

    this.map.on('zoomend', (event) => {
      //this.updateMapParams();
    });

    this.map.on('pitchend', (event) => {
      //this.updateMapParams();
    });

    this.map.on('rotateend', (event) => {
      /** Get current BEARING level of Map and store also after a rotation */
      const currentBearing = this.map.getBearing();
      //this.mapService.setMapBearing(currentBearing);
    });

    /** When user has drawn the catchment area - Get the bounding box and create a square 
     * grid. Grid creation layer and source is done in the buildGrid method. 
     */
    this.map.on('draw.create', () => {
        const data = draw.getAll();
        if (data.features.length > 0) {
        const area = turf.area(data);
        const rounded_area = Math.round(area * 100) / 100;
  
          let line = turf.lineString(data.features[0].geometry.coordinates[0]);
          let bbox = turf.bbox(line);
          console.log(bbox);
  
          /** To build Square you grid you need minX, minY, maxX, maxY order */
          /* let squareGrid = turf.squareGrid(bbox, 0.5)
          let features = squareGrid.features; */

          /** now we have polygon let's convert to line, offset line and then 
           * back to polygon again
           */
  
           let bboxPoly = turf.bboxPolygon(bbox);
           let tempLine = turf.polygonToLine(bboxPoly);
           let offsetLine = turf.lineOffset(tempLine, 1.2);

           let bbox2 = turf.bbox(offsetLine);
           let squareGrid = turf.squareGrid(bbox, 0.5)
           let features = squareGrid.features;

          /** Not sure if we need this or not. 
           * Getting the centroid of each Polygon.
           */
           let tempCentroid;
           let centroids = [];
           for (let feature of features ) {
             tempCentroid = turf.centroid(feature);
             centroids.push(tempCentroid);
           }
          // this.buildGrid(features);
          /*   for (let i=0; i< centroids.length; i++) {
   
             let centLng = centroids[i].geometry.coordinates[0];
             let centLat = centroids[i].geometry.coordinates[1];
             let marker = new mapboxgl.Marker()
             .setLngLat([centLng, centLat])
             .addTo(this.map);
            this.mapService.findPlaces(centLng, centLat, this.transportMode)
            
        }  */

          /** This populates Mongo with Places */
           //this.mapService.findPlaces(bbox2, this.transportMode);
          // this.mapService.storeGrid(features);
      
        } 
    });

   // this.map.on('draw.delete', updateArea); /** THIS PROBABLY NEEDS TO REMOVE THE GRID LAYER */
  //  this.map.on('draw.update', updateArea);

    this.map.on('load', (event) =>  {
      this.map.addSource('iso', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    
      this.map.addLayer(
        {
          id: 'isoLayer',
          type: 'fill',
          // Use "iso" as the data source for this layer
          source: 'iso',
          layout: {},
          paint: {
            // The fill color for the layer is set to a light purple
            'fill-color': '#5a3fc0',
            'fill-opacity': 0.3
          }
        },
        'poi-label'
      );

     
    

      this.mapService.getIsoUpdateListener()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(updatedData => {     
        console.log(updatedData);
        this.map.getSource('iso').setData(updatedData.isoResponse.features[0].geometry);

        this.mapService.getGooglePlacesResponseListener()
        .pipe(takeUntil(this.onDestroy$))
        .subscribe(googleResponses => {
          console.log(googleResponses);
         
          if (this.resultsReturned) {
            this.clearMarkers();
            this.resultsReturned = false;
          } else {
            this.resultsReturned = true;
          }
           
            this.addGoogleResponseMarkers(googleResponses);
        })

       /*  this.mapService.getSearchResultsListener()
        .pipe(takeUntil(this.onDestroy$))
        .subscribe(results => {
          //this.searchResultsFound = true;
          this.searchDataSource = results;
          //this.searchMenuTrigger.openMenu();
          
          console.log(this.searchDataSource);
        }) */
        


        /** Find centroid of Polygon */
        let polyArrContainer = [];
        polyArrContainer.push(updatedData.isoResponse.features[0].geometry.coordinates[0]);
        let polygon = turf.polygon(polyArrContainer);
        let centroid = turf.centroid(polygon);

        /** Assign Lat / Lng vars from Centroid */
        let lng = centroid.geometry.coordinates[0];
        let lat = centroid.geometry.coordinates[1];


        /** Highlight centroid in middle of Polygon with Marker */
        this.marker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(this.map);
        this.currentMapMarkers.push(this.marker);
       
        /** Fly to position on Map */
        this.map.flyTo({
          center: [lng, lat],
          zoom: 13.5,
          speed: 0.6,
          curve: 3
        });

        
       this.mapService.findPlaces(lng, lat, updatedData.mode);
      })


      this.features = this.mapService.getFeatureData()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe( fetchedFeatureData => {
       
       this.geometryType = fetchedFeatureData[0].geometry.type;
       this.source = new FeatureCollection(fetchedFeatureData);
       const sourceid = this.mapService.getSourceId();

       /** Build Pop Up for showing data on click */
       this.map.on('click', sourceid, (e) => {
        this.buildPopup(e, sourceid);
       })
    });
    
  });

       /**
         * Need to have mouse change to pointer when over
         * the pre styled layers in the map
         */

          this.map.on('mouseenter', 'PTAL', () => {
            this.map.getCanvas().style.cursor = 'pointer';
          });

            this.map.on('mouseleave', 'PTAL', () => {
              this.map.getCanvas().style.cursor = '';
            });

              this.map.on('mouseenter', 'London Tube', () => {
                this.map.getCanvas().style.cursor = 'pointer';
              });

                this.map.on('mouseleave', 'London Tube', () => {
                  this.map.getCanvas().style.cursor = '';
                });

                this.map.on('mouseenter', 'London Bus Stops', () => {
                  this.map.getCanvas().style.cursor = 'pointer';
                });

                  this.map.on('mouseleave', 'London Bus Stops', () => {
                    this.map.getCanvas().style.cursor = '';
                  });

                    this.map.on('mouseenter', 'TfL Accidents 2015-2019', () => {
                      this.map.getCanvas().style.cursor = 'pointer';
                    });

                      this.map.on('mouseleave', 'TfL Accidents 2015-2019', () => {
                        this.map.getCanvas().style.cursor = '';
                      });

                      this.map.on('mouseenter', 'TfL Cycle Routes', () => {
                        this.map.getCanvas().style.cursor = 'pointer';
                      });

                        this.map.on('mouseleave', 'TfL Cycle Routes', () => {
                          this.map.getCanvas().style.cursor = '';
                        });

                          this.map.on('mouseenter', 'London Planning Permission', () => {
                            this.map.getCanvas().style.cursor = 'pointer';
                          });

                            this.map.on('mouseleave', 'London Planning Permission', () => {
                              this.map.getCanvas().style.cursor = '';
                            });

                              this.map.on('mouseenter', 'TfL Cycle Parking', () => {
                                this.map.getCanvas().style.cursor = 'pointer';
                              });

                                this.map.on('mouseleave', 'TfL Cycle Parking', () => {
                                  this.map.getCanvas().style.cursor = '';
                                });

                                this.map.on('mouseenter', 'park_layer', () => {
                                  this.map.getCanvas().style.cursor = 'pointer';
                                });

                                  this.map.on('mouseleave', 'park_layer', () => {
                                    this.map.getCanvas().style.cursor = '';
                                  });

                                    this.map.on('mouseenter', 'school_layer', () => {
                                      this.map.getCanvas().style.cursor = 'pointer';
                                    });

                                      this.map.on('mouseleave', 'school_layer', () => {
                                        this.map.getCanvas().style.cursor = '';
                                      });

                                      this.map.on('mouseenter', 'supermarket_layer', () => {
                                        this.map.getCanvas().style.cursor = 'pointer';
                                      });
  
                                        this.map.on('mouseleave', 'supermarket_layer', () => {
                                          this.map.getCanvas().style.cursor = '';
                                        });

                                        this.map.on('mouseenter', 'train_station_layer', () => {
                                          this.map.getCanvas().style.cursor = 'pointer';
                                        });
    
                                          this.map.on('mouseleave', 'train_station_layer', () => {
                                            this.map.getCanvas().style.cursor = '';
                                          });

                                          this.map.on('mouseenter', 'hospital_layer', () => {
                                            this.map.getCanvas().style.cursor = 'pointer';
                                          });
      
                                            this.map.on('mouseleave', 'hospital_layer', () => {
                                              this.map.getCanvas().style.cursor = '';
                                            });

                                            this.map.on('mouseenter', 'tourist_attraction_layer', () => {
                                              this.map.getCanvas().style.cursor = 'pointer';
                                            });
        
                                              this.map.on('mouseleave', 'tourist_attraction_layer', () => {
                                                this.map.getCanvas().style.cursor = '';
                                              });

        /**
         * Need to have listeners for each of the pre styled layers
         * when clicked to display the popup with the Meta Data
         */
        this.map.on('click', 'TfL Accidents 2015-2019', (e) => {
          this.buildPopup(e, 'TfL Accidents 2015-2019');
          });

          this.map.on('click', 'PTAL', (e) => {
            this.buildPopup(e, 'PTAL');
            });

            this.map.on('click', 'London Bus Stops', (e) => {
              this.buildPopup(e, 'London Bus Stops');
              });

              this.map.on('click', 'TfL Cycle Routes', (e) => {
                this.buildPopup(e, 'TfL Cycle Routes');
                });

                this.map.on('click', 'London Tube', (e) => {
                  this.buildPopup(e, 'London Tube');
                  });

                  this.map.on('click', 'London Planning Permission', (e) => {
                    this.buildPopup(e, 'London Planning Permission');
                    });

                    this.map.on('click', 'TfL Cycle Parking', (e) => {
                      this.buildPopup(e, 'TfL Cycle Parking');
                      });

                      this.map.on('click', 'Montreal Collision Data', (e) => {
                        this.buildPopup(e, 'Montreal Collision Data');
                        });

                        this.map.on('click', 'Montreal Bixi Stations', (e) => {
                          this.buildPopup(e, 'Montreal Bixi Stations');
                          });

                          this.map.on('click', 'park_layer', (e) => {
                            this.buildPopup(e, 'park_layer');
                            });

                            this.map.on('click', 'bus_stop_layer', (e) => {
                              this.buildPopup(e, 'bus_stop_layer');
                              });

                              this.map.on('click', 'train_station_layer', (e) => {
                                this.buildPopup(e, 'train_station_layer');
                                });

                                this.map.on('click', 'supermarket_layer', (e) => {
                                  this.buildPopup(e, 'supermarket_layer');
                                  });

                                  this.map.on('click', 'school_layer', (e) => {
                                    this.buildPopup(e, 'school_layer');
                                    });

                                    this.map.on('click', 'hospital_layer', (e) => {
                                      this.buildPopup(e, 'hospital_layer');
                                      });

                                      this.map.on('click', 'tourist_attraction_layer', (e) => {
                                        this.buildPopup(e, 'tourist_attraction_layer');
                                        });

   // this.mapService.fetchMaps(this.dataDocsPerPage, this.currentPage, this.authService.getUserId());
    this.form = new FormGroup({
    filecontent: new FormControl(null, {validators: [Validators.required]}
    )});

   /** Subscription: Set visibility in legend on newly added layer from library */
   this.mapService.getLibraryLayerAddedListener()
   .pipe(takeUntil(this.onDestroy$))
   .subscribe(libraryLayerToAdd => {
     let layerObj = {name: libraryLayerToAdd, visibility: true};
     this.applyVisibilityForLoadedLayer(layerObj);
   });

    /** Subscription: Set zoom level from last know when map is loaded */
    this.mapService.getZoomUpdateListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(zoomUpdate => {
      this.map.setZoom(zoomUpdate);
    })

      /** Subscription: Update Pre Styled Layers based on user interaction */
      this.mapService.getPreStyledLayerVisibilityListener()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(preStyleUpdate => {
      this.switchPreStyledMapLayer(preStyleUpdate.layer, null, preStyleUpdate.visibility, true);
      })

      /** Subscription: Listen for instruction to clear existing Map of Data Layers */
    this.mapService.getMapInstructionListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(instruction => {
      if (instruction.instruction) {
        this.removeAll();
        for (let marker of this.currentMapMarkers) {
          marker.remove();
        }
        this.currentMapMarkers = [];
        this.dataSource = [];
        this.table.renderRows();
        this.tubeLayerVisibility = false;
        this.tflAccidentsVisibility = false;
        this.tflAccidentsClusterVisibility = false;
        this.tflCycleRoutesVisibility = false;
        this.tflCycleParkingVisibility = false;
        this.ptalVisibility = false;
        this.busLabelsVisibility = false;
        this.londonPlanningPermissionVisibility = false;
        this.montrealBixiStationVisibility = false;
        this.montrealCollisionDataVisibility = false;
      }
    });
}

callFindPlaces(centroid: any) {

  setTimeout(function() {
    let centLng = centroid.geometry.coordinates[0];
    let centLat = centroid.geometry.coordinates[1];
    let marker = new mapboxgl.Marker()
    .setLngLat([centLng, centLat])
    .addTo(this.map);
    this.mapService.findPlaces(centLng, centLat, this.transportMode);
    // Add tasks to do
}, 2000);

  
}

buildGrid(features: any) {
    /** Next add the square grid to the map */
    if (this.map.getLayer('collectivesquaregrid')) {
      console.log('CollectiveSquareGrid exists just updating source with new coordinates.');
      this.map.getSource('collectivesquaregrid').setData({
        'type': 'FeatureCollection',
        'features': features
      });
    } else {
    console.log('Adding CollectiveSquareGrid for first time.');
    this.map.addSource('collectivesquaregrid',{'type': 'geojson', 'data':{
      'type': 'FeatureCollection',
      'features': features
    }});
    this.map.addLayer(
      {
        'id': 'collectivesquaregrid',
        'source': 'collectivesquaregrid',
        'type': 'line',
          'paint': {
            'line-color': '#888'
            }  
      }
        
    );
  }
}



handleAddressChange(address: any) {
  /** Remove existing markers on address change */
  if (this.addressLoaded) {
    this.resultsReturned = false;
  }
  this.qualifyingNeighbourhood = 0;
  if (this.addressLoaded) {
    this.clearMarkers();
  }
  
  if (address.formatted_address && address.geometry) {
    this.userAddress = address.formatted_address;
    this.userLatitude = address.geometry.location.lat()
    this.userLongitude = address.geometry.location.lng();
    this.mapService.testIsochrone(this.userLatitude, this.userLongitude, this.transportMode);
    this.addressLoaded = true;
  } else 
  this.snackBar.open('Invalid address entered, please try again!', 'Close', {duration: 3000});
}

changeMode(mode: string) {
  if (!this.addressLoaded) {
    return;
  } else {
      /** Remove existing markers on mode change */
      this.clearMarkers();
      this.transportMode = mode;
      console.log('Updating IsoChrone for mode: '+mode);
      this.mapService.testIsochrone(this.userLatitude, this.userLongitude, this.transportMode);
  }
}
changeTime(time: string) {
  if (this.addressLoaded) {
    let numberPortion = Number(time.substring(0,2));
    if (numberPortion == this.currentTime) {
      console.log('Already at this level of time - do nothing');
    } else {
      this.currentTime = numberPortion;
      this.currentTimeString = time;
      this.clearMarkers();
      this.mapService.testIsochrone(this.userLatitude, this.userLongitude, this.transportMode, this.currentTime);
    }
  } else {
    this.snackBar.open('Please load an address first by typing in the Search Location box!', 'Close', {duration: 3000});
  }
  
}

addGoogleResponseMarkers(hereResponse: any) {
  let categoryType = '';

  this.educationCatCount = hereResponse.categories[0].items.length;
  this.parkCatCount = hereResponse.categories[2].items.length;
  this.groceryCatCount = hereResponse.categories[3].items.length;
  this.hospitalCatCount = hereResponse.categories[4].items.length;
  this.touristAttCatCount = hereResponse.categories[5].items.length;
  this.busCatCount = hereResponse.categories[6].items.length;
  this.trainCatCount = hereResponse.categories[7].items.length;

  if (this.busCatCount > 0 && this.parkCatCount > 0 && this.hospitalCatCount > 0
    && this.educationCatCount > 0 && this.touristAttCatCount > 0 && this.groceryCatCount > 0) {
      this.qualifyingNeighbourhood = 1;
    } else {
      this.qualifyingNeighbourhood = 2;
    }

    for (let category of hereResponse.categories) {
    for (let item of category.items) {
      if (!item.categories) {
         continue;
      } else {
        for (let category of item.categories) {
          if (category.name === 'Family/General Practice Physicians' || category.name === 'Healthcare and Healthcare Support Services' 
          || category.name === 'Medical Services/Clinics') {
            categoryType = 'hospital';
            break;
          } 
          else if(category.name === 'School' || category.name === 'Educational Facility') {
            categoryType = 'school';
            break;
          }
          else if(category.name === 'Park-Recreation Area' || category.name === 'Recreation Center'  || category.name === 'Sports Facility/Venue') {
            categoryType = 'park';
            break;
          }
          else if(category.name === 'Tourist Attraction') {
            categoryType = 'tourist_attraction';
            break;
          } 
          else if(category.name === 'Bus Stop') {
            categoryType = 'bus_stop';
            break;
          }
          else if(category.name === 'Train Station') {
            categoryType = 'train_station';
            break;
          }
          else if(category.name === 'Convenience Store' || category.name === 'Grocery') {
            categoryType='supermarket';
            break;
          }
          else {
            console.log('Missing Item - not a 15 min city sorry!');
          }
        }
      }
    
        
        
        
       
    }
    if(categoryType !== '') {
      this.addCategoryLayerType(categoryType, category);
    }
    
    categoryType = '';
  }


} 

addCategoryLayerType(type: String, category: any) {

  let features = [];
  let tempObj;
  for (let entry of category.items) {
    tempObj = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [entry.position.lng, entry.position.lat]
      },
      "properties": {
        "Name": entry.title,
        "Address": entry.address.label
      }
    }
    features.push(tempObj);
    
  }
  let symbolName;

  symbolName = type;
  if (type === 'supermarket') {
    symbolName = 'grocery-15';
  }
  if (type === 'bus_stop' ) {
    symbolName = 'bus';
  }
  if (type === 'train_station') {
    symbolName = 'bus';
  }
  if (type === 'tourist_attraction') {
    symbolName = 'museum-15';
  }
  if (type === 'hospital') {
    symbolName = 'hospital-15'
  }
  if (type === 'school') {
    symbolName = 'school-15';
  }
  if (type === 'park') {
    symbolName = 'park-15';
  }

  if (this.map.getSource(type+'_source')) {
    this.map.getSource(type+'_source').setData({type:'FeatureCollection', features:features});
  } else {
    this.map.addSource(type+'_source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });
  }

  
  if (this.map.getLayer(type+'_layer')) {
    console.log('Layer already present');
  }
  else {
    this.map.addLayer(
      {
        id: type+'_layer',
        source: type+'_source',
        type: 'symbol',
        // Use "iso" as the data source for this layer
        
        layout: {'icon-image': symbolName, 'icon-size':1.8, "icon-allow-overlap": true},
        paint: {
          // The fill color for the layer is set to a light purple
        }
      },
      'poi-label'
    );
  }
 
this.isLoading = false;
}

goToLink(url: string) {
  window.open(url, "_blank");
}




updateSearch(event: Event) {
  this.value = (event.target as HTMLTextAreaElement).value;
  if (this.value === '') {
  } else {
    this.mapService.searchContent(this.value)
    .subscribe(results => {
      //console.log(results);
      this.searchDataSource = results;
      console.log(this.searchDataSource);
    });
  }
}

clearMarkers() {
  /** Remove existing markers on address change */
  //this.isLoading = true;
  console.log('address loaded is currently set to: '+this.addressLoaded);
  
  if (this.currentMapMarkers.length > 1) {
    for (let marker of this.currentMapMarkers) {
      marker.remove();
    }
    this.currentMapMarkers = [];
  }

  let layers = [  'hospital_layer', 'school_layer', 'park_layer', 'supermarket_layer', 'train_station_layer', 'tourist_attraction_layer', 'bus_stop_layer', 'collectivesquaregrid' ];
  let sources = [  'hospital_source', 'school_source', 'park_source', 'supermarket_source', 'train_station_source', 'tourist_attraction_source', 'bus_stop_source', 'collectivesquaregrid'];

  if (this.addressLoaded) {
  for (let layer of layers) {
    if (this.map.getLayer(layer)) {
      console.log('Removing Layer: '+layer);
      this.map.removeLayer(layer);
    }
  }

  for (let source of sources) {
    if (this.map.getSource(source)) {
      console.log('Removing Source: '+source);
      this.map.removeSource(source);
    }
  }
}
}

applyVisibilityForLoadedLayer(layerToAdd: any){
  if (layerToAdd.visibility) {
    if (!this.dataSource.includes({name:layerToAdd.name})){
      if (layerToAdd.colourRampInUse)  {
         this.dataSource.push({name: layerToAdd.name, colourRamp: layerToAdd.colourRamp});
      }
      else if (layerToAdd.colourPalette) {
        this.dataSource.push({name: layerToAdd.name, colourPalette: layerToAdd.colourPalette});
      }
      else {
        this.dataSource.push({name: layerToAdd.name});
      }

      this.table.renderRows();
    }
  }
}


buildPopup(e: any, name: string){
  const listDiv = document.createElement('div');
  const h2 = document.createElement('h2');
  const h3 = document.createElement('h3');
  const ul = document.createElement('ul');
  h2.innerHTML='<b>Collective</b>' ;
  h2.style['color']='violet';
  h2.style['fontSize']='18px';
  

  if (name === 'hospital_layer') {
    h3.innerHTML="<b>Hospital / Health</b>";
  }

  if (name === 'school_layer') {
    h3.innerHTML="<b>School / Education</b>";
  }

  if (name === 'supermarket_layer') {
    h3.innerHTML="<b>Supermarket / Grocery</b>";
  }

  if (name === 'park_layer') {
    h3.innerHTML="<b>Park / Recreation</b>";
  }

  if (name === 'bus_station_layer') {
    h3.innerHTML="<b>Bus Station</b>";
  }

  if (name === 'train_station_layer') {
    h3.innerHTML="<b>Train Station</b>";
  }

  //h3.innerHTML=name+ " | Data Properties";

  this.propValues = Object.values(e.features[0].properties);
  this.propKeys = Object.keys(e.features[0].properties);
  // tslint:disable-next-line: prefer-for-of
  for (let i = 0; i < this.propValues.length; ++i) {
    const li = document.createElement('li');
    li.innerHTML = '<b>' + this.propKeys[i] + '</b>' + ' : ' + this.propValues[i];
    ul.appendChild(li);
  }
  listDiv.appendChild(h2);
  listDiv.appendChild(h3);
  listDiv.appendChild(ul);

  new mapboxgl.Popup({ className: 'ocmap-popup' })
    .setLngLat(e.lngLat)
    .setHTML(listDiv.innerHTML)
    .addTo(this.map);
}


applySymbols(layerAndSymbolObject: any) {
      if (layerAndSymbolObject.symbolInUse === 'no_image') {
        this.pointPaint =   {
         'icon-color': layerAndSymbolObject.color,
         'icon-opacity' : layerAndSymbolObject.opacity
        };
        this.pointType = 'symbol';
        this.geometryType = 'Point';
     }
      if (layerAndSymbolObject.currentLabel && layerAndSymbolObject.currentLabelVisibility) {
          if (layerAndSymbolObject.symbolInUse === 'no_image') {
            layerAndSymbolObject.symbolInUse = 'base-icon';
          }
          const symbolLayout = {'icon-image': layerAndSymbolObject.symbolInUse};
          this.map.setLayoutProperty(layerAndSymbolObject.id, 'icon-image', layerAndSymbolObject.symbolInUse);
          if (layerAndSymbolObject.currentLabel) {
            const options = ['format', ['get', layerAndSymbolObject.currentLabel],
              {'text-color': '#36454f', 'text-size': 10}];
            this.map.setLayoutProperty(layerAndSymbolObject.id, 'text-field', options);
            this.map.setLayoutProperty(layerAndSymbolObject.id, 'text-variable-anchor', ['top', 'bottom', 'left', 'right']);
            this.map.setLayoutProperty(layerAndSymbolObject.id, 'text-justify', 'auto');
            this.map.setLayoutProperty(layerAndSymbolObject.id, 'text-radial-offset', 0.5);
          }

    }
    this.applySymbol(layerAndSymbolObject.id, layerAndSymbolObject.symbolInUse);

}

applyLabels(label) {
  if (label.layer.type === 'Polygon'
        || label.layer.type === 'LineString'
        || label.layer.type === 'MultiPolygon'
        || label.layer.type === 'MultiLineString') {
        const options = ['format', ['get', label.label],
              {'text-color': '#36454f', 'text-size': 10}];
        if (this.map.getLayer(label.layer.id + '_labels')) {
              this.map.setLayoutProperty(label.layer.id + '_labels', 'text-field', options);
            } else {
              this.map.addLayer({
                id: label.layer.id + '_labels',
                type: 'symbol',
                source: label.layer.id,
                layout: {
                    'text-field': options,
                    'symbol-placement': 'point'
                },
                paint: {
                    'text-color': ['case',
                        ['boolean', ['feature-state', 'hover'], false],
                        'rgba(255,0,0,0.75)',
                        'rgba(0,0,0,0.75)'
                    ],
                    'text-halo-color': ['case',
                        ['boolean', ['feature-state', 'hover'], false],
                        'rgba(255,255,0,0.75)',
                        'rgba(255,255,255,0.75)'
                    ],
                }
            });
            }

      } else if (label.layer.type === 'Point') {
          if (label.label === 'No Label') {
            this.map.setLayoutProperty(label.layer.id, 'text-field', '');
          }
          const options = ['format', ['get', label.label],
            {'text-color': '#36454f', 'text-size': 10}];
          this.map.setLayoutProperty(label.layer.id, 'text-field', options);
          this.map.setLayoutProperty(label.layer.id, 'text-variable-anchor', ['top', 'bottom', 'left', 'right']);
          this.map.setLayoutProperty(label.layer.id, 'text-justify', 'auto');
          this.map.setLayoutProperty(label.layer.id, 'text-radial-offset', 0.5);
        }
}

removeAll() {
  this.sessionDataLayers = this.mapService.getSessionDataLayers();
  for (let i = 0; i < this.sessionDataLayers.length; i++) {
    /** Store some state about map source for comparison later */
    const sourceItem = this.map.getSource(this.sessionDataLayers[i].id);
    this.tempSources.push(sourceItem);

    if (this.map.getLayer(this.sessionDataLayers[i].id)) {
      this.map.removeLayer(this.sessionDataLayers[i].id);
    }
    if (this.map.getLayer(this.sessionDataLayers[i].id + '_labels')) {
      this.map.removeLayer(this.sessionDataLayers[i].id + '_labels');
    }
    if (this.map.getLayer(this.sessionDataLayers[i].id + '-border')) {
      this.map.removeLayer(this.sessionDataLayers[i].id + '-border');
    }
    if (this.map.getSource(this.sessionDataLayers[i].id)) {
      this.map.removeSource(this.sessionDataLayers[i].id);
    }
  }
  this.sessionDataLayers = [];
}

 toggleLayer(layerId: string,  visibility?: boolean, labels?: boolean) {
  if (visibility) {
    /** Switching layer off */
    this.map.setLayoutProperty(layerId, 'visibility', 'none');
    /** In case of switching off Polygon layers 
     * you will also have to switch off the additional
     * copy of that layer you added as a line type in order to manage
     * boundary widths within polygons
     */
    if (this.map.getLayer(layerId + '-border')) {
      this.map.setLayoutProperty(layerId + '-border', 'visibility', 'none');
    }
    if (labels) {
      this.map.setLayoutProperty(layerId + '_labels', 'visibility', 'none');
    }
  } else {
    /** Switching layer on */
    this.map.setLayoutProperty(layerId, 'visibility', 'visible');
    if (this.map.getLayer(layerId + '-border')) {
      this.map.setLayoutProperty(layerId + '-border', 'visibility', 'visible');
    }
    if (labels) {
      this.map.setLayoutProperty(layerId + '_labels', 'visibility', 'visible');
    }
  }
}

setVisibilityOnLoad(layerId: string,  visibility?: boolean) {
  if (!visibility) {
    this.map.setLayoutProperty(layerId, 'visibility', 'none');
    if (this.map.getLayer(layerId + '_labels')) {
      this.map.setLayoutProperty(layerId+ '_labels', 'visibility', 'none');
     }
     if (this.map.getLayer(layerId+'-border')) {
       this.map.setLayoutProperty(layerId+'-border', 'visibility', 'none');
     }
  }
}

switchMapView(mapChangeObject) {
  /** Check if base SVF image is on map and if not then add it */
  /** FIRST SET THE UPDATED MAPVIEW VARIABLE */
  if (mapChangeObject === 'MONOCHROME' || mapChangeObject.maptype === 'MONOCHROME') {
    this.viewChosenName = 'MONOCHROME';
    this.viewChosen = environment.mapbox.monoChromeStyle;
  }
    if (mapChangeObject === 'TRANSPORT' || mapChangeObject.maptype === 'TRANSPORT') {
      this.viewChosenName = 'TRANSPORT';
      this.viewChosen = environment.mapbox.transportStyle;
    }
      if (mapChangeObject === 'SATELLITE' || mapChangeObject.maptype === 'SATELLITE') {
        this.viewChosenName = 'SATELLITE';
        this.viewChosen = environment.mapbox.satteliteStyle;
      }
        if (mapChangeObject === 'MONOCHROME LIGHT'  || mapChangeObject.maptype === 'MONOCHROME LIGHT') {
          this.viewChosenName = 'MONOCHROME LIGHT';
          this.viewChosen = environment.mapbox.monoLight;
        }
          if (mapChangeObject === 'CONSTRUCTION LOGISTICS'  || mapChangeObject.maptype === 'CONSTRUCTION LOGISTICS') {
            this.viewChosenName = 'CONSTRUCTION LOGISTICS';
            this.viewChosen = environment.mapbox.constructionLogisticsStyle;
          }

  this.mapStyle = this.viewChosen;
  this.mapService.setMapType(this.viewChosenName);
  this.mapService.setMapStyleField(this.viewChosen, mapChangeObject.maptype);

// this is not required if it's a load map event

  if (!mapChangeObject.loadMap) {
  this.sessionDataLayers = this.mapService.getSessionDataLayers();
  /** REMOVE LAYERS AND SOURCE*/
  for (let i = 0; i < this.sessionDataLayers.length; i++) {

    /** Store some state about map source for comparison later */
    const sourceItem = this.map.getSource(this.sessionDataLayers[i].id);
    this.tempSources.push(sourceItem);

    if (this.map.getLayer(this.sessionDataLayers[i].id)) {
      this.map.removeLayer(this.sessionDataLayers[i].id);
      if(this.map.getLayer(this.sessionDataLayers[i].id+'_labels')) {
        this.map.removeLayer(this.sessionDataLayers[i].id+'_labels');
      }
      if(this.map.getLayer(this.sessionDataLayers[i].id+'-border')) {
        this.map.removeLayer(this.sessionDataLayers[i].id+'-border')
      }
    }
    if (this.map.getSource(this.sessionDataLayers[i].id)) {
      this.map.removeSource(this.sessionDataLayers[i].id);
    }
  }

  this.map.setStyle(this.baseUrl +  this.viewChosen);
  this.map.on('style.load', () => {
  /** REAPPLY THE SOURCE THAT WAS REMOVED */
  for (let i = 0; i < this.sessionDataLayers.length; i++) {
        for (let tempSource of this.tempSources) {
          if (tempSource.id === this.sessionDataLayers[i].id) {
            this.mapService.setSourceId(tempSource.id);

            this.tempGeoType = tempSource._data.features[0].geometry.type;
            if (!this.map.getSource(tempSource.id)) {
              this.map.addSource(tempSource.id, {
              type: tempSource.type,
              data: tempSource._data
            });
          }         
          }
        }
  }
  let preStyledLayers = this.mapService.getPreStyledLayers();
  if (preStyledLayers.length > 0) {
    for(let layer of preStyledLayers) {
      this.toggleLayer(layer.layer, false);
    } 
}
  });
  } else {
    console.log(new Date().toISOString() + this.TAG + 'No need to remove and add layers - Initial Load Map event triggered.');
    this.map.setStyle(this.baseUrl +  this.viewChosen);
    this.delay(500)
    .then(()=> {
      if (!this.map.hasImage('base-icon')) {
        this.map.loadImage('/../assets/images/BLACK_CIRCLE.png', (error, image) => {
          if (error) { throw error; }
          this.map.addImage('base-icon', image, { 'sdf': true });
        })
      }
    })
  }
  this.snackBar.open('Map view updated!', 'Close', {duration: 3000});
}


switchPreStyledMapLayer(layerName: string, event?: Event, visibility?: boolean, mapLoad?: boolean){
  if(event) {
    event.stopPropagation();
  }
  if (layerName === 'PTAL' && this.ptalVisibility ) {
    this.toggleLayer(layerName, true);
    this.ptalVisibility = false;
    this.mapService.removePreStyledLayer(layerName);
  }
  else if(layerName === 'PTAL' && !this.ptalVisibility) {
    this.toggleLayer(layerName, false);
    this.ptalVisibility = true;
    if (!mapLoad) {
    this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
    }
  }

  else if(layerName === 'TfL Accidents 2015-2019' && this.tflAccidentsVisibility) {
    this.toggleLayer(layerName, true);
    this.tflAccidentsVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'TfL Accidents 2015-2019');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }
  else if(layerName === 'TfL Accidents 2015-2019' && !this.tflAccidentsVisibility) {
    this.toggleLayer(layerName, false);
    this.tflAccidentsVisibility = true;
    this.dataSource.push({name:'TfL Accidents 2015-2019'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if (layerName === 'TfL Accidents 2015-2019 Cluster' && this.tflAccidentsClusterVisibility) {
    this.toggleLayer(layerName, true);
    this.tflAccidentsClusterVisibility = false;
    this.mapService.removePreStyledLayer(layerName);

  }
  else if (layerName === 'TfL Accidents 2015-2019 Cluster' && !this.tflAccidentsClusterVisibility) {
    this.toggleLayer(layerName, false);
    this.tflAccidentsClusterVisibility = true;
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if (layerName === 'London Tube' && this.tubeLayerVisibility) {
    this.toggleLayer(layerName, true);
    this.tubeLayerVisibility = false;
    let index = this.dataSource.findIndex( x => x.name === 'London Tube');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }
  else if (layerName === 'London Tube' && !this.tubeLayerVisibility) {
    this.toggleLayer(layerName, false);
    this.tubeLayerVisibility = true;
    this.dataSource.push({name:'London Tube'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if(layerName === 'TfL Cycle Routes' && this.tflCycleRoutesVisibility) {
    this.toggleLayer(layerName, true);
    this.tflCycleRoutesVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'TfL Cycle Routes');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }
  else if(layerName === 'TfL Cycle Routes' && !this.tflCycleRoutesVisibility) {
    this.toggleLayer(layerName, false);
    this.tflCycleRoutesVisibility = true;
    this.dataSource.push({name:'TfL Cycle Routes'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if(layerName === 'London Planning Permission' && this.londonPlanningPermissionVisibility) {
    this.toggleLayer(layerName, true);
    this.londonPlanningPermissionVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'London Planning Permission');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }
  else if(layerName === 'London Planning Permission' && !this.londonPlanningPermissionVisibility) {
    this.toggleLayer(layerName, false);
    this.londonPlanningPermissionVisibility = true;
    this.dataSource.push({name:'London Planning Permission'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if (layerName === 'TfL Cycle Parking' && this.tflCycleParkingVisibility) {
    this.toggleLayer(layerName, true);
    this.tflCycleParkingVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'TfL Cycle Parking');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }

  else if (layerName === 'TfL Cycle Parking' && !this.tflCycleParkingVisibility) {
    this.toggleLayer(layerName, false);
    this.tflCycleParkingVisibility = true;
    this.dataSource.push({name:'TfL Cycle Parking'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }


  else if (layerName === 'London Bus Stops' && this.busLabelsVisibility) {
    this.toggleLayer(layerName, true);
    this.busLabelsVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'London Bus Stops');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }
  else if (layerName === 'London Bus Stops' && !this.busLabelsVisibility) {
    this.toggleLayer(layerName, false);
    this.busLabelsVisibility = true;
    this.dataSource.push({name:'London Bus Stops'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if (layerName === 'Montreal Bixi Stations' && this.montrealBixiStationVisibility) {
    this.toggleLayer(layerName, true);
    this.montrealBixiStationVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'Montreal Bixi Stations');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }

  else if (layerName === 'Montreal Bixi Stations' && !this.montrealBixiStationVisibility) {
    this.toggleLayer(layerName, false);
    this.montrealBixiStationVisibility = true;
    this.dataSource.push({name:'Montreal Bixi Stations'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }

  else if (layerName === 'Montreal Collision Data' && this.montrealCollisionDataVisibility) {
    this.toggleLayer(layerName, true);
    this.montrealCollisionDataVisibility = false;
    let index = this.dataSource.findIndex(x => x.name === 'Montreal Collision Data');
    this.dataSource.splice(index,1);
    this.mapService.removePreStyledLayer(layerName);
  }

  else if (layerName === 'Montreal Collision Data' && !this.montrealCollisionDataVisibility) {
    this.toggleLayer(layerName, false);
    this.montrealCollisionDataVisibility = true;
    this.dataSource.push({name:'Montreal Collision Data'});
    if (!mapLoad) {
      this.mapService.addPreStyledLayer({layer: layerName, visibility: true});
      }
  }
  this.table.renderRows();
}


  applyLayer(geometryType: string, sessionLayer?: any) {
    let layerId;
    if (sessionLayer) {
      layerId = sessionLayer.id;
    } else {
      layerId = this.mapService.getSourceId();
    }

    if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
        this.map.addLayer({
          id: layerId,
          source: layerId,
          type: this.polyType,
          paint: this.polyPaint,
          filter: ['==', '$type', 'Polygon']
        });

        /** When you add a Polygon layer
         * Add it a second time due to the inability
         * to increase polygon border width. Suggested workaround 
         * from Mapbox technical services is to add the layer again
         * as a line type.
         */
        this.map.addLayer({
          id: layerId+'-border',
          source: layerId,
          type: this.lineType,
          paint: {
            'line-color': '#000000',
            'line-width': 0
          }
        });

      }

    if (geometryType === 'Point') {
          if (!this.map.hasImage('base-icon')) {
            this.map.loadImage('/../assets/images/BLACK_CIRCLE.png', (error, image) => {
              if (error) { throw error; }
              this.map.addImage('base-icon', image, { 'sdf': true });
            })
          }
            if (this.map.getLayer(layerId) == undefined) {
              this.map.addLayer({
              id: layerId,
              source: layerId,
              type: this.pointType,
              layout: {
                'icon-image': 'base-icon',
                'icon-size': 0.3
              },
              paint: this.pointPaint,
              filter: ['==', '$type', geometryType]
            });
      }
    }

    if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
        this.map.addLayer({
              id: layerId,
              source: layerId,
              type: this.lineType,
              paint: this.linePaint,
              filter: ['==', '$type', 'LineString']
            });
          }
  }

  applySymbol(layerId: string, image: string, label?: string) {
    /** If the request was to apply no image then just
     * revert back to base, I.E base-icon
     */
    if (image === 'no_image') {
      image = 'base-icon';
    }
    const symbolLayout = {'icon-image': image};
    this.map.setLayoutProperty(layerId, 'icon-image', image);
    if (label) {
      const options = ['format', ['get', label],
        {'text-color': '#D0D6D0', 'text-size': 10}];
      this.map.setLayoutProperty(layerId, 'text-field', options);
      this.map.setLayoutProperty(layerId, 'text-variable-anchor', ['top', 'bottom', 'left', 'right']);
      this.map.setLayoutProperty(layerId, 'text-justify', 'auto');
      this.map.setLayoutProperty(layerId, 'text-radial-offset', 0.5);
    }
    }

  setMap(map: mapboxgl) {
    this.map = map;
  }

  getMap() {
    return this.map;
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms));
  }

  ngOnDestroy() {
    console.log(new Date().toISOString() + this.TAG + ' Killing all active Subs');
    this.onDestroy$.next();
    this.timerSubscription.unsubscribe();
  }

}
