import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- NgModel lives here
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component';
import { BasicInfoComponent } from './form-components/basic-info/basic-info.component';
import { PersonnelComponent } from './form-components/personnel/personnel.component';
import { KeywordsComponent } from './form-components/keywords/keywords.component';
import { TechnicalRequirementsComponent } from './form-components/technical-requirements/technical-requirements.component';
import { EthicalIssuesComponent } from './form-components/ethical-issues/ethical-issues.component';
import { DataDescriptionComponent } from './form-components/data-description/data-description.component';
import { ResourceOptionsComponent } from './resource-options/resource-options.component';
import { DataPreservationComponent } from './form-components/data-preservation/data-preservation.component';
import { DmpFormComponent } from './dmp-form/dmp-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; 
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';


import { DmpRoutingModule } from './dmp-routing/dmp-routing.module';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PageErrorComponent } from './page-error/page-error.component';
import { NistResourcesModule } from './config/nist-resources.module';
import { FilterPipe } from './resource-options/filter.pipe';

import { RELEASE } from '../environments/release-info';
import { environment } from '../environments/environment';
import { CONFIG_URL, RELEASE_INFO, AuthModule, FrameModule, StaffDirModule, ConfigModule,
  AuthenticationService, MockAuthenticationService, FooterComponent, HeaderComponent } from 'oarng';


import { SecurityAndPrivacyComponent } from './form-components/security-and-privacy/security-and-privacy.component';

@NgModule({
  declarations: [
    AppComponent,
    BasicInfoComponent,
    PersonnelComponent,
    KeywordsComponent,
    TechnicalRequirementsComponent,
    EthicalIssuesComponent,
    DataDescriptionComponent,
    ResourceOptionsComponent,
    DataPreservationComponent,
    DmpFormComponent,
    PageNotFoundComponent,
    PageErrorComponent,
    FilterPipe,
    SecurityAndPrivacyComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    // AuthModule,  // enabled in production; MockAuthenticationService used in dev
    ConfigModule,
    StaffDirModule,
    FrameModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    FooterComponent,
    HeaderComponent,

    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    
    DmpRoutingModule,
    NistResourcesModule
  ],

  providers: [
    { provide: RELEASE_INFO, useValue: RELEASE },
    { provide: CONFIG_URL, useValue: environment.configUrl },
    { provide: AuthenticationService, useClass:MockAuthenticationService } // MockAuthenticationService used in dev. Comment out in production
  ],

  bootstrap: [AppComponent]
})
export class AppModule {  }