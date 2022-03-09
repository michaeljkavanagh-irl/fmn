import { Injectable, OnDestroy, ɵɵsetComponentScope } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeoJson, FeatureCollection } from './geojson.model';
import { map, tap } from 'rxjs/operators';
import { Map} from './map.model';
import { Subject, ReplaySubject, Subscription, Observable } from 'rxjs';
import { SessionDataLayer } from './datalayer.model';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Thread } from './thread.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SafePipe } from '../sanitizer/safepipe.component';

@Injectable({providedIn: 'root'})
export class MapService implements OnDestroy{

  private image: any;
  dataDocsPerPage = 2;
  currentPage = 1;
  opts = [];
  url: SafeResourceUrl = '';
  private currentNotifications = 0;
  private libraryLayers: Map[] = [];
  private myProjects: Map[] = [];
  private uniqueProperties: any[] = [];
  private uniqueStyleProps: any[] = [];
  private uniquePropNumerical: any = [];
  private threads: Array<Thread> = [];
  private savedLayerAdded = new Subject<any>();
  private libraryLayerAdded = new Subject<any>();
  private mapsReturned = new ReplaySubject<{maps: Map[]}>(1);
  private dataLayersUpdated = new ReplaySubject<{dataLayers: Map[]}>(1);
  private sessionDataUpdated = new Subject<{sessionData: SessionDataLayer[]}>();
  private allProjectThreads = new Subject<any>();
  private styleFieldUpdated = new Subject<any>();
  private featureSymbolUpdated = new Subject<any>();
  private opacityValUpdated = new Subject<any>();
  private pointSizeValUpdated = new Subject<any>();
  private layerCentreUpdated = new Subject<any>();
  private dataLayerPriColUpdated = new Subject<any>();
  private dataLayerLabelColUpdated = new Subject<any>();
  private dataLayerIndividualColourUpdated = new Subject<any>();
  private mapStyleUpdated = new Subject<string>();
  private mapCenterUpdated = new Subject<any>();
  private uniqueListUpdate = new Subject<any>();
  private csvDataUpdated = new Subject<any>();
  private newProjectCreated = new Subject<any>();
  private mapZoomUpdated = new Subject<number>();
  private callDownload = new Subject<any>();
  private mapBearingUpdated = new Subject<number>();
  private lineSizeValUpdated = new Subject<any>();
  private polyBorderWidthValUpdated = new Subject<any>();
  private lineTypeValUpdated = new Subject<any>();
  private labelSizeValUpdated = new Subject<any>();
  private loadingNotification = new Subject<boolean>();
  private outlineColourUpdated = new Subject<any>();
  private commentUpdated = new Subject<any>();
  private markerSelected = new Subject<any>();
  private propLabelUpdated = new Subject<any>();
  private clearMapInstruction = new Subject<any>();
  private mapShareSubject = new Subject<any>();
  private loadingComplete = new Subject<boolean>();
  private loadingInProgress = new Subject<boolean>();
  private mapRightsPermission = new Subject<string>();
  private threadSelect = new Subject<any>();
  private removeLayerUpdated = new Subject<any>();
  private addLayerUpdate = new Subject<any>();
  private mapNameUpdated = new Subject<string>();
  private notifications = new Subject<any>();
  private changeBaseMap = new Subject<any>();
  private searchResultsSubject = new Subject<any>();
  private preStyledLayerVisibility = new Subject<any>();
  private projectCacheUpdateSub = new Subject<any>();
  private launchAddCommentDialogTrigger = new Subject<any>();
  private featureData = new Subject<any>();


  private isoUpdate = new Subject<any>();
  private googlePlacesResponse = new Subject<any>();

  private propLabel: string;
  private projectLoaded = false;
  private stateChanged = false;
  private dataLayerSourceId: string;
  private dataLayerStyleField: any;
  private centre: any;
  private currentMapZoom: number = 0;
  private currentMapBearing: number = 0;
  private currentMapPitch: number = 0;
  private dataLayerOpacity = 1;
  private dataPointSize = 0.5;
  private lineSize = 2;
  private polyBorderWidth = 0;
  private sessionDataLayers: Array<SessionDataLayer> = [];
  private sharedWith: string[] = [];
  private preStyledLayers: any[] = [];
  private tempListForRemoval: any[] = [];
  private sharedWithNames: string[] = [];
  private features: Array<GeoJson>;
  
  private safePipe: SafePipe = new SafePipe(this.sanitizer);
  private mapName = '';
  private mapType = '';
  private mapId = '';
  private mapStyleField = '';
  private styleType = '';
  private currentMapName = '';
  private dataLayerPrimaryColour = '';
  private dataLayerLabelColour = '';
  private outlineColour =  '';
  private searchString = '';

  TAG = ' OC~MapService: ';

  constructor(private http: HttpClient, private router: Router,private dialog: MatDialog,
              public snackBar: MatSnackBar, private sanitizer: DomSanitizer ) {
}
  ngOnDestroy() {

  }

