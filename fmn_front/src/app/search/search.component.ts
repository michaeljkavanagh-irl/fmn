import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {  MatMenu,  MatMenuTrigger } from '@angular/material';
import { Subject  } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MapService } from '../map/map.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {

  threadTitle = 'Results';
  value = '';
  dataSource: any[] = [];
  displayedColumns: string[] = ['Comment'];
  searchResultsFound = false;

    /** Master Unsubscribe Listener. Will be called 
   * from OnDestroy hook and each subscription has 
   * a corresponding takeUntil for memory management
   */
  private onDestroy$: Subject<void> = new Subject<void>();
  //@ViewChild('searchMenu', {static: false}) searchMenu: MatMenu;
  //@ViewChild('searchMenuTrigger', {static:false}) searchMenuTrigger: MatMenuTrigger;
  constructor(public mapService: MapService ) { }
 

  ngOnInit() {
    this.mapService.getSearchResultsListener()
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(results => {
      this.searchResultsFound = true;
      this.dataSource = results;
      //this.searchMenuTrigger.openMenu();
      
      console.log(this.dataSource);
    })
  }

  updateSearch(event: Event) {
    this.value = (event.target as HTMLTextAreaElement).value;
    if (this.value === '') {
      //this.searchMenuTrigger.closeMenu();
    } else {
      this.mapService.searchContent(this.value);
    }
  }

  isOpened(event: any) {
    console.log(event);
  }

  ngOnDestroy() {
    this.onDestroy$.next();
  }



}
