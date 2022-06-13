import { Component, OnInit } from '@angular/core';
import { DropDownSelectService } from '../shared/drop-down-select.service';
//resources service to talk between two components
import { ResourcesService } from '../shared/resources.service';

@Component({
  selector: 'app-storage-needs',
  templateUrl: './storage-needs.component.html',
  styleUrls: ['./storage-needs.component.scss']
})
export class StorageNeedsComponent implements OnInit {

  // message:any
  constructor(
    private dropDownService: DropDownSelectService,
    private sharedService: ResourcesService
  ) { }

  ngOnInit(): void {
    // this.message=this.sharedService.getMessage()
  }
  
  dataSize = "3";
  dataSetSize: any;

  dataUnits =[    
    {
      id: "1",
      size: 'MB'
    },
    {
      id: "2",
      size: 'GB'
    },
    {
      id: "3",
      size: 'TB'
    }
  ];

  selDataSize(){
    // Get the size selection for the estimated data size [MB, GB, TB]
    // assign the value to dataSetSize variable that is further used
    //in HTML partion of the component for changing the class name
    // of myDiv1
    this.dataSetSize = this.dropDownService.getDropDownText(this.dataSize, this.dataUnits)[0].size;
    this.sharedService.setMessage(this.dataSetSize);
    //send message to subscribed components
    this.sharedService.subjectA$.next(this.dataSetSize)
  }

  techRsrc: string[] = [];
  newTechRsrc = '';
  techRsrcErr = '';

  techRsrcOnInput(value: string) {
    this.newTechRsrc = value;
  }

  techRsrcOnClick() {
    if (!this.newTechRsrc.length) {
      this.techRsrcErr = "Technical Resources can't be empty";
      return;
    }

    this.techRsrcErr = '';
    this.techRsrc.push(this.newTechRsrc);
    this.newTechRsrc = '';
  }

  techRsrcOnClickClear(){
    this.techRsrc = [];
    this.techRsrcErr = '';
  }

}