  /**  This is a key method in the retrieval of DATA for layers.
   * The retrieval can be on the back of layers or files that have just been added
   * but is also called when a user is loading a saved map.
   * The method accepts an optional paramter called loadSavedLayer which will determine
   * whether default values are set for the layer or whether existing values are set
   * based on the users previous saved state for that layer.
   */
  fetchFeatureData(docsPerPage: number, currentPage: number, userId: string, layer?: any, layerId?: string, newFile?: boolean,
                   loadSavedLayer?: any, isMap?: boolean, lastLayer?: boolean, mapId?: string ): any {
    console.log(new Date().toISOString() + this.TAG + 'Data Feature fetch called for Data Layer: ' + layerId + 'on Project: ' +mapId);
    const layerid = layerId;
    let queryParams;
    /** Check if you are loading features for a saved map or for a standalone data layer */
    if (isMap) {
       queryParams = `?pagesize=${docsPerPage}&page=${currentPage}&userid=${userId}&id=${layerid}&isMap=true&mapId=${mapId}`;
    } else {
       queryParams = `?pagesize=${docsPerPage}&page=${currentPage}&userid=${userId}&id=${layerid}`;
    }

    
     this.http.get<{message: string, geojsons: any,
      sourceid: any, comments: any}>(environment.serverUrl + 'api/data/features/' + queryParams)
    .pipe( map((geojsonData) => {
      return geojsonData.geojsons.map(geojson => {
          return {
            id: geojson.ownerLayerId,
            type: geojson.type,
            geometry: geojson.geometry,
            properties: geojson.properties
          };
        });
    }))
    .subscribe(transformedFeatureData => {
      /** If the user has loaded a different project 
       *  since the time the layer was returned
       * dont add it to the wrong project
       */
      console.log(new Date().toISOString() + this.TAG + 'Checking if current project param is same as project param when layer was requested...');
      if (mapId !== this.mapId) {
        console.log(mapId);
        console.log(this.mapId);
        this.loadingComplete.next(true);
        this.loadingInProgress.next(false);
        return;
      } else {

      /** If we are loading a saved map. Set the layer on the map
       * using the ID from the saved object as opposed to dynamically
       * creating one for a new data layer
       */
      let colorVal;
      let dataStyleColorVal;
      let sizeVal;
      let opacityVal;
      let outlineColorVal;
      let dataDrivenStyleInUse;
      let colourRamp;
      let colourPalette;
      let dataStyleField='';
      let dataStyleFieldType;
      let visibilityVal = true;
      let colourPalleteInUseVal = false;
      let colourRampInUseVal = false;
      let currentLabelVal='';
      let currentLabelSizeVal = 'MEDIUM';
      let currentLabelColourVal;
      let symbolInUseVal = '';
      let lineType = '';
      let polyBorderWidthVal = 0;
      let propertySelected = '';
      let currentLabelVisibilityVal = false;
      let uniqueValueAssign = false;
      let uniqueValueFilterList = [];
      let originalName = layer;

      /** Carry out check on the length of the file name
       * If greater than 25 chars. Trim it to be 25 chars
       * for visibility in Style Panel Comp
       */
      if (layer.length > 25) {
        let tempName = this.fileNameChecker(layer);
        layer = tempName;
      } 

      if (loadSavedLayer) {
          /** Loading a saved Map and Layers */
          this.setSourceId(loadSavedLayer.id);
          sizeVal = loadSavedLayer.size;
          opacityVal = loadSavedLayer.opacity;
          visibilityVal = loadSavedLayer.visibility;
          polyBorderWidthVal = loadSavedLayer.polyBorderWidth;

          if(loadSavedLayer.currentLabelVisibility) {
            currentLabelVal = loadSavedLayer.currentLabel;
            currentLabelVisibilityVal = loadSavedLayer.currentLabelVisibility;
            currentLabelSizeVal = loadSavedLayer.currentLabelSize;
            currentLabelColourVal = loadSavedLayer.currentLabelColour;
          }

          if (loadSavedLayer.lineType) {
            lineType = loadSavedLayer.lineType;
          }

          if (loadSavedLayer.uniqueValueAssign) {
            uniqueValueAssign = loadSavedLayer.uniqueValueAssign;
          }

          if (loadSavedLayer.uniqueValueFilterList) {
            uniqueValueFilterList = loadSavedLayer.uniqueValueFilterList;``
          }

          if (loadSavedLayer.propertySelected) {
            propertySelected = loadSavedLayer.propertySelected;
          }

          if (loadSavedLayer.dataDrivenStylingInUse) {
            console.log(new Date().toISOString() + this.TAG + 'Data driven styling in use');
            dataStyleColorVal = loadSavedLayer.color;
            dataDrivenStyleInUse = loadSavedLayer.dataDrivenStylingInUse;
            dataStyleField = loadSavedLayer.dataStyleField;
            dataStyleFieldType = loadSavedLayer.dataStyleFieldType;
            colourRamp = loadSavedLayer.colourRamp;
            colourPalette = loadSavedLayer.colourPalette;
            colourPalleteInUseVal = loadSavedLayer.colourPalleteInUse;
            colourRampInUseVal = loadSavedLayer.colourRampInUse;
          } else {
            colorVal = loadSavedLayer.color;
          }

          if (loadSavedLayer.symbolInUse) {
            symbolInUseVal = loadSavedLayer.symbolInUse;
          }

          if (loadSavedLayer.type === 'MultiPolygon' || loadSavedLayer.type === 'Polygon') {
            outlineColorVal = loadSavedLayer.outlineColor;
          }
        } else {
          /** Loading a new Data Layer */
          this.setSourceId(layer + '-' + Date.now());
          colorVal = '#000000';
          sizeVal = 1;
          opacityVal = 1;
          outlineColorVal = '#000000';
          dataStyleColorVal = '#000000';
          dataStyleColorVal = '#000000';
          currentLabelColourVal = '#000000';
          dataDrivenStyleInUse = false;
          visibilityVal = true;
          colourRamp = '';
          colourPalette = '';
        }

      const layerId = this.getSourceId();
      this.features = transformedFeatureData;
      const flyToLocation = this.getSampleCoordinates(transformedFeatureData[0]);
      this.parseUniqueFeatureValues(transformedFeatureData);
      this.featureData.next([...this.features]);

      if (this.features[0].geometry.type === 'Point') {
        this.styleType = 'symbol';
      } else {
        this.styleType = 'fill';
      }

      /** When the data has been retrieved, checks carried out
       * add the data to the layers menu for the user
       */
      this.sessionDataLayers.push({name: layer, originalName: originalName, id: layerId, color: colorVal,
          dataStyleColor: dataStyleColorVal,
          dataStyleField: dataStyleField,
          dataStyleFieldType: dataStyleFieldType,
          outlineColor: outlineColorVal,
          polyBorderWidth: polyBorderWidthVal,
          symbolInUse: symbolInUseVal,
          lineType: lineType,
          colourRampInUse: colourRampInUseVal,
          colourPaletteInUse: colourPalleteInUseVal,
          ownerLayerId: transformedFeatureData[0].id,
          type: this.features[0].geometry.type,
          styleType: this.styleType,
          propertySelected: propertySelected,
          dataDrivenStylingInUse: dataDrivenStyleInUse,
          visibility: visibilityVal,
          opacity: opacityVal,
          size: sizeVal,
          uniqueProps: this.uniqueProperties,
          colourRamp: colourRamp,
          colourPalette: colourPalette,
          uniqueValueAssign: uniqueValueAssign,
          uniquePropNumerical: this.uniquePropNumerical,
          uniqueValueFilterList: uniqueValueFilterList,
          currentLabel: currentLabelVal,
          currentLabelSize: currentLabelSizeVal,
          currentLabelColour: currentLabelColourVal,
          flyToLocation: flyToLocation,
          currentLabelVisibility: currentLabelVisibilityVal,
          ownerProject: this.mapId});
      this.sessionDataUpdated.next({sessionData: [...this.sessionDataLayers]});

      this.uniquePropNumerical = [];
      if (newFile && !loadSavedLayer) {
          this.snackBar.open('Data Successfully Uploaded - Boom!', 'Close', {duration: 3000});
        } else if (!newFile && !loadSavedLayer) {
          this.snackBar.open('Data Layer: ' + layer + ' added - Boom!', 'Close', {duration: 3000});
        }

      if (loadSavedLayer) {
          this.savedLayerAdded.next(loadSavedLayer);
      }

      if (!isMap || lastLayer) {
        /** Declare that loading has finsihed by triggering an event */
        this.setStateChange(false);
        this.loadingComplete.next(true);
        this.loadingInProgress.next(false);
        this.layerCentreUpdated.next({lng: this.centre.lng, lat: this.centre.lat, 
          zoom: this.currentMapZoom, bearing: this.currentMapBearing, pitch: this.currentMapPitch});
          
          /**
           * Only make the call to load the pre styled layers
           * when you are loading a saved layer - 
           * otherwise it's a layer from the user's library 
           * and  you should not have to add it again. 
           * Should be idempodent but there's bad code up the chain
           * that I need to fix first. So this is temporary stop gap. 
           * Shame on me. 
           */
          if(loadSavedLayer !== null) {
            if(this.preStyledLayers.length > 0) {
              for (let layer of this.preStyledLayers) {
                this.preStyledLayerVisibility.next(layer);
              }
            }
          } else {
            this.libraryLayerAdded.next(layer);
          }
          
      }
    }
    });
  
  }



