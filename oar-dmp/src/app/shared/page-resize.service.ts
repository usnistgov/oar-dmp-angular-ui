import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
// You might sometimes get NullInjectorError: No provider for Renderer2. 
// We can explicitly create renderer when its not directly available in the application using the RendererFactory.
// To solve the NullInjectorError: No provider for Renderer2 use below steps

@Injectable({
  providedIn: 'root'
})
/**
 * This service is required to dynamically resize pages that don't utilize
 * DMP form. Users get routed to these pages when something goes wrong.
 * 
 * these pages are:
 *      1) Page Not Found
 *      2) Page Error
 *      3) Page Published
 * 
 * We need to dynamically resize these pages so that the footer and the 
 * right hand side resources table do not overlap.
 * 
 * If the footer width is greater than 1280px it means we are seeing page 
 * on regular computer monitor size screen so the page needs to be padded
 * 
 * Otherwise we're seeing it in mobile device mode so no need to pad the page
 */
export class PageResizeService {
  resorcesHeight: number;
  footerWidth: number;
  renderer: Renderer2

  constructor(rendererFactory: RendererFactory2) { 
    this.resorcesHeight = 0;
    this.footerWidth = 0;
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  elementResize(elementID:string){
    const elementToObserve = document.getElementById("footer");
    const resourceOptions = document.getElementById("resource_options");
    const pageContent = document.getElementById(elementID);

    const resourcesObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        this.resorcesHeight = entry.contentRect.height;    
      }
    });

    resourcesObserver.observe(<Element>resourceOptions);

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        this.footerWidth = entry.contentRect.width;
    
        // Do something with the new dimensions
        if ( this.footerWidth > 1280){
          // if witdh of the viewing screen is greater than 1280px then extend the height of the page content container
          // to match the height of right hand side the resources table
          let contentHeight = this.resorcesHeight - 90;
          this.renderer.setStyle(pageContent, 'height', contentHeight+'px');
        }
        else{
          // We're on mobile device screen mode so no need to extend screen beyond the height of resources table
          this.renderer.setStyle(pageContent, 'height', '55px');
        }
      }
    });   

    resizeObserver.observe(<Element>elementToObserve);

  }
}
