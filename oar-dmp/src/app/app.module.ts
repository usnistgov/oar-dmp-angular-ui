import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component';
import { BasicInfoComponent } from './basic-info/basic-info.component';
import { PersonelComponent } from './personel/personel.component';
import { KeywordsComponent } from './keywords/keywords.component';
import { StorageNeedsComponent } from './storage-needs/storage-needs.component';
import { EthicalIssuesComponent } from './ethical-issues/ethical-issues.component';
import { DataCategoriesComponent } from './data-categories/data-categories.component';
import { ResourceOptionsComponent } from './resource-options/resource-options.component';
import { DataPreservationComponent } from './data-preservation/data-preservation.component';
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
    FrameModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
