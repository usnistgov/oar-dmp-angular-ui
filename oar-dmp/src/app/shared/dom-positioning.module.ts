import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forEach } from 'lodash';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class DomPositioningModule { 
  /**
   * This function positions an element right below the
   * reference element.
   * 
   * It takes two arguments:
   * the DOM id of the element that we are trying to position
   * @param elemID
   * the DOM id of the element that is used as a reference 
   * under which we need to position the new element
   * @param refElemID
   */
  setDomElementTop(elemID:string, refElemID:string){  
    let elemToSize = document.getElementById(elemID);
    let refElem = document.getElementById(refElemID);
    if (elemToSize != null && refElem != null){
      let elemCoords = refElem?.getBoundingClientRect();
      elemToSize.style.top = elemCoords?.bottom.toString+"px";
    }
  }
  
   /**
   * 
   * @param elemID 
   * @param refElemID 
   */
  horizontalDomAdjust(elemID:string, refElemID:string){  
    let elemToSize = document.getElementById(elemID);
    let refElem = document.getElementById(refElemID);
    if (elemToSize != null && refElem != null){
      let targetCoords = elemToSize?.getBoundingClientRect();
      let refCoords = refElem?.getBoundingClientRect();
      let shiftRight = refCoords.right - targetCoords.width - 10;
      elemToSize.style.left= shiftRight.toString() + "px";
    }
  }

  elementWidthAdjustment(elemID:string, refElemID:string){  
    let elemToSize = document.getElementById(elemID);
    let refElem = document.getElementById(refElemID);
    if (elemToSize != null && refElem != null){
      let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let refCoords = refElem?.getBoundingClientRect();
      let calcWidth = windowWidth-refCoords.width - 30;
      elemToSize.style.width= calcWidth.toString() + "px";
    }
  }


}


