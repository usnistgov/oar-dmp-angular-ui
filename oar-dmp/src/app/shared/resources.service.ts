//This is a service for sending messages between different components
// specifically to send messages to resource-options component to highlihgt
// options available from NISt resources for the Data Management Plans

// In the child, we need to import the service file to be able to use it. 
// Then we inject the service in the constructor.

import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  //we create methods in the service file which performs certain tasks for the components. 
  //Then we call these methods from the components.

  storageMessage:any
  // create a property storageSubject to which we assign a new subject and define data that this 
  //subject emits - in out case it's a string
  storageSubject$ = new Subject<string>();

  //property for seting software options
  softwareSubject$ = new Subject<string>();
  softwareMessage:any

  //property for seting database options
  databaseSubject$ = new Subject<string>();
  databaseMessage:any

  //property for seting website options
  websiteSubject$ = new Subject<string>();
  websiteMessage:any

  //property for seting data categories to inform
  // technical requirements module 
  dataCategories$ = new Subject<boolean>();
  dataCategoriesIsSet:boolean = false

  constructor() { }

  setStorageMessage(data:any){
    this.storageMessage = data
  }

  // getMessage(){
  //   return this.message
  // }

  setSoftwareMessage(data:any){
    this.softwareMessage = data
  }

  // getSoftwareMessage(){
  //   return this.softwareMessage
  // }

  setDatabaseMessage(data:any){
    this.databaseMessage = data
  }

  setWebsiteMessage(data:any){
    this.websiteMessage = data
  }

  setDataCategories(data:boolean){
    this.dataCategoriesIsSet = data;
  }

  
}
