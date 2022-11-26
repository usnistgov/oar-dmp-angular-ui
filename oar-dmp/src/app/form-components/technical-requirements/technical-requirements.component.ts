import { Component, Input, Output } from '@angular/core';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
//resources service to talk between two components
import { ResourcesService } from '../../shared/resources.service';
import { FormBuilder, Validators } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';
import { SoftwareDevelopment } from 'src/app/types/software-development.type';

export interface TechnicalResources {
  resource: string;
  id: number;
  isEdit: boolean;
}

const COLUMNS_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  {
    key: 'resource',
    type: 'text',
    label: 'Technical Resource',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

@Component({
  selector: 'app-technical-requirements',
  templateUrl: './technical-requirements.component.html',
  styleUrls: ['./technical-requirements.component.scss', '../keywords/keywords.component.scss']
})
export class StorageNeedsComponent {  
  disableAdd:boolean = false;
  disableClear:boolean = true;
  disableRemove:boolean = true;
  
  errorMessage: string = '';

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  techResource: TechnicalResources[] = [];

  sftDev: SoftwareDevelopment = {development:"", softwareUse:"", softwareDatabase:"", softwareWebsite:""}

  // This mimics the technical-requirements type interface from 
  // types/technical-requirements.type.ts
  technicalRequirementsForm = this.fb.group(
    {
      dataSize: ['', [Validators.required, Validators.pattern("^[0-9]*$")]], // only numbers
      sizeUnit: ['', Validators.required],
      development: ['', Validators.required],
      softwareUse: [''],
      softwareDatabase: [''],
      softwareWebsite: [''],
      technicalResources: [[]]
    }
  );
  
  // message:any
  constructor(
    private dropDownService: DropDownSelectService,
    private sharedService: ResourcesService,
    private fb: FormBuilder
  ) { }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(technical_requirements: DMP_Meta) {
    // loop over resources array sent from the server and populate local copy of 
    // resources array to populate the table of resources in the user interface

    technical_requirements.technicalResources.forEach( 
      (technicalResource, index) => {  
        this.techResource.push({id:index, resource:technicalResource, isEdit:false});
        this.disableClear=false;
        this.disableRemove=false;
      }
    );

    // set initial values for data preservation part of the form
    // to what has been sent from the server
    if (technical_requirements.softwareDevelopment.development === "yes"){
      // If the software development option is set to yes then pass all initial values
      this.technicalRequirementsForm.patchValue({
        dataSize:                       technical_requirements.dataSize,
        sizeUnit:                       technical_requirements.sizeUnit,
        development:                    technical_requirements.softwareDevelopment.development,
        softwareUse:                    technical_requirements.softwareDevelopment.softwareUse,
        softwareDatabase:               technical_requirements.softwareDevelopment.softwareDatabase,
        softwareWebsite:                technical_requirements.softwareDevelopment.softwareWebsite,
        technicalResources:             technical_requirements.technicalResources
      });
    }
    else{
      // else if software development is set to no don't set options for 
      // softwareUse, softwareDatabase, softwareWebsite
      // This will force the user to make a selection if they change software development to yes
      this.technicalRequirementsForm.patchValue({
        dataSize:                       technical_requirements.dataSize,
        sizeUnit:                       technical_requirements.sizeUnit,
        development:                    technical_requirements.softwareDevelopment.development,
        softwareUse:                    "",
        softwareDatabase:               "",
        softwareWebsite:                "",
        technicalResources:             technical_requirements.technicalResources
      });
    }
    
  }

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.technicalRequirementsForm);

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    // There are a few important things to note here: form.valueChanges will only emit when 
    // the form value changes but not initially. That's why we use startWith to provide the 
    // initial value. And we use defer() to use the latest form value for startWith() 
    // whenever someone subscribes.
    this.technicalRequirementsForm.valueChanges.pipe(
      startWith(this.technicalRequirementsForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({           
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to our part of the form 
          dataSize:                       formValue.dataSize,
          sizeUnit:                       formValue.sizeUnit,
          softwareDevelopment:            {
                                            "development":formValue.development,
                                            "softwareUse":formValue.softwareUse,
                                            "softwareDatabase":formValue.softwareDatabase,
                                            "softwareWebsite":formValue.softwareWebsite
                                          },
          technicalResources:             formValue.technicalResources
        })
      )

    )
  );

  ngOnInit(): void {
    // This function gets executed after initial data from the parent has been passed in and allows for
    // setting check states used for radio buttons etc.
    this.dataSetSize = this.technicalRequirementsForm.controls['sizeUnit'].value;
    for (var val of this.dataUnits) {
      if(val.size === this.dataSetSize){
        this.dataSize = val.id
      }      
    }
    //this triggers highlighting in the resource options table / guide
    this.setSoftwareDev(this.technicalRequirementsForm.controls['development'].value);

    // if software development is set to yes then set the rest of the radio buttons
    // according to passed metadata
    if (this.technicalRequirementsForm.controls['development'].value == "yes"){
      this.setSoftwareUse(this.technicalRequirementsForm.controls['softwareUse'].value);
      this.setDatabaseUse(this.technicalRequirementsForm.controls['softwareDatabase'].value);
      this.setWebsiteDev(this.technicalRequirementsForm.controls['softwareWebsite'].value);
    }    

  }
  
  dataSize = "";
  dataSetSize = "";

  // used for estimated data size drop down of data units options
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
    this.technicalRequirementsForm.patchValue(
      {
        sizeUnit: this.dataSetSize
      }
    )
  }

  setDataSize(e:any){
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
  //private softwareDev: string="no";
  setSoftwareDev(e: string): void {
    // this.softwareDev = e;
    this.sftDev["development"] = e;
    if (this.sftDev["development"] === "yes") {
      //if there is software development being done as part of a DMP send message
      //to resource options to highlight correct row in the Software Tools table
      //located in resource-options compomnent 
      this.sharedService.setSoftwareMessage(this.sftDev["softwareUse"])
      this.sharedService.softwareSubject$.next(this.sftDev["softwareUse"])

      this.sharedService.setDatabaseMessage(this.sftDev["softwareDatabase"])
      this.sharedService.databaseSubject$.next(this.sftDev["softwareDatabase"])

      this.sharedService.setWebsiteMessage(this.sftDev["softwareWebsite"])
      this.sharedService.websiteSubject$.next(this.sftDev["softwareWebsite"])
    }
  }

  //returns true or false to determine whether to display options for type of softwae
  // that is being developed as part of a DMP
  selSoftwareDev(name:string): boolean{
    if (!this.sftDev["development"]) { // if no radio button is selected, always return false so nothing is shown  
      return false;  
    }
    else {      
      return (this.sftDev["development"] === name); // if current radio button is selected, return true, else return false 
    }
  }

  // determines what is the intended audience for the software developmed within this DMP
  // private softwareUse: string="internal";
  setSoftwareUse(e: string): void {
    // this.softwareUse = e;
    this.sftDev["softwareUse"] = e;
    //send message to resource options to highlight correct row in the Software Tools table
    //located in resource-options compomnent 
    this.sharedService.softwareSubject$.next(this.sftDev["softwareUse"])
  }

  // determines whether a database will be used for the softwre development
  // private databaseUse: string="no";
  setDatabaseUse(sel: string){
    // this.databaseUse = sel;
    this.sftDev["softwareDatabase"] = sel;
    //send message to resource options to highlight correct row in the Database table
    //located in resource-options compomnent 
    this.sharedService.databaseSubject$.next(this.sftDev["softwareDatabase"])

  }

  // determines whether a website will be used for the softwre development
  // private websiteUse: string="no";
  setWebsiteDev(sel: string){
    // this.websiteUse = sel;
    this.sftDev["softwareWebsite"] = sel;
    //send message to resource options to highlight correct row in the Database table
    //located in resource-options compomnent 
    this.sharedService.websiteSubject$.next(this.sftDev["softwareWebsite"])

  }
  
  onDoneClick(e:any){
    if (!e.resource.length) {
      this.errorMessage = "Technical Resource can't be empty";
      return;
    }

    this.errorMessage = '';
    this.resetTable();
    this.techResource.forEach((element)=>{
        if(element.id === e.id){
          element.isEdit = false;
        }
        // re populate resources array
        this.technicalRequirementsForm.value['technicalResources'].push(element.resource);
      }
    )
    // Enable buttons once user entered new data into a row
    this.disableAdd=false;
    this.disableClear=false;
    this.disableRemove=false;

  }

  removeRow(id:any) {
    // select word from the specific id
    var selWord = this.techResource.filter((u) => u.id === id);    
    this.technicalRequirementsForm.value['technicalResources'].forEach((value:string,index:number) =>{
      selWord.forEach((word)=>{
        if(value === word.resource){
          this.technicalRequirementsForm.value['technicalResources'].splice(index,1);
        }
      });
    });

    this.techResource = this.techResource.filter((u) => u.id !== id);
  }

  removeSelectedRows() {
    this.techResource = this.techResource.filter((u: any) => !u.isSelected);
    this.resetTable();
    this.techResource.forEach((element)=>{
        // re populate resources array
        this.technicalRequirementsForm.value['technicalResources'].push(element.resource);
    });
    if (this.techResource.length === 0){
      // If the table is empty disable clear and remove buttons
      this.disableClear=true;
      this.disableRemove=true;
    }
  }

  clearTable(){
    this.techResource = [];
    this.resetTable();
     // If the table is empty disable clear and remove buttons
    this.disableClear=true;
    this.disableRemove=true;
  }

  addRow() {
    // Disable buttons while the user is inputing new row
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;
    
    const newRow = {
      id: Date.now(),
      resource: '',
      isEdit: true,
    };
    // create a new array using an existing array as one part of it 
    // using the spread operator '...'
    this.techResource = [newRow, ...this.techResource];
  }

  resetTable(){
    this.technicalRequirementsForm.patchValue({
      technicalResources:[]
    })
  }

  resetTechnicalRequirements(){
    this.dataSize = "3";
    this.dataSetSize = "TB";
    this.setSoftwareDev('no');
    this.setSoftwareUse('no');
    this.setDatabaseUse('no');
    this.setWebsiteDev('no');
    this.technicalRequirementsForm.patchValue({
      // all of technicalRequirementsForm needs to be "changed" in order to fire the update event and propagate
      // changes up to the parent form but since we are only trying to update the table
      // don't change preservation description text therefore re-assign it to preservationDescription
      dataSize:             null,
      sizeUnit:             "TB",
      development:          "no",
      softwareUse:          null,
      softwareDatabase:     null,
      softwareWebsite:      null
    })
    this.clearTable();
    
  }



}
