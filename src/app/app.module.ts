import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { SearchComponent } from './search/search.component';
import { AppComponent } from './app.component';
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
  MatSliderModule,
  MatSnackBarModule,MatCheckboxModule, MatBadgeModule, MatGridListModule, MatChipsModule} from '@angular/material';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { ErrorInterceptor } from './error-interceptor';
import { ErrorComponent } from './error/error.component';
import { CdkTableModule } from '@angular/cdk/table';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MapComponent } from './map/map.component';


@NgModule({
  declarations: [
    SearchComponent,
    MapComponent,
    AppComponent,
    ErrorComponent
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
    MatExpansionModule,
    MatSliderModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatProgressBarModule,
    GooglePlaceModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
     HttpClient],
  bootstrap: [AppComponent],
  entryComponents: [ErrorComponent]
})
export class AppModule { }
