import { Component } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { Credentials, AuthenticationService, StaffDirectoryService } from 'oarng';

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
  
  
  constructor(public authService: AuthenticationService,
              private sdsvc: StaffDirectoryService)
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
    })
  } 
  
}
