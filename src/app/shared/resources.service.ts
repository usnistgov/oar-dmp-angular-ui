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

  message:any
  // create a proper ty subjectA to which we assign a new subject and define data that this 
  //subject emits - in out case it's a string
  subjectA$ = new Subject<string>();
  constructor() { }

  setMessage(data:any){
    this.message= data
  }

  getMessage(){
    return this.message
  }
}
