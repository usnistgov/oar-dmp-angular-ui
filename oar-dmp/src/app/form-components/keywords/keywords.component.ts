import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.scss']
})
export class KeywordsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  keyWords: string[] = [];
  newKeyWordText: string = '';
  errorMessage: string = '';

  onInput(value: string) {
    this.newKeyWordText = value;
  }

  onClick() {
    if (!this.newKeyWordText.length) {
      this.errorMessage = "Keywords / Phrases can't be empty";
      return;
    }

    this.errorMessage = '';
    //split on ; character
    var keywords = this.newKeyWordText.split(";");
    
    for (var index in keywords){
      //add all keywords / phrases delimited by ; character
      this.keyWords.push(keywords[index]);
    }
    
    this.newKeyWordText = '';
  }

  onClickClear(){
    this.keyWords = [];
    this.errorMessage = '';
  }

}
