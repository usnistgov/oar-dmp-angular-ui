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

@NgModule({
  declarations: [
    AppComponent,
    BasicInfoComponent,
    PersonelComponent,
    KeywordsComponent,
    StorageNeedsComponent,
    EthicalIssuesComponent,
    DataCategoriesComponent,
    ResourceOptionsComponent
    
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
