import { Component, OnInit } from '@angular/core';
//resources service to talk between two components
import { ResourcesService } from '../../shared/resources.service';

@Component({
  selector: 'app-data-description',
  templateUrl: './data-description.component.html',
  styleUrls: ['./data-description.component.scss']
})
export class DataCategoriesComponent implements OnInit {

  constructor(
    //resources service to talk between two components
    private sharedService: ResourcesService
  ) { }

  ngOnInit(): void {
    
  }

  dataCategories = new Map([
    ['SRD', false],
    ['Reference', false],
    ['Resource', false],
    ['Published', false],
    ['Publishable', false],
    ['Working', false],
    ['Derived', false]
  ]);


  dataCategoryChange(e:any) {
    var storageTier: string = "";
    this.dataCategories.set(e.target.defaultValue,e.target.checked)
    console.log(this.dataCategories)

    // Go through possibilities with tiers based on check box selections
    for (let entry of this.dataCategories.entries()){
      console.log(entry[0], entry[1]);
      if (entry[0] === "SRD" || entry[0] === "Reference" || entry[0] === "Resource" ){
        if(entry[1]){
            storageTier = "top";
            break;
        }
      }
      else if (entry[0] === "Published" || entry[0] === "Publishable" ){
        if(entry[1]){
            storageTier = "mid";
            break;
        }
      }
      else if (entry[0] === "Working" || entry[0] === "Derived" ){
        if(entry[1]){
            storageTier = "low";
            break;
        }
      }
    }   
    
    this.sharedService.setStorageMessage(storageTier);
    this.sharedService.storageSubject$.next(storageTier);

    if (e.target.checked){
      console.log(e.target.defaultValue + " checked");      
    }
    else{
      console.log(e.target.defaultValue + " unchecked");
    }

    console.log(storageTier)
  }

}
