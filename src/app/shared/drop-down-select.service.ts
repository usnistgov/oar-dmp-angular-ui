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
        return (_.includes(id,o.id));
    });
    return selObj;
  }
}
