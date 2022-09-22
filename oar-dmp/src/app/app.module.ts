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
import { DataCategoriesComponent } from './form-components/data-description/data-description.component';
import { ResourceOptionsComponent } from './resource-options/resource-options.component';
import { DataPreservationComponent } from './form-components/data-preservation/data-preservation.component';
import { OARngModule } from 'oarng';
import { FrameModule } from 'oarng';

@NgModule({
  declarations: [
    AppComponent,
    BasicInfoComponent,
    PersonelComponent,
    KeywordsComponent,
    StorageNeedsComponent,
    EthicalIssuesComponent,
    DataCategoriesComponent,
    ResourceOptionsComponent,
    DataPreservationComponent
    
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    OARngModule,
    FrameModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
