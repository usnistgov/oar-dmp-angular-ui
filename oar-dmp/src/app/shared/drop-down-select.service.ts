import { Injectable } from '@angular/core';
//for selcting options from dropdown select
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class DropDownSelectService {

  constructor() { }

  getDropDownText(id: string, object: any){
    const selObj = _.filter(object, function (o) {
        return (
          _.includes(id,o.id)
          );
    });
    return selObj;
  }

  getDropDownSelection(selID: string, object: any){
    var selObj = [];
    if(!isNaN(Number(selID ))){
      selObj = _.filter(object,{id:Number(selID)});
      
    }
    return selObj;
    
  }

  getDropDownID(fName: string, lName:string, object: any){
    const selObj = _.filter(object, { firstName:fName, lastName:lName });
    return selObj;
  }
}
