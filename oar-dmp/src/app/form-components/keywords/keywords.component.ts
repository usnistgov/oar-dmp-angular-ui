import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

const USER_DATA = [
  {"name": "John Smith", "occupation": "Advisor", "age": 36},
  {"name": "Muhi Masri", "occupation": "Developer", "age": 28},
  {"name": "Peter Adams", "occupation": "HR", "age": 20},
  {"name": "Lora Bay", "occupation": "Marketing", "age": 43}
];

const COLUMNS_SCHEMA = [
  {
    key: 'name',
    type: 'text',
    label: 'Full Name',
  },
  {
    key: 'occupation',
    type: 'text',
    label: 'Occupation',
  },
  {
    key: 'dateOfBirth',
    type: 'date',
    label: 'Date of Birth',
  },
  {
    key: 'age',
    type: 'number',
    label: 'Age',
  },
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
];

@Component({
  selector: 'app-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.scss']
})
export class KeywordsComponent implements OnInit {

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  dataSource = USER_DATA;
  columnsSchema: any = COLUMNS_SCHEMA;

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
