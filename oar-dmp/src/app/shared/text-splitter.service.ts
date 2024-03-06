import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextSplitterService {

  constructor() { }
  splitText(textToSplit:string, delimiter:string){
    return textToSplit.split(delimiter);

  }
}
