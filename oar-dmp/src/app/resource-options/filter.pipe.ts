import { Pipe, PipeTransform } from '@angular/core';
import { lowerCase } from 'lodash';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(items: Object, searchText: string[]): boolean {
    if (!items) {
      return false;
    }
    if (!searchText) {
      return false;
    }

    // convert searchText to lowerCase
    // searchText = searchText.toLocaleLowerCase();

    // let searchResult = items.filter(element => {
    //   // iterate over elements in items array
    //   // convert element in array to lowerCase and search against searchText
    //   return element.toLocaleLowerCase().includes(searchText);      
    // });

    // if (searchResult.length > 0){
    //   return true;
    // }

    return false;
  }

}
