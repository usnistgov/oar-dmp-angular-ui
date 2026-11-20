import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

/**
 * Payload emitted on buttonSubject$. `format` is only meaningful when
 * action === 'Download' — it travels with the click itself rather than
 * through a separate side-channel subject, so there's no ordering dependency
 * between "which format" and "download now".
 */
export interface DmpButtonAction {
  action: string;      // 'Save' | 'Download'
  format?: string;     // 'PDF' | 'Markdown' | 'JSON' — present only for Download
}

@Injectable({
  providedIn: 'root'
})
export class SubmitDmpService {

  constructor() { }
  //we create methods in the service file which performs certain tasks for the components. 
  //Then we call these methods from the components.

  buttonMessage: DmpButtonAction | undefined;
  // create a property Subject to which we assign a new subject and define data that this 
  //subject emits - now a structured action instead of a bare string
  buttonSubject$ = new Subject<DmpButtonAction>();

  setButtonMessage(message: DmpButtonAction) {
    this.buttonMessage = message;
  }
}