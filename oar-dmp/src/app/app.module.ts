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
import { OARngModule } from 'oarng';
import { FrameModule } from 'oarng';
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
import { DomPositioningModule } from './shared/dom-positioning.module';
import { AngularResizeEventModule } from 'angular-resize-event';
import { ConfigModule } from './config/config.module';
import { NistResorucesModule } from './config/nist-resources.module';
import { FilterPipe } from './resource-options/filter.pipe';
import { fakeBackendProvider } from './_helpers/fakeBackendInterceptor';

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
    FilterPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    OARngModule,
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
    ConfigModule,
    NistResorucesModule
  ],
  providers: [fakeBackendProvider],
  bootstrap: [AppComponent]
})
export class AppModule {  }