  fetchAllProjectThreads(docsPerPage: number, currentPage: number, userId: string) {
    this.threads = []
    const queryParams = `?pagesize=${docsPerPage}&page=${currentPage}&userid=${userId}`;
    return this.http.get<{threads: any}>(environment.serverUrl + 'api/data/threads' + queryParams)
    .subscribe(threadsResponse => {
       for (let i = 0; i < threadsResponse.threads.length; i++) {
        if (!threadsResponse.threads[i].resolved) {
          for (let j=0; j < threadsResponse.threads[i].comments.length; j ++) {
            if (threadsResponse.threads[i].comments[j].filePath) {
            threadsResponse.threads[i].comments[j].filePath = this.safePipe.transform(threadsResponse.threads[i].comments[j].filePath);
          }
          }
          this.allProjectThreads.next(threadsResponse);
          
      }
    }
    });
  }

    /** This method retrives the header level data for each of the
     * Data Layers. The results of which will populate the users
     * Layer Library table in the top left corner of the screen.
     * Leave the full name of the at this point without trimming.
     * It should only be trimmed to fit into the session layers panel
     * on the right hand side. (Style Panel Component)
     */
   fetchData(docsPerPage: number, currentPage: number, userId: string): any {
    const queryParams = `?pagesize=${docsPerPage}&page=${currentPage}&userid=${userId}`;
    this.http.get<{message: string, docs: any}>(environment.serverUrl + 'api/data' + queryParams)
    .pipe ( map ( layersData => {
      return { dataLayers: layersData.docs.map( doc => {
        return {
          datalayer: doc.filename,
          createddate: doc.createdDate,
          _id: doc._id,
          type: doc.type
        };
      })};
    }))
    .subscribe(transformedMapData => {
      this.libraryLayers = transformedMapData.dataLayers;
      this.dataLayersUpdated.next({dataLayers: [...this.libraryLayers]});
      
    });
  }

  /** The following method fetches the Header Level Map Information
   * and populates the results in the Users Maps table.
   */
  fetchMaps(docsPerPage: number, currentPage: number, userId: string): any {
    const queryParams = `?pagesize=${docsPerPage}&page=${currentPage}&userid=${userId}`;
    this.http.get<{fetchedProjects: any}>(environment.serverUrl + 'api/data/maps' + queryParams)
    .subscribe(returnedMapData => {
      this.myProjects = returnedMapData.fetchedProjects;
      this.mapsReturned.next({maps: [...this.myProjects]});
      
    });
  }

  printParamsOnMapLoad() {
    console.log(new Date().toISOString() + this.mapName);
    console.log(new Date().toISOString() + this.mapType);
    console.log(new Date().toISOString() + this.mapId);
    console.log(new Date().toISOString() + this.mapStyleField);
    console.log(new Date().toISOString() + this.styleType);
    console.log(new Date().toISOString() + this.currentMapName);
    console.log(new Date().toISOString() + this.dataLayerPrimaryColour);
    console.log(new Date().toISOString() + this.dataLayerLabelColour);
    console.log(new Date().toISOString() + this.outlineColour);
    console.log(new Date().toISOString() + this.uniqueProperties);
    console.log(new Date().toISOString() + this.uniqueStyleProps);
    console.log(new Date().toISOString() + this.features);
    console.log(new Date().toISOString() + this.threads);
    console.log(new Date().toISOString() + this.libraryLayers);
    console.log(new Date().toISOString() + this.myProjects);
    console.log(new Date().toISOString() + this.preStyledLayers);
    console.log(new Date().toISOString() + this.sharedWithNames);
  }

