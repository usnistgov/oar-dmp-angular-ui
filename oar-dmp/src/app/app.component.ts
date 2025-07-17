import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { Credentials, AuthenticationService, StaffDirectoryService } from 'oarng';
import { SubmitDmpService } from './shared/submit-dmp.service';
import { DropDownSelectService } from './shared/drop-down-select.service';
import { FormChangedService } from './shared/form-changed.service';

interface Messages {
    [key: string]: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dmp_ui2';
  readyDisplay: boolean = false;
  creds: Credentials|null = null;
  
  authMessage: string = "You are not authenticated.";

  loginPNG: string = 'assets/images/checked-user.png'

  alttext: string="Icon of a user drawing with a check mark to indicated loggedin status"

  exportType: string = "";
  exportFormats = [
    {
      id: "1",
      format: 'PDF'
    },
    {
      id: "2",
      format: 'Markdown'
    },
    {
      id: "3",
      format: 'JSON'
    }
  ];
  disableSaveBtn:boolean = false;
  disableDownloadBtn:boolean = true;

  formChangedSubscription!: Subscription | null;  
  
  constructor(public authService: AuthenticationService,
            private sdsvc: StaffDirectoryService,            
            private form_buttons: SubmitDmpService,
            private dropDownService: DropDownSelectService,
            private formChangedService: FormChangedService)
  { }


  ngOnInit(): void {
    this.authService.getCredentials().subscribe({
        next: (info: Credentials) =>{
            if (info.token) {
                // Authenticated
                this.creds = info;
                this.authMessage = "Welcome, "+(this.creds.userAttributes.userName || this.creds.userId);
                this.sdsvc.setAuthToken(info.token)
            }
            else
                this.authMessage = "You are not logged in.";

            this.readyDisplay = true;
        },
        error: (err: any) => {
            this.readyDisplay = true;
            if (err.status && err.status >= 500) {
                console.error("Auth server failure: "+err.message);
                this.authMessage = "Unable to log in; authentication server error";
            }
            else if (err.status && err.status == 401) {
                console.error("Auth server reports: user is unauthorized: "+err.message);
                this.authMessage = "User Log-in failure";
            }
            else {
                console.error("Auth server communication failure: "+err.message);
                this.authMessage = "Unable to log in; authentication server communtication error";
            }
        }
    });

    this.saveButtonSubscribe();
  }

  setExportFormat(){
    let dataFormat = this.dropDownService.getDropDownText(this.exportType, this.exportFormats)[0].format;
    this.form_buttons.setexportFormat(dataFormat);
    this.form_buttons.exportFormatSubject$.next(dataFormat);
    this.form_buttons.setButtonMessage('Download');
    this.form_buttons.buttonSubject$.next('Download');
    this.disableDownloadBtn = false;
    
  }

  dmpButtonClick(e:any){
    //send message to dmp form component indicating which button has been pressed
    //the e event captures the text of the button so we pass tat to the form to
    //indicate the course of action. The options should be 'Reset', 'Save' and 'Publish'
    this.form_buttons.setButtonMessage(e.currentTarget.innerText);
    this.form_buttons.buttonSubject$.next(e.currentTarget.innerText);
    
  }

  //subscribe to a particular subject
  saveButtonSubscribe() {
    if (!this.formChangedSubscription) {
      //subscribe if not already subscribed
      this.formChangedSubscription = this.formChangedService.disableSaveBtn$.subscribe({
        next: (message) => {
          this.disableSaveBtn = message;          
        }
      });
    }
  }
  
}
