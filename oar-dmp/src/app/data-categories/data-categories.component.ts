import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-categories',
  templateUrl: './data-categories.component.html',
  styleUrls: ['./data-categories.component.scss']
})
export class DataCategoriesComponent implements OnInit {

  constructor() { }
  dataCategories = new Map([
    ['SRD', false],
    ['Reference', false],
    ['Resource', false],
    ['Published', false],
    ['Publishable', false],
    ['Working', false],
    ['Derived', false]
  ]);

  ngOnInit(): void {
  }

  dataCategoryChange(e:any) {
    this.dataCategories.set(e.target.defaultValue,e.target.checked)
    console.log(this.dataCategories)

    if (e.target.checked){
      console.log(e.target.defaultValue + " checked");      
    }
    else{
      console.log(e.target.defaultValue + " unchecked");
    }
  }

}
