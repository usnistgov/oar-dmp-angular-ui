import { Pipe, PipeTransform } from '@angular/core';
import { lowerCase } from 'lodash';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(item: Object, message: any): boolean {
    if (!item) {
      return false;
    }
    if (!message) {
      return false;
    }
    //the lenght of item object must always be 1 because it has to have one key-value pair
    if (Object.keys(item).length !==1){
      return false
    }

    let k: keyof typeof item;     
    let searchItem: string = ""; 
    let options: Array<typeof item>;
    for (k in item){
      searchItem = message[k];
      if (searchItem ===''){
        return false
      }
      // convert message to lowerCase
      searchItem = searchItem.toLocaleLowerCase();
      // Conversion of type 'X' to type 'Y' may be a mistake in TS
      // The error "Conversion of type 'X' to type 'Y' may be a mistake because 
      // neither type sufficiently overlaps with the other" occurs when we use a 
      // type assertion with incompatible types.

      // To solve the error, widen the item[k] type to unknown first and then narrow it down to Array<string>.
      let a = item[k] as unknown as Array<string>
      let searchResult = a.filter(element => {
        // iterate over elements in item array
        // convert element in array to lowerCase and search against searchItem
        return element.toLocaleLowerCase().includes(searchItem);      
      });

      if (searchResult.length > 0){
        return true;
      }
    }

    return false;
  }

}
