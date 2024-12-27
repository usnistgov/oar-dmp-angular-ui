import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- NgModel lives here
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component';
import { BasicInfoComponent } from './form-components/basic-info/basic-info.component';
import { PersonelComponent } from './form-components/personel/personel.component';
import { KeywordsComponent } from './form-components/keywords/keywords.component';
import { StorageNeedsComponent } from './form-components/technical-requirements/technical-requirements.component';
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

import {MatAutocompleteModule} from '@angular/material/autocomplete'; 
import { DmpRoutingModule } from './dmp-routing/dmp-routing.module';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PageErrorComponent } from './page-error/page-error.component';
import { PageDmpPublishedComponent } from './page-dmp-published/page-dmp-published.component';
import { AngularResizeEventModule } from 'angular-resize-event';
// import { ConfigModule } from './config/config.module';
import { NistResourcesModule } from './config/nist-resources.module';
import { FilterPipe } from './resource-options/filter.pipe';

import { RELEASE } from '../environments/release-info';
import { environment } from '../environments/environment';
import { CONFIG_URL, RELEASE_INFO, AuthModule, FrameModule, StaffDirModule, ConfigModule, AuthenticationService, MockAuthenticationService } from 'oarng';
import { ChipsModule } from 'primeng/chips';
import { SecurityAndPrivacyComponent } from './form-components/security-and-privacy/security-and-privacy.component';

@NgModule({
  declarations: [
    AppComponent,
    BasicInfoComponent,
    PersonelComponent,
    KeywordsComponent,
    StorageNeedsComponent,
    EthicalIssuesComponent,
    DataDescriptionComponent,
    ResourceOptionsComponent,
    DataPreservationComponent,
    DmpFormComponent,
    PageNotFoundComponent,
    PageErrorComponent,
    PageDmpPublishedComponent,
    FilterPipe,
    SecurityAndPrivacyComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    // AuthModule,
    ConfigModule,
    StaffDirModule,
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
    AngularResizeEventModule,
    NistResourcesModule,
    ChipsModule
  ],

  providers: [
    { provide: RELEASE_INFO, useValue: RELEASE },
    { provide: CONFIG_URL, useValue: environment.configUrl },
    { provide: AuthenticationService, useClass:MockAuthenticationService }
  ],

  bootstrap: [AppComponent]
})
export class AppModule {  }
