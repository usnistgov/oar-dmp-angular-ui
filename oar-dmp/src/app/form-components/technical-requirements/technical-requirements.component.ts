import { Component, Input, Output } from '@angular/core';
import { confirmDialog } from 'src/app/shared/dmp.service';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
//resources service to talk between two components
import { ResourcesService } from '../../shared/resources.service';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
// import { DMP_Meta } from 'src/app/types/DMP.types';
// import { SoftwareDevelopment } from 'src/app/types/software-development.type';
import { Instrument } from '../../types/instrument.type';
import { DMP_Meta } from '../../types/DMP.types';
import { SoftwareDevelopment } from '../../types/software-development.type';
import { Subscription } from 'rxjs';

interface InstrTblRow {  
  name: string;
  description_url: string;
  id: number;
  isEdit: boolean;
}

const INSTR_COL_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  {
    key: 'name',
    type: 'text',
    label: 'Instrument Name',
  },
  {
    key: 'description_url',
    type: 'text',
    label: 'Description / URL Landing Page',
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
  styleUrls: ['./technical-requirements.component.scss', '../form-layout.scss', '../form-table.scss']
})
export class StorageNeedsComponent {  
  // ================================  

  disableAdd:boolean = true;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  instr_displayedColumns: string[] = INSTR_COL_SCHEMA.map((col) => col.key);
  instr_columnsSchema: any = INSTR_COL_SCHEMA;

  crntInstrName: string = "";
  crntInstrURL: string = "";

  dmpInstrument: Instrument={
    name:"",
    description_url:""

  } 

  dmpInstrumentsTbl: InstrTblRow[] = []

  // ================================  

