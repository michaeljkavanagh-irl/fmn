import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject  } from 'rxjs';
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
  TAG = ' MFN~SearchComponent: ';
    /** Master Unsubscribe Listener. Will be called 
   * from OnDestroy hook and each subscription has 
   * a corresponding takeUntil for memory management
   */
  private onDestroy$: Subject<void> = new Subject<void>();
  constructor(public mapService: MapService ) { }
 

  ngOnInit() {
  }

  updateSearch(event: Event) {
    this.value = (event.target as HTMLTextAreaElement).value;
    if (this.value === '') {
      return;
    } else {
      this.mapService.searchContent(this.value)
      .subscribe(results => {
        console.log(results);
        this.dataSource = results;
      });
    }
  }

  removeResults() {
    this.dataSource = [];
  }

  isOpened(event: any) {
    console.log(event);
  }

  ngOnDestroy() {
    this.onDestroy$.next();
  }

}