  fileNameChecker(lengthyFileName: string) {
    console.log(new Date().toISOString() + this.TAG + 'Parsing lengthy file name in checker');
    let sanitizedFileName = lengthyFileName.substring(0,25) + '...';
    return sanitizedFileName;
  }

  updateNotifcationStatus(notification: any, threadPassed?: boolean) {
    let notificationId;
    if (!threadPassed) {
       notificationId = notification._id;
    } else {
       notificationId = notification.id;
    }
    let payload = {passedObject: notification, threnotificationIdadPassed: threadPassed};
    this.http.put<{notifications: any}>(environment.serverUrl + 'api/data/notifications/' + notificationId, payload)
    .subscribe(updatedNotification => {
      //console.log(updatedNotification);
    });
  }

  /** The following method takes the inputted file information and data
   * that the users want to load and posts to the backend.
   */
  addDataLayer(filecontent: File, type?: string, newFile?: boolean, csvOptions?: any) {
    console.log(this.mapId);
    const dataObject = new FormData();
    dataObject.append('filecontent', filecontent);
    if (type) {
      dataObject.append('geojson', type);
    }
    if (csvOptions) {
      dataObject.append('lat', csvOptions.lat);
      dataObject.append('lon', csvOptions.lon);
      if (csvOptions.hasOwnProperty('country')) {
        dataObject.append('country', csvOptions.country);
      }
      if (csvOptions.hasOwnProperty('alpha2Code')) {
          dataObject.append('alpha2Code', csvOptions.alpha2Code);
        }
      if ('wgs84' in csvOptions) {
            dataObject.append('wgs84', csvOptions.wgs84);
          }
    }

    this.http.post<{message: string, createdDoc: any, layer: string}>(environment.serverUrl + 'api/data/', dataObject)
    .subscribe( (response) => {
      console.log(response);
  /*     this.fetchData(this.dataDocsPerPage, this.currentPage, this.authService.getUserId());
      if (newFile) {
        this.fetchFeatureData(this.dataDocsPerPage, this.currentPage, this.authService.getUserId(),
        response.layer, response.createdDoc._id, true, null);
      } else {
      this.fetchFeatureData(this.dataDocsPerPage, this.currentPage, this.authService.getUserId(), 
        response.layer, response.createdDoc._id, false, null);
      } */
    })
    ;
}

  parseUniqueFeatureValues(returnedFeatureData: any) {
    let properties = returnedFeatureData[0].properties;
    let type;
    for (const [propName, propValue] of Object.entries(properties)) {
      if(isNaN(Number(propValue))) {
        type = 'string';
      }
      else {
        type = 'number';
      }
      this.uniquePropNumerical.push({propname: propName, propvalue: propValue, type:type});
    }


    this.uniqueProperties =  Object.keys(returnedFeatureData[0].properties);
    this.uniqueProperties.push('No Label');

    this.uniqueStyleProps = this.uniqueProperties;
    let index = this.uniqueProperties.findIndex(x => x.prop === 'No Label');
    if (index >= 0) {
      this.uniqueStyleProps.splice(index,1);
    }
    
    
  }

  /** Save Map will pass the map information to the
   * backend. It will recieve a map name as well as a
   * type boolean which will determine
   * whether or not to create a new map or update an existing map
   */
  saveMap(id: string, name: string, update: boolean) {

     /** Get centre of Map when save is called */
    this.currentMapName = name;
    this.mapName = name;
    this.mapNameUpdated.next(this.currentMapName);
    
    const lastCentre = this.centre;
    const lastZoom = this.currentMapZoom;
    const lastBearing = this.currentMapBearing;
    const lastPitch = this.currentMapPitch;

    

    /** Only save if user has access to save. Otherwise do nothing. Checking user Privs here */
    let editAccess = false;
    let sharedWithArr = [];
    for (let project of this.myProjects) {
      if (project.mapName === this.mapName) {
      }
    }

    if (editAccess) {
    const mapData = {mapName: name, 
      //mapBaseName: this.mapType, 
      mapType: this.mapType, 
      //userId: this.authService.getUserId(),
     mapDataLayers: this.sessionDataLayers,
     lastZoomLevel: lastZoom,
     lastBearing: lastBearing,
     lastCoordinates: lastCentre,
     lastPitch: lastPitch,
     threads: this.threads,
     newMap: update,    
     sharedWith: sharedWithArr,
     originalCreator: editAccess,
     preStyledLayers: this.preStyledLayers
    };


    console.log(new Date().toISOString() + this.TAG + 'Saving update to Map: ' + name);
     this.http.put<{message: string, createdThreadDoc: any}>(environment.serverUrl + 'api/data/map/' + id, mapData)
    .subscribe(responseData => {
      console.log(responseData);
      if (responseData.createdThreadDoc) {
        this.commentUpdated.next(responseData.createdThreadDoc);
        
      }
      if (this.threads.length > 0) {
        for (let thread of this.threads) {
          if (thread._id.startsWith('Thread -')) {
            console.log(new Date().toISOString() + this.TAG + 'Found temporary item starting with Thread -');
            this.threads.splice(this.threads.indexOf(thread),1);
            console.log(new Date().toISOString() + this.TAG + 'Found temporary item replaced - inserting item returned from server');
            this.threads.push(responseData.createdThreadDoc);
          }
        }
      }
      this.loadingComplete.next(true);

      this.setStateChange(false);
    });
  }
  else {
    this.snackBar.open('Sorry, you do not have edit permissions to make changes on map: ' + name+ '.', 'Close', {duration: 3000});
    console.log(new Date().toISOString() + this.TAG + "No edit permissions. No update made. ");
  }
  }

  saveMapThread(id: string, name: string) {
    /** Only save if user has access to save. Otherwise do nothing. Checking user Privs here */
    let editAccess = false;
    let sharedWithArr = [];
    let projectOwnerId = '';
    console.log(this.myProjects);
    for (let project of this.myProjects) {
      if (project.mapName === this.mapName) {
        projectOwnerId = project.creator;
      }
    }
   
}




