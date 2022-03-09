import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { TestBed, async } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule, MatIconModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularMaterialModule } from './angular-material.module';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { HeaderComponent } from './header/header.component';
import { MapService } from './map/map.service';
import { SideNavRightService } from './sidenav-right-collab/sidenavrightcollab.service';
import { SideNavService } from './sidenav/sidenav.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, AngularMaterialModule, MatProgressSpinnerModule, MatProgressBarModule, MatSelectModule, MatMenuModule,
        MatIconModule, ReactiveFormsModule, MatBadgeModule, MatSnackBarModule, HttpClientTestingModule
      ],
      declarations: [
        AppComponent, HeaderComponent
      ],
      providers:  [SideNavRightService, SideNavService, MapService, AuthService]
    }).compileComponents();
  }));

/*   it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'mapev'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('mapev');
  }); */

 /*  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('mapev app is running!');
  }); */
});
