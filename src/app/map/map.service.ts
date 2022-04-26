import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeoJson } from './geojson.model';
import { map } from 'rxjs/operators';
import { Subject, Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment  } from '../../environments/environment';
import { MatDialog, MatSnackBar } from '@angular/material';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({providedIn: 'root'})
export class MapService implements OnDestroy{
  dataDocsPerPage = 2;
  currentPage = 1;
  opts = [];
  url: SafeResourceUrl = '';
  private loadingNotification = new Subject<boolean>();
  private loadingComplete = new Subject<boolean>();
  private loadingInProgress = new Subject<boolean>();
  private changeBaseMap = new Subject<any>();
  private searchResultsSubject = new Subject<any>();
  private preStyledLayerVisibility = new Subject<any>();
  private featureData = new Subject<any>();
  private isoUpdate = new Subject<any>();
  private googlePlacesResponse = new Subject<any>();
  private timerSubscription: Subscription;
  private mapType = '';
  private projectLoaded = false;
  private centre: any;
  private features: Array<GeoJson>;
  private searchString = '';

  TAG = ' MFN~MapService: ';

  constructor(private http: HttpClient, private router: Router,private dialog: MatDialog,
              public snackBar: MatSnackBar, private sanitizer: DomSanitizer ) {
}
  ngOnDestroy() {
    this.timerSubscription.unsubscribe();
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


  findPlaces(lat: any, lng: any, mode: string) {
  //findPlaces(bbox: any, mode: string) {
        let radius = 0;
        if (mode === 'walking') {
          radius = 1205;
        } else {
          radius = 5000;
        }
    
        let params = {
          lat: lat,
          lng: lng,
          /* bbox: bbox,
          westLng: bbox[0],
          southLat: bbox[1],
          eastLng: bbox[2],
          northLat: bbox[3], */
          radius: radius};
          this.http.post<{response: any}>(environment.serverUrl + 'api/data/places/', params)
          .subscribe( (googleResponse) => {
            this.googlePlacesResponse.next(googleResponse);
          });
      }

  storeGrid(features: any) {
    let params = { polygons: features};
    this.http.post<{response: any}>(environment.serverUrl + 'api/data/features/', params)
          .subscribe( (response) => {
            console.log(response);
            //this.response.next(googleResponse);
          });
  }

  getMapType() {
    return this.mapType;
  }

  killSpinners(killSpinners: boolean) {
    if (killSpinners) {
      this.loadingInProgress.next(false);
      this.loadingComplete.next(true);
    }
  }

  getMapCentre() {
    return this.centre;
  }
   /** FlyTo the location of a particular Session Data Layer */
  
  searchContent(key: any): Observable<string[]> {
    this.searchString = key;
    if (this.searchString == '') {
      return;
    } else {
      const queryParams = `?value=${this.searchString}`;
      return  this.http.get<any>(environment.serverUrl + 'api/data/places/search' + queryParams)
    .pipe(map(responseDocs => 
        responseDocs.results
        .map(({title}) => title )))  

    }
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

  getChangeMapBaseListener() {
    return this.changeBaseMap.asObservable();
  }

  getLoadingInProgressListener() {
    return this.loadingInProgress.asObservable();
  }

  getLoadingCompleteStatusListener() {
    return this.loadingComplete.asObservable();
  }


  getPreStyledLayerVisibilityListener() {
    return this.preStyledLayerVisibility.asObservable();
  }

  getGooglePlacesResponseListener() {
    return this.googlePlacesResponse.asObservable();
  }

  getLoadingNotificationListener() {
    return this.loadingNotification.asObservable();
  }

  getSearchResultsListener() {
    return this.searchResultsSubject.asObservable();
  }

  getIsoUpdateListener() {
    return this.isoUpdate.asObservable();
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms));
  }

}