  clearExistingProject(preload: boolean) {
    this.mapName = '';
    this.mapId = '';
    this.mapType = '';
    this.styleType = ''
    this.currentMapName = '';
    this.mapStyleField = '';
    this.outlineColour = '';
    this.features = [];
    this.libraryLayers = [];
    this.uniqueProperties = [];
    this.uniqueStyleProps = [];
    this.dataLayerPrimaryColour = '';
    this.dataLayerLabelColour = '';
    this.projectLoaded = false;
    this.sharedWith = [];
    this.sharedWithNames = [];
    this.tempListForRemoval = this.preStyledLayers;
    this.preStyledLayers = [];
     if (this.tempListForRemoval.length > 0 ) {
      for (let layer of this.tempListForRemoval) {
        console.log(new Date().toISOString() + this.TAG + 'Clearing layer: ' + layer.layer);
        this.preStyledLayerVisibility.next(layer);
        
      } 
    } 
    
    this.mapNameUpdated.next(this.mapName);
    this.clearMapInstruction.next({instruction: true, existingPresent: true});
    this.sessionDataLayers = [];
    this.sessionDataUpdated.next({sessionData: [...this.sessionDataLayers]});
    
    if (!preload) {

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
      this.layerCentreUpdated.next({lng: position.coords.longitude, lat: position.coords.latitude});
      
      /** The preload determines whether this clearing of the map
       * was taken in advance of loading another existing map or
       * the creation of a new map  */
      this.snackBar.open('New Map Created - Boom!', 'Close', {duration: 3000});
     });
    }
  }
}

  loadProject(project) {
    console.log(project);
    this.projectLoaded = true;
    this.loadingInProgress.next(true);

    /** First check to see if a change of base map is required */
    if((project.mapType) && (project.mapType !== this.mapType)) {
      console.log(new Date().toISOString() + this.TAG + 'Base Map is different from current - calling change map for ' + project.mapType);
      this.changeBaseMap.next({maptype: project.mapType, loadMap:true} )
    }

    /** Then check to see if there are any prestyled layers */
    if (project.preStyledLayers[0]) {
      console.log(new Date().toISOString() + this.TAG + 'Project has at least 1 pre styled layer');
      for (let layer of project.preStyledLayers) {
        this.preStyledLayers.push(layer);
      }
    }
    
    /** Check privileges on the map to see if the user is an Editor, Commentor or Viewer */
    //let whoami = this.authService.getUserId();
  /*   if (project.creator !== whoami) {
      console.log(new Date().toISOString() + this.TAG + 'User did not create the project - checking permissions.....');
      if (project.sharedWith) {
        for (let i=0; i < project.sharedWith.length; i ++) {
          this.sharedWithNames.push(project.sharedWith[i].sharedWithName);
          if (project.sharedWith[i].sharedUserId === whoami) {
            this.mapRightsPermission.next(project.sharedWith[i].sharedUserAccess);
            
          }
        }
      }
    } else {
      console.log(new Date().toISOString() + this.TAG + 'User created the project - do nothing.');
      this.mapRightsPermission.next('OWNER');
      
    } */

    this.mapName = project.mapName;
    this.mapId = project._id;
    this.mapNameUpdated.next(this.mapName);
    
    this.currentMapZoom = project.lastZoomLevel;
    this.centre = project.lastCoordinates;
    this.currentMapBearing = project.lastBearing;
    this.currentMapPitch = project.lastPitchLevel;

   this.delay(1200)
    .then(() => {
    if (project.mapDataLayers.length > 0) {
      const numOfMapLayers = project.mapDataLayers.length;
      console.log(new Date().toISOString() + this.TAG + 'Fetching layers in Project');
    /*   for (let i = 0; i < numOfMapLayers; i++) {
        if (i == (numOfMapLayers - 1)) {
          this.fetchFeatureData(this.dataDocsPerPage, this.currentPage,
            this.authService.getUserId(), project.mapDataLayers[i].name, project.mapDataLayers[i].ownerLayerId,
            false, project.mapDataLayers[i], true, true, this.mapId);
        } else {
          this.fetchFeatureData(this.dataDocsPerPage, this.currentPage,
            this.authService.getUserId(), project.mapDataLayers[i].name, project.mapDataLayers[i].ownerLayerId,
            false, project.mapDataLayers[i], true, false, this.mapId);
        }
      } */

  }
  else if (project.mapDataLayers.length < 1 && this.preStyledLayers.length > 0){
      for (let layer of this.preStyledLayers) {
        this.preStyledLayerVisibility.next(layer);
        this.loadingComplete.next(true);
        this.loadingInProgress.next(false);
      }
    }
    else {
      this.layerCentreUpdated.next({lng: this.centre.lng, lat: this.centre.lat, 
        zoom: this.currentMapZoom, bearing: this.currentMapBearing, pitch: this.currentMapPitch});
      this.loadingComplete.next(true);
      this.loadingInProgress.next(false);
      
      return;
  }
})
  }
  /** This method returns the status as to whether or not the
   * Map is a new map or a saved map loaded from the users
   * Data store. This status will determine things like prompting the
   * save map name when save is called or just doing an update.
   * The this.newMap value is set in 2 ways:
   * 1 - When clear existing Map is called because the user is about
   * to load a different map or
   * 2 - When the users logs in and the status is set to true
   * from the Map Component onLoad() as it's always a new Map
   * when the user logs in.
   */

/*   isNewMap(): boolean {
    return this.newMap;
  }
 */
  /** Returns map name to pass to saveMap()
   * when changes to an existing pre loaded
   * map have been made
   */
  getMapName(): string {
    return this.mapName;
  }

  getMapId(): any {
    return this.mapId;
  }

