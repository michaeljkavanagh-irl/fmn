import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatFormFieldModule,
  MatCardModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
  MatTooltipModule, MatDialogModule, MatTableModule, MatPaginatorModule,
  MatProgressBarModule,
  MatOptionModule,
  MatAutocompleteModule,
  MatSelectModule,
  MatButtonToggleModule,
  MatExpansionModule,
  MatMenuModule,
  MatAccordion,
  MatSliderModule,
  MatSnackBarModule,
  MatSnackBar,
  MatDialog,
  MAT_DIALOG_DATA, MatCheckboxModule, MatBadgeModule, MatButton, MatGridListModule, MatChipsModule} from '@angular/material';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MapComponent } from './map/map.component';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
import { ErrorInterceptor } from './error-interceptor';
import { ErrorComponent } from './error/error.component';
import { CdkTableModule } from '@angular/cdk/table';
import { NgxFileDropModule } from 'ngx-file-drop';
import { DndDirective } from './map/directives/dnd.directive';
import { MatSelectCountryModule } from '@angular-material-extensions/select-country';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SafePipe } from './sanitizer/safepipe.component';
import { SearchComponent } from './search/search.component';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    HeaderComponent,
    ErrorComponent,
    DndDirective,
    SafePipe,
    SearchComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonToggleModule,
    MatBadgeModule,
    MatSidenavModule,
    MatIconModule,
    MatAutocompleteModule,
    MatInputModule,
    MatListModule,
    MatChipsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatGridListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    CdkTableModule,
    MatOptionModule,
    MatSelectModule,
    MatMenuModule,
    NgxFileDropModule,
    MatExpansionModule,
    MatSliderModule,
    MatSnackBarModule,
    MatSelectCountryModule,
    ColorPickerModule,
    MatCheckboxModule,
    MatProgressBarModule,
    DragDropModule,
    GooglePlaceModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    , HttpClient],
  bootstrap: [AppComponent],
  entryComponents: [ErrorComponent]
})
export class AppModule { }
