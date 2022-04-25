import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog, MatSnackBar, ThemePalette } from '@angular/material';
import { environment } from '../../environments/environment';
import { ErrorComponent } from '../error/error.component';
import { MapService } from '../map/map.service';
import { MapComponent } from '../map/map.component';
import {io} from 'socket.io-client/build';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  socket;
  whoami;
  userIsAuthenticated = false;
  currentMap = 'Untitled';
  savedMapLoaded = false;
  selectedOption: string;
  isProcessing = false;
  html2canvas: any;
  sideNavHidden = false;
  rightSideNavHidden = true;
  color: ThemePalette = 'accent';
  numberOfNotifications = null;
  matBadgeHidden = false;
  accessLevel = '';
  notifications: any[] = [];
  sharedNames: any[] = [];
  projectEditAccess = true;
  userType: string;
  value = 'Search Content';


  /** Master Unsubscribe Listener. Will be called 
   * from OnDestroy hook and each subscription has 
   * a corresponding takeUntil for memory management
   */
   private onDestroy$: Subject<void> = new Subject<void>();
  

  TAG = ' OC~HeaderComponent: ';
  @ViewChild('myMap', {static: false}) myMap: MapComponent;
  constructor(
              private dialog: MatDialog, public mapService: MapService, public snackBar: MatSnackBar) {

              }

  ngOnInit() {
    
  /*   this.authService.getUserTypeListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(userType => {
      this.userType = userType;
    })
    this.setUpSocketConnection();
    this.userType = this.authService.getUserType();
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.whoami = this.authService.getUserName();


    this.authService.getAuthStatusListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(isAuthenticated => {
      this.userIsAuthenticated = isAuthenticated;
    });
    
    this.mapService.getMapNameUpdateListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(mapName => {
      this.currentMap = mapName;
      if (this.currentMap === 'Untitled') {
        this.savedMapLoaded = false;
      } else {
        this.savedMapLoaded = true;
        this.currentMap = mapName;
      }
    }); */

 /*    this.mapService.getNotificationsListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(notification => {
      if (this.notifications.some(({_id}) => _id === notification._id) ) {
        console.log(new Date().toISOString() + this.TAG + 'Notification already present');
      } else {
        this.notifications.push(notification);
      }
      });

      this.mapService.getMapRightsPermissionListener()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(userRights => {
        if (userRights === 'OWNER') {
          this.projectEditAccess = true;
          this.accessLevel = '';
        }
        else if (userRights === 'EDITOR' ) {
          this.projectEditAccess = true;
          this.accessLevel = userRights;
        }
        else if (userRights === 'COMMENTOR' ) {
          this.projectEditAccess = false;
          this.accessLevel = userRights;
        }
        else {
          this.accessLevel = userRights;
          this.projectEditAccess = false;
        }
      }) */
  }


  onLogout() {
    this.accessLevel = '';
    this.numberOfNotifications = null;
    this.notifications = [];
    this.mapService.clearExistingProject(true);
    this.mapService.setProjectLoadedStatus(false);
    this.isProcessing = false;
  }

  ngOnDestroy() {
    this.onDestroy$.next();
  }

  readNotification(notification: any) {
    if (this.numberOfNotifications <= 1) {
      this.numberOfNotifications = null;
    } else {
      this.numberOfNotifications = this.numberOfNotifications -1;
    }
    if (notification.notificationType === 'MapShare') { //possibly irrelevant check if you are only loading those in the first place?
      //First mark the notificaiton as Read.
      this.mapService.updateNotifcationStatus(notification);
      //YOU NEED A SPINNER HERE
      //const activeMap = this.sideNavService.sessionDataLayersPresent();
 /*    if (activeMap) {
      this.mapService.clearExistingProject(true);
    } */
    let projects = this.mapService.getMyProjects();
      for (let project of projects) {
        if(project.mapName === notification.mapName) {
          this.mapService.loadProject(project);
        }
      }
    }
  }



  toggleSidenav() {
    if (this.sideNavHidden) {
      this.sideNavHidden = false;
    } else {
      this.sideNavHidden = true;
    }
 }

 toggleStylePanel() {
    if (this.rightSideNavHidden) {
      this.rightSideNavHidden = false;
    } else {
      this.rightSideNavHidden = true;
    }
  }

  saveMapPrompt() {
    if (!this.mapService.getProjectLoadedStatus()) {
      this.dialog.open(ErrorComponent, {data: {message: 'Sorry, you need to create a project before saving layers! ' 
      + ' You can create a project on the left hand side panel once you are an Our Collective editor. '}});
    } else {
      this.isProcessing = true;
      const mapName = this.mapService.getMapName();
      const mapId = this.mapService.getMapId();
      this.mapService.saveMap(mapId, mapName, false);
      
      this.mapService.getLoadingCompleteStatusListener()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(result => {
      this.isProcessing = false;
      this.dialog.closeAll();
      this.snackBar.open('Map updated!', 'Close', {duration: 3000});
    });
  }
}


  exportMap() {
    console.log('Export map function called');
    this.mapService.requestStaticImage(environment.serverUrl);
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms));
  }
}