/*   setIsNewMapStatus(status: boolean) {
    this.newMap = status;
  } */

  logout() {
    console.log(new Date().toISOString() + this.TAG + 'Killing Session Data Layers and Comments');
    this.sessionDataLayers = [];
    this.threads = [];
  }

  deleteDataLayer(dataObjectId: any) {
    this.http.delete(environment.serverUrl + 'api/data/' + dataObjectId)
     .subscribe(deleteResponse => {
       console.log(deleteResponse);
       this.loadingComplete.next(true);
       
       //this.fetchData(this.dataDocsPerPage, this.currentPage, this.authService.getUserId());
     });
  }

  getStateChangedStatus() {
    return this.stateChanged;
  }

  setStateChange(stateChanged: boolean) {
    this.stateChanged = stateChanged;
  }

  addNewlyCreatedProjectToList(project: any) {
    this.myProjects.push(project);
  }

  deleteMap(mapObjectId: any, mapName: string) {
    this.http.delete(environment.serverUrl + 'api/data/map/' + mapObjectId)
     .subscribe(deleteMapResponse => {
      this.loadingComplete.next(true);
     // this.fetchMaps(this.dataDocsPerPage, this.currentPage, this.authService.getUserId());
      this.snackBar.open('Your Map: ' + mapName + ' has been deleted.', 'Close', {duration: 3000});
      this.clearMapInstruction.next({comments: this.threads, instruction: true});
      
     });
  }


  fetchUniqueValuePickList(row: any, value: string, userId: string) {
    const queryParams = `?userid=${userId}&value=${value}&ownerLayerId=${row.ownerLayerId}`;
    this.http.get<{uniqueValues: any[], count: number}>(environment.serverUrl + 'api/data/features/list' + queryParams)
    .subscribe(fetchedPickListResponse => {
      console.log(fetchedPickListResponse);
      if (fetchedPickListResponse.count > 100) {
        console.log(this.TAG + 'Over 100 vlaues in pick list. Cannot proceed.');
        this.uniqueListUpdate.next({proceed: false});
      } else {
      this.uniqueListUpdate.next({response: fetchedPickListResponse, row:row, proceed:true});
      this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'propertySelected', value: value});
      }
    }); 
  }

  testIsochrone(lat:any, lng: any, mode: string, time?:number) {
    if (mode === 'scooter') {
      mode = 'cycling';
    }
    let queryParams;
    if (time) {
      queryParams = `?lat=${lat}&lng=${lng}&mode=${mode}&time=${time}`;
    } else {
      queryParams = `?lat=${lat}&lng=${lng}&mode=${mode}`;
    }
    this.http.get<{response: any}>(environment.serverUrl + 'api/data/isochrone/' + queryParams)
    .subscribe(isoResponse => {
      this.isoUpdate.next({isoResponse: isoResponse, mode:mode});
    });
  }

  findPlaces(lng: any, lat: any, mode: string) {
    let radius = 0;
    /** Average walking speed is 4.82KM per hour. 15mins at this would be a radius of 1.4 or 1400 metres */
    /** Average cycling / scooting speed is 19-26KM per hour. Taking median of 20KM. 15mins at this would be a radius of 5 or 5000 metres */
    if (mode === 'walking') {
      radius = 1205;
    } else {
      radius = 5000;
    }
    let queryParams = `?lat=${lat}&lng=${lng}&radius=${radius}`;
    this.http.get<{response: any}>(environment.serverUrl + 'api/data/places/' +queryParams)
    .subscribe(googleResponse => {
      this.googlePlacesResponse.next(googleResponse);
    });
}


  killSpinners(killSpinners: boolean) {
    if (killSpinners) {
      this.loadingInProgress.next(false);
      this.loadingComplete.next(true);
    }
  }

  shareMap(sharedUserIds: any, accessOption: any) {
    if (this.getMapName() === '') {
      console.log(new Date().toISOString() + this.TAG + 'You must save a map first before you share it');
    } else {
      const mapName = this.getMapName();
      const mapId = this.getMapId();
       this.loadingComplete.next(true);
       const sharedWithData = {mapid: mapId, mapname: mapName, shareduserids: sharedUserIds, sharedusername: null, sharedUserAccessType: accessOption };
       this.http.put<{message: string, createdNotification: any, firstname: string, lastname: string, sharedUserId: string}>(environment.serverUrl + 'api/data/map/share/' + mapId, sharedWithData)
       .subscribe(responseData => {
        sharedWithData.shareduserids = [];
        sharedWithData.shareduserids.push(responseData.sharedUserId);
        this.mapShareSubject.next(sharedWithData);
         this.snackBar.open('Your Map: ' + mapName + ' has been shared with ' + sharedUserIds + '!', 'Close', {duration: 3000});
       });
       
    }
  }

  getTime() {
    return new Date();
  }


  setCSVUploadData(csvData: any) {
    this.csvDataUpdated.next(csvData);
  }

  requestStaticImage(url: string) {
    this.callDownload.next({url: url, fileName: 'map_export_' + Date.now()});
    
  }

  setSourceId(id: string) {
    this.dataLayerSourceId = id;
  }

  setMapStyleField(view: string, name?: string) {
    if (name) {
      this.currentMapName = name;
    }
    this.mapStyleField = view;
    this.mapStyleUpdated.next(this.mapStyleField);
    
  }

  setMapCentre(centre: any) {
    this.centre = centre;
    this.mapCenterUpdated.next(this.centre);
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'mapCentre', value: this.centre});
  }

  setMapType(mapType: string){
    this.mapType = mapType;
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'mapType', value: this.mapType});
  }

  getMapType() {
    return this.mapType;
  }

  getMapCentre() {
    return this.centre;
  }

  setFeatureSymbol(row: any) {
    this.featureSymbolUpdated.next(row);
    console.log(row);
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'featureSymbol', value: row.symbolInUse });
    
  }

  setMapZoom(zoom: number) {
    this.currentMapZoom = zoom;
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'mapZoom', value: this.currentMapZoom});
  }

  setMapPitch(pitch: number) {
    this.currentMapPitch = pitch;
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'mapPitch', value: this.currentMapPitch});
  }

  setMapBearing(bearing: number) {
    this.currentMapBearing = bearing;
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'mapBearing', value: this.currentMapBearing});
  }

  getSourceId() {
    return this.dataLayerSourceId;
  }

  getMyProjects() {
    return this.myProjects;
  }

  setLayerStyleField(styleField: any, layerId: string, layertype: string, layerBaseColour?: string[], ownerProject?: any) {
    if (!layerBaseColour) {
      this.dataLayerStyleField = {field: styleField, layerid: layerId, layerType: layertype };
    } else {
      this.dataLayerStyleField = {field: styleField, layerid: layerId, layerType: layertype, baseColour: layerBaseColour};
    }
    this.styleFieldUpdated.next(this.dataLayerStyleField);
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: layerId, type: 'dataDrivenStylingField', value: styleField, valueType: layertype });
    
  }

  setPropLabel(row, event) {
    this.propLabel = event.value;
    this.propLabelUpdated.next({layer: row, label: this.propLabel});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'propLabel', value: this.propLabel });
  }

  updateLayerNameLocally(row, name: string) {
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'renameLayer', value: name });
  }

  setVisibilityParams(row:any, params: string[]){
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'layerVisibility', value: params});
  }


  setLayerOpacity(opacity: number, row: any) {
    this.dataLayerOpacity = opacity;
    this.opacityValUpdated.next({opacity: this.dataLayerOpacity, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'layerOpacity', value: this.dataLayerOpacity});
  }

  setPointSize(size: number, row: any) {
    this.dataPointSize = size;
    this.pointSizeValUpdated.next({size: this.dataPointSize, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'pointSize', value: this.dataPointSize});
  }

  setLineWidth(size: number, row: any) {
    this.lineSize = size;
    this.lineSizeValUpdated.next({size: this.lineSize, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'lineSize', value: this.lineSize});
  }

  setPolyBorderWidth(polyBorderWidth: number, row:any) {
    this.polyBorderWidth = polyBorderWidth;
    this.polyBorderWidthValUpdated.next({size: this.polyBorderWidth, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'polyBorderWidth', value: this.polyBorderWidth});
  }

  setLineType(row: any, lineType: string) {
    if (lineType === 'DASHED') {
      this.lineTypeValUpdated.next({lineType: [1.5,1.5], row: row});
    } else {
      this.lineTypeValUpdated.next({lineType: [1], row: row});
    }
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'lineType', value: lineType});
  }

  setPropLabelSize(row: any, size: any) {
    this.labelSizeValUpdated.next({size: size, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'text-size', value: size.value});
  }



  addPreStyledLayer(preStyledLayer: any) {
    /** If no layers present then just add it */
    console.log(preStyledLayer);
    if (this.preStyledLayers.length < 1) {
      this.preStyledLayers.push(preStyledLayer);
      this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'preStyledLayerAdd', value: preStyledLayer});
    }
    else {
      let index = this.preStyledLayers.findIndex(x => x.layer === preStyledLayer.layer);
      if (index === -1) {
        this.preStyledLayers.push(preStyledLayer);
        this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'preStyledLayerAdd', value: preStyledLayer});
        
      }
    }
  }

  removePreStyledLayer(preStyledLayer: any) {
    if (this.preStyledLayers.length < 1) {
      return;
    } else {
      let index = this.preStyledLayers.findIndex(x => x.layer === preStyledLayer);
      if (index !== -1) {
        this.preStyledLayers.splice(index,1);
        this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'preStyledLayerRemove', value: preStyledLayer});
        
      }
    }
  }

  setPrimaryLayerColour(colour: string, row: any) {
    this.dataLayerPrimaryColour = colour;
    this.dataLayerPriColUpdated.next({color: this.dataLayerPrimaryColour, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'primaryColour', value: this.dataLayerPrimaryColour});  
  }

  setLabelColour(colour: string, row: any) {
    this.dataLayerLabelColour = colour;
    this.dataLayerLabelColUpdated.next({color: this.dataLayerLabelColour, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'labelColour', value: this.dataLayerLabelColour}); 
  }

  setIndividualColourProperty(colour: string, row: any, propNameValue: any) {
    let propertyColour = colour;
    this.dataLayerIndividualColourUpdated.next({color: propertyColour, row: row, propValue:propNameValue.property});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'propertyColour', value: propertyColour, prop: propNameValue.property});
    
  }

  setOutlineColour(colour: string, row: any) {
    this.outlineColour = colour;
    this.outlineColourUpdated.next({color: this.outlineColour, row: row});
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'outlineColour', value: this.outlineColour});
  }

  setUniqueValueAssign(showUniqueValues: boolean, row: any) {
    this.projectCacheUpdateSub.next({ownerProject: row.ownerProject, ownerLayer: row.id, type: 'uniqueValueAssign', value: showUniqueValues});
    
  }

  getLayerStyleField() {
    return this.dataLayerStyleField;
  }

  getPreStyledLayers() {
    return this.preStyledLayers;
  }

   /** FlyTo the location of a particular Session Data Layer */
  flyToLoc(sessionDataLayer: any, thread?: any, threadid? :any) {
    let zoom = this.currentMapZoom;
    let bearing = this.currentMapBearing;
    let pitch = this.currentMapPitch;
    if(!sessionDataLayer) {
      this.layerCentreUpdated.next({lng: thread.lastCoordinates.lng, lat: thread.lastCoordinates.lat, zoom: zoom, bearing: bearing, pitch: pitch});
      this.markerSelected.next(thread);
      
    } else {
      this.layerCentreUpdated.next({lng: sessionDataLayer.flyToLocation.lng, lat: sessionDataLayer.flyToLocation.lat, zoom: zoom, bearing: bearing, pitch: pitch});
      
    }
  }

  searchContent(key: any): Observable<string[]> {
    this.searchString = key;
    if (this.searchString == '') {
      return;
    } else {
      const queryParams = `?value=${this.searchString}`;
      return this.http.get<any>(environment.serverUrl + 'api/data/threads/search' + queryParams)
      .pipe(map(responseDocs => responseDocs.results.map(({comment}) => comment)))
    }
  }



  /** Rather than storing the features as part of the Session Data Layer
   * we are just returning the location of a single feature
   * and then using that whenever there is a need to call the
   * FlyTo method
   */
  getSampleCoordinates(sessionDataLayer: any): any {
    let centre;
    let latitude;
    let longitude;
    if (sessionDataLayer.geometry.type === 'Point') {
      centre = sessionDataLayer.geometry.coordinates;
      longitude = centre[0];
      latitude = centre[1];
    } else if (sessionDataLayer.geometry.type === 'Polygon') {
      centre = sessionDataLayer.geometry.coordinates[0][0];
      longitude = centre[0];
      latitude = centre[1];
    } else if (sessionDataLayer.geometry.type === 'MultiPolygon') {
      centre = sessionDataLayer.geometry.coordinates[0][0][0];
      longitude = centre[0];
      latitude = centre[1];
    } else if (sessionDataLayer.geometry.type === 'LineString') {
      centre = sessionDataLayer.geometry.coordinates[0];
      longitude = centre[0];
      latitude = centre[1];
    }
    return {lng: longitude, lat: latitude};
  }


  getThreads() {
    return this.threads;
  }

  getSharedNames() {
    return this.sharedWithNames;
  }

  getProjectLoadedStatus() {
    return this.projectLoaded;
  }

  setProjectLoadedStatus(status: boolean) {
    this.projectLoaded = status;
  }

  getFeatureData() {
    return this.featureData.asObservable();
  }

  removeFromSessionLayers(index: number, row: any) {
    if (index === 0) {
      this.sessionDataLayers.shift();
    } else {
      this.sessionDataLayers.splice(index, 1);
    }
    this.removeLayerUpdated.next(row);
    this.projectCacheUpdateSub.next({ownerProject: this.mapId, ownerLayer: null, type: 'userLayerRemove', value: row.name});
  }

  getMapStyleUpdateListener() {
    return this.mapStyleUpdated.asObservable();
  }

  getSessionDataUpdateListener() {
    return this.sessionDataUpdated.asObservable();
  }

  getLayerRemovedUpdateListener() {
    return this.removeLayerUpdated.asObservable();
  }

  getZoomUpdateListener() {
    return this.mapZoomUpdated.asObservable();
  }

  getBearingUpdateListener() {
    return this.mapBearingUpdated.asObservable();
  }
  
  getIndividualColourListener() {
    return this.dataLayerIndividualColourUpdated.asObservable();
  }

  getProjectCreatedListener() {
    return this.newProjectCreated.asObservable();
  }

  getChangeMapBaseListener() {
    return this.changeBaseMap.asObservable();
  }

  getLibraryLayerAddedListener() {
    return this.libraryLayerAdded.asObservable();
  }

  getMapNameUpdateListener() {
    return this.mapNameUpdated.asObservable();
  }

  getMarkerSelectedListener() {
    return this.markerSelected.asObservable();
  }

  getNotificationsListener() {
    return this.notifications.asObservable();
  }

  getMapRightsPermissionListener() {
    return this.mapRightsPermission.asObservable();
  }

  getSavedDataLayerUpdateListener() {
    return this.savedLayerAdded.asObservable();
  }

  getFieldSymbolUpdateListener() {
    return this.featureSymbolUpdated.asObservable();
  }

  getStyleFieldUpdateListener() {
    return this.styleFieldUpdated.asObservable();
  }

  getLoadingInProgressListener() {
    return this.loadingInProgress.asObservable();
  }

  getCommentDialogLaunchListener() {
    return this.launchAddCommentDialogTrigger.asObservable();
  }

  getAllProjectThreadsListener() {
    return this.allProjectThreads.asObservable();
  }

  getThreadSelectListener() {
    return this.threadSelect.asObservable();
  }

  getLineTypeUpdateListener() {
    return this.lineTypeValUpdated.asObservable();
  }

  getLabelSizeValUpdateListener() {
    return this.labelSizeValUpdated.asObservable();
  }

  getLoadingCompleteStatusListener() {
    return this.loadingComplete.asObservable();
  }

  getStyleOpacityListener() {
    return this.opacityValUpdated.asObservable();
  }

  getDataLayerPriColUpdateListener() {
    return this.dataLayerPriColUpdated.asObservable();
  }

  getLabelColUpdateListener() {
    return this.dataLayerLabelColUpdated.asObservable();
  }
  getMapInstructionListener() {
    return this.clearMapInstruction.asObservable();
  }

  getOutlineColourUpdatedListener() {
    return this.outlineColourUpdated.asObservable();
  }

  getDataPointSizeUpdateListener() {
    return this.pointSizeValUpdated.asObservable();
  }

  getLineSizeUpdateListener() {
    return this.lineSizeValUpdated.asObservable();
  }

  getPolyBorderWidthValUpdateListener() {
    return this.polyBorderWidthValUpdated.asObservable();
  }

  getCallDownloadListener() {
    return this.callDownload.asObservable();
  }

  getSessionDataLayers() {
    return this.sessionDataLayers;
  }

  getPreStyledLayerVisibilityListener() {
    return this.preStyledLayerVisibility.asObservable();
  }

  getGooglePlacesResponseListener() {
    return this.googlePlacesResponse.asObservable();
  }

  getCSVDataUpdatedListener() {
    return this.csvDataUpdated.asObservable();
  }

  getProjectCacheUpdateSubListener() {
    return this.projectCacheUpdateSub.asObservable();
  }

  getLoadingNotificationListener() {
    return this.loadingNotification.asObservable();
  }

  getSearchResultsListener() {
    return this.searchResultsSubject.asObservable();
  }

  getMapShareSub() {
    return this.mapShareSubject.asObservable();
  }

  getPropLabelUpdatedListener() {
    return this.propLabelUpdated.asObservable();
  }

  getUniqueListUpdatedListener() {
    return this.uniqueListUpdate.asObservable();
  }

  getLayerFeatureCentreUpdatedListener() {
    return this.layerCentreUpdated.asObservable();
  }

  getCommentAddedListener() {
    return this.commentUpdated.asObservable();
  }

  getIsoUpdateListener() {
    return this.isoUpdate.asObservable();
  }

  getMapsUpdateListener() {
    return this.dataLayersUpdated.asObservable();
  }

  getMapsListener() {
    return this.mapsReturned.asObservable();
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms));
  }

}
