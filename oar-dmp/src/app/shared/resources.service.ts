//This is a service for sending messages between different components
// specifically to send messages to resource-options component to highlihgt
// options available from NIST resources for the Data Management Plans

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

  storageMessage: any;
  // create a property storageSubject to which we assign a new subject and define data that this
  // subject emits - in our case it's a string
  storageSubject$ = new Subject<string>();

  // property for setting software options
  softwareSubject$ = new Subject<string>();

  // property for setting database options
  databaseSubject$ = new Subject<string>();

  // property for setting website options
  websiteSubject$ = new Subject<string>();

  // property for setting data categories to inform
  // technical requirements module
  dataCategories$ = new Subject<boolean>();
  dataCategoriesIsSet: boolean = false;

  constructor() { }

  setStorageMessage(data: any) {
    this.storageMessage = data;
  }

  setDataCategories(data: boolean) {
    this.dataCategoriesIsSet = data;
  }
}