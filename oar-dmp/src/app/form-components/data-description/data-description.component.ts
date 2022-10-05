import { Component, Input, Output, OnInit } from '@angular/core';
//resources service to talk between two components
import { ResourcesService } from '../../shared/resources.service';
import { FormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';
import { DataCategories } from 'src/app/types/data-categories.type';

@Component({
  selector: 'app-data-description',
  templateUrl: './data-description.component.html',
  styleUrls: ['./data-description.component.scss']
})
export class DataDescriptionComponent implements OnInit {

  availableCategories:DataCategories[]=[
    { id: 0, name: 'SRD' },
    { id: 1, name: 'Reference' },
    { id: 2, name: 'Resource' },
    { id: 3, name: 'Published' },
    { id: 4, name: 'Publishable' },
    { id: 5, name: 'Working' },
    { id: 6, name: 'Derived' },

  ]

  dataDescriptionForm = this.fb.group({
    dataDescription: [''],
    dataCategories: this.fb.array([])

  });

  @Input()
  set initialDMP_Meta(data_description: DMP_Meta) {
    this.dataDescriptionForm.patchValue({
      dataDescription:                data_description.dataDescription,
      dataCategories:                 data_description.dataCategories
    });
  }

  @Output()
  valueChange = defer(() =>
    this.dataDescriptionForm.valueChanges.pipe(
      startWith(this.dataDescriptionForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          dataDescription:    formValue.dataDescription,
          dataCategories:     formValue.dataCategories,
        })
      )
    )
  );
  
  @Output()
  formReady = of(this.dataDescriptionForm); 

  constructor(
    //resources service to talk between two components 
    // (DataDescriptionComponent and ResourceOptionsComponent)
    private sharedService: ResourcesService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // console.log(this.dataCategories);
    for (let entry of this.dataDescriptionForm.controls['dataCategories'].value){
      // console.log(entry);
      this.dataCategories.set(entry,true);
    }    
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
