import { HttpClient, HttpClientModule, HttpHandler, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLabel, MatMenuModule, MatOptionModule, MatProgressSpinnerModule, MatSnackBarModule } from '@angular/material';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularMaterialModule } from '../angular-material.module';
import { ErrorInterceptor } from '../error-interceptor';

import { MapComponent } from './map.component';
import { MapService } from './map.service';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapComponent ],
      imports: [AngularMaterialModule, MatProgressSpinnerModule, MatOptionModule, MatMenuModule, RouterTestingModule, MatSnackBarModule, HttpClientTestingModule],
      providers: [ MapService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
