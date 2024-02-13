import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; 

import { AngularResizeEventModule } from 'angular-resize-event';

import { FrameModule, AuthenticationService, MockAuthenticationService } from 'oarng';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { DmpRoutingModule } from './dmp-routing/dmp-routing.module';
import { DomPositioningModule } from './shared/dom-positioning.module';
import { NistResourcesModule } from './config/nist-resources.module';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [ AppComponent ],
        imports: [
            HttpClientTestingModule,
            BrowserModule,
            FormsModule,
            FrameModule,
            ReactiveFormsModule,
            BrowserAnimationsModule,

            MatTableModule,
            MatInputModule,
            MatButtonModule,
            MatDatepickerModule,
            MatNativeDateModule,
            MatCheckboxModule,
            MatDialogModule,

            MatAutocompleteModule,
            DmpRoutingModule,
            DomPositioningModule,
            AngularResizeEventModule,
            NistResourcesModule
        ],
        providers: [
            { provide: AuthenticationService, useClass: MockAuthenticationService },
            { provide: APP_BASE_HREF, useValue: "/test" },
            DomPositioningModule
        ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'dmp_ui2'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('dmp_ui2');
  });


});
