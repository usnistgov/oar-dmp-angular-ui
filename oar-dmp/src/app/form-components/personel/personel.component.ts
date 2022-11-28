import { Component, OnInit, Input, Output  } from '@angular/core';
import { ROLES } from '../../types/mock-roles';
import { Contributor } from 'src/app/types/contributor.type';
import { DmpAPIService } from '../../dmp-api.service';
import { DropDownSelectService } from '../../shared/drop-down-select.service';

import { FormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

export interface DataContributor {  
  name: string;
  surname: string;
  institution: string;
  role: string;
  e_mail: string;
  id: number;
  isEdit: boolean;
}

// Schema for Contributors data table
const COLUMNS_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  {
    key: 'name',
    type: 'text',
    label: 'Name',
  },
  {
    key: 'surname',
    type: 'text',
    label: 'Surname',
  },
  {
    key: 'institution',
    type: 'text',
    label: 'Institution',
  },
  {
    key: 'role',
    type: 'text',
    label: 'Role',
  },
  {
    key: 'e_mail',
    type: 'text',
    label: 'e-mail',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

@Component({
  selector: 'app-personel',
  templateUrl: './personel.component.html',
  styleUrls: ['../keywords/keywords.component.scss', './personel.component.scss']
})
export class PersonelComponent implements OnInit {

  disableAdd:boolean = true;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  dmpContributor: DataContributor[] = []

  // flags to determine if select drop down has been used
  sel_NIST_Contributor: boolean = false; 
  sel_NIST_ContribRole: boolean = false;
  sel_EXT_ContribRole: boolean = false;

  sel_EXT_Contributor: boolean = false;

  nistContributor: string = "";
  crntContribName: string = "";
  crntContribSurname: string = "";
  crntContribEmail: string = "";
  

  constructor(
    private dropDownService: DropDownSelectService,
    private apiService: DmpAPIService,
    private fb: FormBuilder
  ) { 
    this.getgetAllFromAPI();
  }

  personelForm = this.fb.group(
    {
      nistContactFirstName:       [''],
      nistContactLastName:        [''],
      nistReviewerFirstName:      [''],
      nistReviewerLastName:       [''],
      contributors:               [[]]
    }
  );

  

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(personel: DMP_Meta) {
    // loop over resources array sent from the server and populate local copy of 
    // resources array to populate the table of resources in the user interface
    personel.contributors.forEach(
      (aContributor, index) => {
        this.dmpContributor.push({
          id:           index, 
          isEdit:       false, 
          name:         aContributor.contributor.firstName,
          surname:      aContributor.contributor.lastName,
          role:         aContributor.role,
          institution:  aContributor.instituion,
          e_mail:       aContributor.e_mail
        });
        this.disableClear=false;
        this.disableRemove=false;
      }
    )

    this.personelForm.patchValue({
      nistContactFirstName:       personel.primary_NIST_contact.firstName,
      nistContactLastName:        personel.primary_NIST_contact.lastName,
      nistReviewerFirstName:      personel.NIST_DMP_Reviewer.firstName,
      nistReviewerLastName:       personel.NIST_DMP_Reviewer.lastName,
      contributors:               personel.contributors
    });
  }

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.personelForm);

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    // There are a few important things to note here: form.valueChanges will only emit when 
    // the form value changes but not initially. That's why we use startWith to provide the 
    // initial value. And we use defer() to use the latest form value for startWith() 
    // whenever someone subscribes.
    this.personelForm.valueChanges.pipe(
      startWith(this.personelForm.value),
      map(
        (formValue): Partial<DMP_Meta> =>(
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to our part of the form 
          {
            primary_NIST_contact:   {firstName:formValue.nistContactFirstName, lastName: formValue.nistContactLastName},
            NIST_DMP_Reviewer:      {firstName:formValue.nistReviewerFirstName, lastName: formValue.nistReviewerLastName},
            contributors:           formValue.contributors

          }
        )
      )
    )
  );

  ngOnInit(): void {
  }  

  //List of contributors that will be aded to the DMP
  contributors: Contributor[]=[];

  //List of all nist contacts from NIST directory
  nistContacts: any = null;

  getgetAllFromAPI(){
    console.log("get from API");
    this.apiService.getAll().subscribe(
      {
        next: (v) => {
          /**
           * Get list of nist employees from MongoDB and set to nistContacts array
           * that is used for drop down select
           */
          this.nistContacts = v;

          /**
           * Search nistContacts array that contains list of nist emproyees from MongoDB
           * and retreive unique ID based on first and last name of NIST contact
           */
          var selId = this.dropDownService.getDropDownID(
            this.personelForm.controls["nistContactFirstName"].value, 
            this.personelForm.controls["nistContactLastName"].value, 
            this.nistContacts);
          // send a message to console if the search produces no results
          if (selId.length === 0){
            console.log("Could not find nist contact user ID");
          }
          // set id to primNistContact so that the drop down will be set to name
          // that has been provided
          this.primNistContact = selId[0].id;


          /**
           * Search and set dmp reviewer drop down menu - same priciple as above
           */
          selId = this.dropDownService.getDropDownID(
            this.personelForm.controls["nistReviewerFirstName"].value, 
            this.personelForm.controls["nistReviewerLastName"].value, 
            this.nistContacts);

          // send a message to console if the search produces no results
          if (selId.length === 0){
            console.log("Could not find nist reviewer user ID");
          }

          // set id to dmpReviewer so that the drop down will be set to name
          // that has been provided
          this.dmpReviewer = selId[0].id;

          
        },
        error: (e) => console.error(e) 
      }
    );
  }

  //current selection string on dropdown option
  //for Primary NIST Contact. This value is an ID from MongoDB
  primNistContact: string = "";

  selPrimNistContact() {
    //Select primary contact from a drop down list of NIST contacts
    var selected = this.dropDownService.getDropDownText(this.primNistContact, this.nistContacts);
    this.personelForm.patchValue({
      nistContactFirstName: selected[0].firstName,
      nistContactLastName:  selected[0].lastName,
    })
  }

  private contributorOption: string="false";
  setContributor(e:string):void{
    this.contributorOption = e;

  }
  selectedContributor(name: string): boolean{
    
    
    if (!this.contributorOption) { // if no radio button is selected, always return false so nothing is shown  
      return false;  
    }  
    return (this.contributorOption === name); // if current radio button is selected, return true, else return false  

  }
  
  selNistContributor(){
    var sel = this.dropDownService.getDropDownText(this.nistContributor, this.nistContacts)
    this.crntContribName = sel[0].firstName;
    this.crntContribSurname = sel[0].lastName;
    this.crntContribEmail = sel[0].e_mail;

    this.sel_NIST_Contributor = true; // indicates that drop down select has been performed

    if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
      this.disableAdd=false;
    }
  }

  contributorRoles = ROLES;
  nistContribRole: string = "";
  crntContribRole: string = "";

  extContribRole: string = "";
  
  selContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.nistContribRole, this.contributorRoles)[0].value;

    this.sel_NIST_ContribRole = true; // indicates that drop down select has been performed

    if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
      this.disableAdd=false;
    }

  }

  // Default values of external contributor
  externalContributor: Contributor={
    contributor:{firstName:"", lastName:""}, 
    role:"",
    e_mail:"",
    instituion:""
  };
  
  private contributorRadioSel: string="";
  onContributorChange(value:any){
    // console.log(value.id);
    this.contributorRadioSel=value.id;
    // this.disableAdd=false;
  }

  //current selection string on dropdown option
  //for DMP reviewer NIST Contact. This value is an ID from MongoDB
  dmpReviewer: string="";
  selDmpReviewer(){
    // select DMP reviewer from a drop down list of NIST contacts
    var selected = this.dropDownService.getDropDownText(this.dmpReviewer, this.nistContacts);
    this.personelForm.patchValue({
      nistReviewerFirstName: selected[0].firstName,
      nistReviewerLastName:  selected[0].lastName,
    })
  }

  errorMessage: string = "";
  
  removeSelectedRows() {
    this.dmpContributor = this.dmpContributor.filter((u: any) => !u.isSelected);
    this.resetTable();
    this.dmpContributor.forEach((element)=>{
        // re populate contributors array
        this.personelForm.value['contributors'].push({
          contributor:{firstName:element.name, lastName:element.surname},
          e_mail: element.e_mail,
          instituion: element.institution,
          role: element.role
        });
    });
    if (this.dmpContributor.length === 0){
      // If the table is empty disable clear and remove buttons
      this.disableClear=true;
      this.disableRemove=true;
    }
  }

  resetTable(){
    this.personelForm.patchValue({
      contributors:[]
    })
  }
  clearTable(){
    this.dmpContributor = [];
    this.resetTable();
     // If the table is empty disable clear and remove buttons
    this.disableClear=true;
    this.disableRemove=true;
  }

  addRow(){
    console.log(this.contributorRadioSel);
    // Disable buttons while the user is inputing new row
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;

    //reset dropdown selection flags
    this.sel_NIST_Contributor = false;
    this.sel_NIST_ContribRole = false;

    if (this.contributorRadioSel === "contributorExternal"){
      this.crntContribName = this.externalContributor.contributor.firstName;
      this.crntContribSurname = this.externalContributor.contributor.lastName;
      this.crntContribEmail = this.externalContributor.e_mail
    }

    var filterOnEmail = this.dmpContributor.filter(      
      (member: any) => member.e_mail.toLowerCase() === this.crntContribEmail.toLowerCase()
    );

    if(filterOnEmail.length > 0){

      this.errorMessage = "Contributor " + this.crntContribName + " " + this.crntContribSurname + " with e-mail address " + this.crntContribEmail + " is already in the list of contributors";
      this.disableAdd=false;
      this.disableClear=false;
      this.disableRemove=false;
      return;

    }

    const newRow = {
      id: Date.now(),
      name: this.crntContribName,
      surname:this.crntContribSurname,
      e_mail:this.crntContribEmail,
      institution:"",
      role:this.crntContribRole,
      isEdit: false,
    };
    
    if (this.contributorOption == "NIST"){
      newRow.institution = this.contributorOption;
    }
    else{
      newRow.institution = this.externalContributor.instituion;
    }

    // create a new array using an existing array as one part of it 
    // using the spread operator '...'
    this.dmpContributor = [newRow, ...this.dmpContributor];

    //update changes made to the table in the personel form
    this.onDoneClick(newRow);

  }

  removeRow(id:any) {
    // select word from the specific id
    var selWord = this.dmpContributor.filter((u) => u.id === id);    
    this.personelForm.value['contributors'].forEach((value:Contributor,index:number) =>{
      selWord.forEach((word)=>{
        /**
         * NOTE: 
         * assuming here that e-mail is always unique
         * i.e. that there are no two contributors with the same e-mail
         * Some check could be performed as a future feature to ensure that
         * when adding a new contributor the e-mail is unique and always present field
         */
        if(value.e_mail === word.e_mail){
          //remove from DmpRecord
          this.personelForm.value['contributors'].splice(index,1);
        }
      });
    });

    // remove from the display table
    this.dmpContributor = this.dmpContributor.filter((u) => u.id !== id);
  }

  onDoneClick(e:any){
    if (!e.e_mail.length) {
      /**
       * NOTE:
       * e-mail validation should go here too
       */
      this.errorMessage = "e-mail can't be empty";
      return;
    }
    else if(!e.institution.length) {
      this.errorMessage = "Institution can't be empty";
      return;
    }
    else if(!e.name.length) {
      this.errorMessage = "Name can't be empty";
      return;
    }
    else if(!e.role.length) {
      this.errorMessage = "Role can't be empty";
      return;
    }
    else if(!e.surname.length) {
      this.errorMessage = "Surname can't be empty";
      return;
    }

    this.errorMessage = '';
    this.resetTable();
    this.dmpContributor.forEach((element)=>{
        if(element.id === e.id){
          element.isEdit = false;
        }
        // re populate contributors array
        this.personelForm.value['contributors'].push({
          contributor:{firstName:element.name, lastName:element.surname},
          e_mail: element.e_mail,
          instituion: element.institution,
          role: element.role
        });
      }
    )
    // Enable buttons once user entered new data into a row
    this.disableAdd=false;
    this.disableClear=false;
    this.disableRemove=false;

  }

  selExtContributorRole(){
    // select role for the contributors from a drop down list
    //var sel = this.dropDownService.getDropDownRole(this.extContribRole, this.contributorRoles);
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.extContribRole, this.contributorRoles)[0].value;

    this.sel_EXT_ContribRole = true; // indicates that drop down select has been performed

    this.disableAdd=false;



  }

  resetPersonnelForm(){

    this.primNistContact = "";
    this.dmpReviewer = "";
    this.nistContributor = "";
    this.nistContribRole = "";
    this.externalContributor.contributor.firstName = "";
    this.externalContributor.contributor.lastName = "";
    this.externalContributor.instituion = "";
    this.extContribRole = "";
    this.externalContributor.e_mail = "";
    this.contributorRadioSel = "";
    this.personelForm.patchValue({
      nistContactFirstName:       "",
      nistContactLastName:        "",
      nistReviewerFirstName:      "",
      nistReviewerLastName:       ""
    });
    this.clearTable();
  }



}
