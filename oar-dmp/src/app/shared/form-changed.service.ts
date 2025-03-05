import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormChangedService {

  constructor() { 
    // this.enableSaveButton = false;
  }

  // enableSaveButton:boolean;
  disableSaveBtn$ = new Subject<boolean>();

  // toggleSaveButton(enable:boolean){
  //   this.enableSaveButton = enable
  // }
}
