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

  /** true => save button disabled (no unsaved changes). */
  disableSaveBtn$ = new Subject<boolean>();

  /** true => there are unsaved changes (button shows the "update" style). */
  hasUnsavedChanges$ = new Subject<boolean>();
}
