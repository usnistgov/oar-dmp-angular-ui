import { Injectable } from '@angular/core';
//for selcting options from dropdown select
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class DropDownSelectService {

  constructor() { }

  /**
   * Returns the entries of `object` whose string `id` is matched by `id`
   * (substring inclusion via _.includes, preserving the original behavior).
   * @param id      The id (or string containing it) to match against.
   * @param object  Array of items, each carrying a string `id`.
   */
  getDropDownText<T extends { id: string }>(id: string, object: T[]): T[] {
    const selObj = _.filter(object, (o) => _.includes(id, o.id));
    return selObj;
  }

  /**
   * Returns the entries of `object` whose numeric `id` equals `selID`.
   * `selID` arrives as a string (from a form control) and is coerced to a
   * number before matching; a non-numeric `selID` yields an empty array.
   * @param selID   The selected id as a string.
   * @param object  Array of items, each carrying a numeric `id`.
   */
  getDropDownSelection<T extends { id: number }>(selID: string, object: T[]): T[] {
    let selObj: T[] = [];
    if (!isNaN(Number(selID))) {
      const target = Number(selID);
      selObj = _.filter(object, (o) => o.id === target);
    }
    return selObj;
  }

}