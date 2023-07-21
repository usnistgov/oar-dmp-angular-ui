import { Component } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { DomPositioningModule } from './shared/dom-positioning.module';
import { Credentials, AuthenticationService } from 'oarng';

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
  
  constructor(private dom:DomPositioningModule,
              public authService: AuthenticationService)
  { }

  width: number = 0;
  height: number = 0;

  ngOnInit(): void {
    this.authService.getCredentials().subscribe({
        next: (info: Credentials) =>{
            if (info.token) {
                // Authenticated
                this.creds = info;
                this.authMessage = "Welcome, "+(this.creds.userAttributes.userName || this.creds.userId)
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

  onResized(event: ResizedEvent) {
    this.width = event.newRect.width;
    this.height = event.newRect.height;
    this.dom.setDomElementTop("resources-grid-container", "dmp_hdr");
    this.dom.horizontalDomAdjust("resource_options", "dmp_hdr");
    this.dom.elementWidthAdjustment("dmp_panel", "resource_options");
    this.dom.panelHeightAdjustment("PageNotFound", "resource_options");
    this.dom.panelHeightAdjustment("DmpPublished", "resource_options");
    this.dom.panelHeightAdjustment("PageError", "resource_options");
    // this.dom.panelHeightAdjustment("", "");
    // this.dom.elementWidthAdjustment("dmp_panel", "resource_options");
    // this.dom.elementWidthAdjustment("dmp_panel", "resource_options");
  }

  
  
}
