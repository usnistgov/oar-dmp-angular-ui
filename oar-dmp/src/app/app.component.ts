import { Component } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { DomPositioningModule } from './shared/dom-positioning.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dmp_ui2';
  
  constructor(private dom:DomPositioningModule){ 
  }

  width: number = 0;
  height: number = 0;

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
