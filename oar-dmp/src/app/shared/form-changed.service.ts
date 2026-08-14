import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { BehaviorSubject, Subject } from 'rxjs';

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

  /** The ID of the DMP currently open in the editor; null when on /new or no record loaded. */
  currentDmpId$ = new BehaviorSubject<string | null>(null);
}