  storageSubscription!: Subscription | null;  
  errorMessage: string = '';
  sftDev: SoftwareDevelopment = {development:"", softwareUse:"", softwareDatabase:"", softwareWebsite:""}
  separatorExp: RegExp = /,|;/;

  

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
      technicalResources: [[]],
      instruments: [[]]
    }
  );
  
  // message:any
  constructor(
    private dropDownService: DropDownSelectService,
    private sharedService: ResourcesService,
    private fb: UntypedFormBuilder,
  ) { }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(technical_requirements: DMP_Meta) {
    // loop over instruments array sent from the server and populate local copy of 
    // instruments array to populate the table of instruments in the user interface

    technical_requirements.instruments.forEach(
      (anInstrument, index) => {
        this.dmpInstrumentsTbl.push({
          id:               index, 
          isEdit:           false, 
          name:             anInstrument.name,
          description_url:  anInstrument.description_url,

          
        });
        this.disableClear=false;
        this.disableRemove=false;
      }
    )

    // set initial values for technical requirements part of the form
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
        technicalResources:             technical_requirements.technicalResources,
        instruments:                    technical_requirements.instruments
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
        technicalResources:             technical_requirements.technicalResources,
        instruments:                    technical_requirements.instruments
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
          technicalResources:             formValue.technicalResources,
          instruments:                    formValue.instruments
        })
      )

    )
  );

  ngOnInit(): void {
    this.dataCategorySubscribe()
    // This function gets executed after initial data from the parent has been passed in and allows for
    // setting check states used for radio buttons etc.
    
    this.dataSetSize = this.technicalRequirementsForm.controls['sizeUnit'].value;
    for (var val of this.dataUnits) {
      if(val.size === this.dataSetSize){
        this.dataSize = val.id
      }      
    }

    let dataSizeInput = this.technicalRequirementsForm.controls['dataSize'].value;
    if (typeof dataSizeInput === 'string' && !this.dataCategoryIsSet){
      // dataSizeInput can be none or undefined if no data has be inserted in the text box
      // so check first if the value of the textbox is a string
      if (this.dataSizeRegEx.test(dataSizeInput.trim()) && parseInt(dataSizeInput.trim()) > 0){
        this.sharedService.setStorageMessage(this.dataSetSize); 
        this.sharedService.storageSubject$.next(this.dataSetSize);
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
  dataCategoryIsSet:boolean = false;

  //subscribe to a particular subject
  dataCategorySubscribe() {
    if (!this.storageSubscription) {
      //subscribe if not already subscribed
      this.storageSubscription = this.sharedService.dataCategories$.subscribe({
        next: (message) => {
          this.dataCategoryIsSet = message;
          if(!message){
            // if no data categories check boxes are selected
            // then see what is the estimated data size to properly
            // highlight storage resources
            this.selDataSize();
          }
        }
      });
    }
  }

  dataSizeRegEx : RegExp = new RegExp("^[1-9][0-9]*$");

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
    let dataSizeInput = this.technicalRequirementsForm.controls['dataSize'].value;
    // dataSizeInput can be none or undefined if no data has be inserted in the text box
    // so check first if the value of the textbox is a string
    if (typeof dataSizeInput === 'string'){
      if (this.dataSizeRegEx.test(dataSizeInput.trim()) && parseInt(dataSizeInput.trim()) > 0){    
        if (!this.dataCategoryIsSet){ // send message to resource options component only if data category check boxes have not been set
          this.sharedService.setStorageMessage(this.dataSetSize);
          //send message to subscribed components
          this.sharedService.storageSubject$.next(this.dataSetSize)
          this.technicalRequirementsForm.patchValue(
            {
              sizeUnit: this.dataSetSize
            }
          )
        }
      }
      else{
        alert ("Estimated data size must be an integer value greater than zero");
        if (!this.dataCategoryIsSet){// send message to resource options component only if data category check boxes have not been set
          this.sharedService.setStorageMessage("");
          this.sharedService.storageSubject$.next("");
        }
      }
    }
  }

  setDataSize(e:any){
    //send message to subscribed components
    
    let dataSizeInput = this.technicalRequirementsForm.controls['dataSize'].value;
    if (this.dataSizeRegEx.test(dataSizeInput.trim()) && parseInt(dataSizeInput.trim()) > 0){
      if (!this.dataCategoryIsSet){// send message to resource options component only if data category check boxes have not been set
        this.sharedService.setStorageMessage(this.dataSetSize);    
        this.sharedService.storageSubject$.next(this.dataSetSize);
      }
    }
    else{
      alert ("Estimated data size must be an integer value greater than zero");
      if (!this.dataCategoryIsSet){// send message to resource options component only if data category check boxes have not been set
        this.sharedService.setStorageMessage("");
        this.sharedService.storageSubject$.next("");
      }
    }
    

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
  setSoftwareDev(e: string): void {
    // this.softwareDev = e;
    this.sftDev["development"] = e;
    if (this.sftDev["development"] === "no") {
      /**
       * Reset Radio buttons for:
       *        Software developed for this project will be for
       *        Does the software development require a database?
       *        Will the software development produce a website interface?
       */
       this.technicalRequirementsForm.patchValue({
        softwareUse:                    "",
        softwareDatabase:               "",
        softwareWebsite:                ""
      });
      this.setSoftwareUse(this.technicalRequirementsForm.controls['softwareUse'].value);
      this.setDatabaseUse(this.technicalRequirementsForm.controls['softwareDatabase'].value);
      this.setWebsiteDev(this.technicalRequirementsForm.controls['softwareWebsite'].value);      
    }
    else{
      //if there is software development being done as part of a DMP send message
      //to resource options to highlight correct row in the Software Tools table
      //located in resource-options compomnent 
      // this.sharedService.setSoftwareMessage(this.sftDev["softwareUse"])
      // this.sharedService.softwareSubject$.next(this.sftDev["softwareUse"])

      // this.sharedService.setDatabaseMessage(this.sftDev["softwareDatabase"])
      // this.sharedService.databaseSubject$.next(this.sftDev["softwareDatabase"])

      // this.sharedService.setWebsiteMessage(this.sftDev["softwareWebsite"])
      // this.sharedService.websiteSubject$.next(this.sftDev["softwareWebsite"])
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
  setSoftwareUse(e: string): void {
    // this.softwareUse = e;
    this.sftDev["softwareUse"] = e;
    //send message to resource options to highlight correct row in the Software Tools table
    //located in resource-options compomnent 
    this.sharedService.softwareSubject$.next(this.sftDev["softwareUse"])
  }

  // determines whether a database will be used for the softwre development
  setDatabaseUse(sel: string){
    // this.databaseUse = sel;
    this.sftDev["softwareDatabase"] = sel;
    //send message to resource options to highlight correct row in the Database table
    //located in resource-options compomnent 
    this.sharedService.databaseSubject$.next(this.sftDev["softwareDatabase"])

  }

  // determines whether a website will be used for the softwre development
  setWebsiteDev(sel: string){
    // this.websiteUse = sel;
    this.sftDev["softwareWebsite"] = sel;
    //send message to resource options to highlight correct row in the Database table
    //located in resource-options compomnent 
    this.sharedService.websiteSubject$.next(this.sftDev["softwareWebsite"])

  }

  removeSelectedRows() {
    const result = confirmDialog("Are you sure you want to delete selected instrument(s) for this DMP?");
    
    if (result) {
      this.dmpInstrumentsTbl = this.dmpInstrumentsTbl.filter((u: any) => !u.isSelected);
      this.resetTable();

      this.dmpInstrumentsTbl.forEach((element)=>{        
        // re populate instruments array
        this.technicalRequirementsForm.value['instruments'].push({
          name:element.name,
          description_url: element.description_url
        });
      });
      if (this.dmpInstrumentsTbl.length === 0){
        // If the table is empty disable clear and remove buttons
        this.disableClear=true;
        this.disableRemove=true;
      }
    }
  }

  removeRow(id:any) {
    const result = confirmDialog("Are you sure you want to delete selected instrument(s) for this DMP?");
    
    if (result) {
    }
  }  

  addRow(){
    // Disable buttons while the user is inputing new row
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;

    this.crntInstrName = this.dmpInstrument.name;
    this.crntInstrURL = this.dmpInstrument.description_url

    const newRow = {
      id: Date.now(),
      name: this.crntInstrName,
      description_url:this.crntInstrURL,
      isEdit: false,
    };

    // add new row to the dmpInstrumentsTbl array 
    // using the spread operator '...'
    this.dmpInstrumentsTbl = [newRow, ...this.dmpInstrumentsTbl];
    

    //update changes made to the table in the form
    this.onDoneClick(newRow);

    this.resetInstrumentFields();

  }

  onDoneClick(e:any){
    if (!e.name.length) {
      this.errorMessage = "Instrument name can't be empty";
      return;
    }
    else if(!e.description_url.length) {
      this.errorMessage = "Description / URL can't be empty";
      return;
    }

    this.errorMessage = '';
    this.resetTable();// check if this step is needed
    
    this.dmpInstrumentsTbl.forEach((element)=>{
      if(element.id === e.id){
        element.isEdit = false;
      } 

      // re populate instruments array
      this.technicalRequirementsForm.value['instruments'].push({
        name: element.name,
        description_url: element.description_url
      });
    }
  )

  this.disableClear=false;
  this.disableRemove=false;

  }

  /**
   * Resets form fields for DMP Instruments
   */
  private resetInstrumentFields(){
    this.errorMessage = "";

    this.dmpInstrument = {name:"", description_url:""};


  }
  
  

  clearTable(){
    const result = confirmDialog("Are you sure you want to delete all instrument(s) for this DMP?");
    
    if (result) {
      this.dmpInstrumentsTbl = []
      this.resetTable();
      this.disableClear=true;
      this.disableRemove=true;
    }
  }
  
  resetTable(){
    this.technicalRequirementsForm.patchValue({
      instruments:[]
    })
  }

  checkInstrData(e:any){
    // Check if both Instrument Name and Description/url have been filled out
    if (this.dmpInstrument.name !== '' && this.dmpInstrument.description_url !== ''){
      this.disableAdd = false;      
    }
    else{
      this.disableAdd = true;
    }
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
      // changes up to the parent form
      dataSize:             null,
      sizeUnit:             "TB",
      development:          "no",
      softwareUse:          null,
      softwareDatabase:     null,
      softwareWebsite:      null
    })
    this.technicalRequirementsForm.patchValue({
      technicalResources:[]
    })
    this.clearTable();
    
  }



}
