import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubmitDmpService {

  constructor() { }
  //we create methods in the service file which performs certain tasks for the components. 
  //Then we call these methods from the components.

  resetMessage:any
  // create a property Subject to which we assign a new subject and define data that this 
  //subject emits - in out case it's a string
  resetSubject$ = new Subject<string>();

  setResetMessage(message:any){
    this.resetMessage = message
  }
}
