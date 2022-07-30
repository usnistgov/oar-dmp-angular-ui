import { Component, OnInit } from '@angular/core';
import { DropDownSelectService } from '../shared/drop-down-select.service';
//resources service to talk between two components
import { ResourcesService } from '../shared/resources.service';

@Component({
  selector: 'app-technical-requirements',
  templateUrl: './technical-requirements.component.html',
  styleUrls: ['./technical-requirements.component.scss']
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
  dataSetSize = "TB";

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
    // in HTML portion of the component for changing the class name
    // of myDiv1
    this.dataSetSize = this.dropDownService.getDropDownText(this.dataSize, this.dataUnits)[0].size;
    this.sharedService.setStorageMessage(this.dataSetSize);
    //send message to subscribed components
    this.sharedService.storageSubject$.next(this.dataSetSize)
  }

  setDataSize(e:any){
    console.log(e.target.value)
    //send message to subscribed components
    this.sharedService.setStorageMessage(this.dataSetSize);    
    this.sharedService.storageSubject$.next(this.dataSetSize)

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

  // determines whether there is any software development planned for this DMP
  private softwareDev: string="no";
  setSoftwareDev(e: string): void {
    this.softwareDev = e;
    if (this.softwareDev === "yes") {
      //if there is software development being done as part of a DMP send message
      //to resource options to highlight correct row in the Software Tools table
      //located in resource-options compomnent 
      this.sharedService.setSoftwareMessage(this.softwareUse)
      this.sharedService.softwareSubject$.next(this.softwareUse)

      this.sharedService.setDatabaseMessage(this.databaseUse)
      this.sharedService.databaseSubject$.next(this.databaseUse)

      this.sharedService.setWebsiteMessage(this.websiteUse)
      this.sharedService.websiteSubject$.next(this.websiteUse)
    }
  }

  //returns true or false to determine whether to display options for type of softwae
  // that is being developed as part of a DMP
  selSoftwareDev(name:string): boolean{
    if (!this.softwareDev) { // if no radio button is selected, always return false so every nothing is shown  
      return false;  
    }
    else {      
      return (this.softwareDev === name); // if current radio button is selected, return true, else return false 
    }  
    

  }

  // determines what is the intended audience for the software developmed within this DMP
  private softwareUse: string="internal";
  setSoftwareUse(e: string): void {
    this.softwareUse = e;
    //send message to resource options to highlight correct row in the Software Tools table
    //located in resource-options compomnent 
    this.sharedService.softwareSubject$.next(this.softwareUse)
  }

  // determines whether a database will be used for the softwre development
  private databaseUse: string="no";
  setDatabaseUse(sel: string){
    this.databaseUse = sel;
    //send message to resource options to highlight correct row in the Database table
    //located in resource-options compomnent 
    this.sharedService.databaseSubject$.next(this.databaseUse)

  }

  // determines whether a website will be used for the softwre development
  private websiteUse: string="no";
  setWebsiteDev(sel: string){
    this.websiteUse = sel;
    //send message to resource options to highlight correct row in the Database table
    //located in resource-options compomnent 
    this.sharedService.websiteSubject$.next(this.websiteUse)

  }

}
