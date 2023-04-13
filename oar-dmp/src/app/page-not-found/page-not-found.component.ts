import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {

  constructor() { 
    console.log("page-notfound component - constructor");
      
      
  }

  ngOnInit(): void {
    console.log("page-notfound component - ngOnInit");

    //element that we want to set position and size propertioes to
    let elemToSize = document.getElementById('PageNotFound');

    //"base element" that serves as reference point for positioning
    // next element
    let elem = document.getElementById('dmp_hdr');    
    //bounding coordinates for the "base element"
    let elemCoords = elem?.getBoundingClientRect();

    let resGridContainer = document.getElementById("resources-grid-container");    
    console.log("resources-grid-container");
    console.log(resGridContainer?.clientHeight)

    if (elemToSize != null){
      if (resGridContainer?.clientHeight != null){
        console.log(resGridContainer?.clientHeight.toString()+"px")
        let newSize:string = resGridContainer.clientHeight.toString()+"px"
        elemToSize.style.height = newSize;
        elemToSize.style.top = elemCoords?.bottom.toString+"px";
      }
    }

    

    
  }

}
