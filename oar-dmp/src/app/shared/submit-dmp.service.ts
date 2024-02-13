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

  buttonMessage:any
  // create a property Subject to which we assign a new subject and define data that this 
  //subject emits - in out case it's a string
  buttonSubject$ = new Subject<string>();

  setButtonMessage(message:any){
    this.buttonMessage = message
  }

  exportFormat:any
  exportFormatSubject$ = new Subject<string>();

  setexportFormat(message:any){
    this.exportFormat = message
  }
}
