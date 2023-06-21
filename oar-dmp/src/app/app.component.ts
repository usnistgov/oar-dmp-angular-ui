import { Component } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { DomPositioningModule } from './shared/dom-positioning.module';
import { UserDetails, deepCopy, AuthInfo, LibWebAuthService } from 'oarng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dmp_ui2';
  authorized:boolean = false;
  readyDisplay: boolean = false;

  
  constructor(private dom:DomPositioningModule,
    public libWebAuthService: LibWebAuthService){ 
  }

  width: number = 0;
  height: number = 0;

  ngOnInit(): void {
    this.libWebAuthService.getAuthInfo().subscribe({
        next: (info) =>{
            if (info.token) {
                // this.wizardService.setToken(info.token);
                this.authorized = true;
            }
            else if (info.userDetails && info.userDetails.userId) {
                // the user is authenticated but not authorized
                // No user info returned at this time
            }
            else {
                // the user is not authenticated!
                // Do nothing
            }

            this.readyDisplay = true;
        },
        error: (err) => {
            //Do nothing for now
            this.readyDisplay = true;
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
