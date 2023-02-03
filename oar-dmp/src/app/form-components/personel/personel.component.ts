import { Component, OnInit, Input, Output  } from '@angular/core';
import { ROLES } from '../../types/mock-roles';
import { NIST_STAFF } from 'src/app/types/nist-staff-mock.type'; //possibly need to comment this out
import { Contributor } from 'src/app/types/contributor.type';
import { DmpAPIService } from '../../shared/dmp-api.service';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
import { NistContact } from 'src/app/types/nist-contact'

import { Validators, FormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

import {Observable} from 'rxjs';

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

  crntContribName: string = "";
  crntContribSurname: string = "";
  crntContribEmail: string = "";

  fltr_Prim_NIST_Contact!: Observable<NistContact[]>;
  // fltr_NIST_DMP_Reviewer!: Observable<NistContact[]>;
  fltr_NIST_Contributor!: Observable<NistContact[]>;

  

  constructor(
    private dropDownService: DropDownSelectService,
    private apiService: DmpAPIService,
    private fb: FormBuilder
  ) { 
    console.log("constructor")
    /**
     * NOTE uncoment this when pulling data from API with a backend database
     */
    this.getNistContactsFromAPI(); //sets values from API service

  }

  personelForm = this.fb.group(
    {
      primary_NIST_contact:       ['', Validators.required],
      NIST_DMP_Reviewer:          [''],
      dmp_contributor:            [''],
      nistContactFirstName:       [''],
      nistContactLastName:        [''],
      // nistReviewerFirstName:      [''],
      // nistReviewerLastName:       [''],
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
      primary_NIST_contact:       {firstName: personel.primary_NIST_contact.firstName, lastName:personel.primary_NIST_contact.lastName},
      // NIST_DMP_Reviewer:          {firstName: personel.NIST_DMP_Reviewer.firstName, lastName:personel.NIST_DMP_Reviewer.lastName},
      nistContactFirstName:       personel.primary_NIST_contact.firstName,
      nistContactLastName:        personel.primary_NIST_contact.lastName,
      // nistReviewerFirstName:      personel.NIST_DMP_Reviewer.firstName,
      // nistReviewerLastName:       personel.NIST_DMP_Reviewer.lastName,
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
            // NIST_DMP_Reviewer:      {firstName:formValue.nistReviewerFirstName, lastName: formValue.nistReviewerLastName},
            contributors:           formValue.contributors

          }
        )
      )
    )
  );

  ngOnInit(): void {
    // console.log("ngOnInit");
    /**
     * NOTE Comment below when woking with API
     */
    // this.getNistContacts();

  }  

  //List of contributors that will be aded to the DMP
  contributors: Contributor[]=[];

  //List of all nist contacts from NIST directory
  nistContacts: any = null;

  /**
   * This function gets hard coded NIST contasts
   * Used when not working with an API for NIST contacts database
   */
  getNistContacts(){
    this.nistContacts = NIST_STAFF;
    // this.setNISTContacts();
  }


  getNistContactsFromAPI(){
    this.apiService.get_NIST_Personnel().subscribe(
      {
        next: (v) => {
          /**
           * Get list of nist employees from MongoDB and set to nistContacts array
           * that is used for drop down select
           */
          this.nistContacts = v;
          
          this.fltr_Prim_NIST_Contact = this.personelForm.controls['primary_NIST_contact'].valueChanges.pipe(
            startWith(''),
            map (value => {
              
                /**
                 * The optional chaining ?. operator in TypeScript value?.firstName
                 * 
                 * The question mark dot (?.) syntax is called optional chaining in TypeScript and is like 
                 * using dot notation to access a nested property of an object, but instead of causing an 
                 * error if the reference is nullish, it short-circuits returning undefined.
                 * 
                 * if value is a string return value else return concatenation of value.firstName and value.lastName
                 * */
                // console.log(value);
                const name = typeof value === 'string' ? value : value?.firstName + " " + value?.lastName;
                var res = name ? this._filter(name as string): this.nistContacts.slice();
                // console.log(res.length);
                if (res.length ===1){
                  this.personelForm.patchValue({
                    nistContactFirstName: value.firstName,
                    nistContactLastName:  value.lastName,
                  })
                }
                return res;

              }
            )
          );

          // this.fltr_NIST_DMP_Reviewer = this.personelForm.controls['NIST_DMP_Reviewer'].valueChanges.pipe(
          //   startWith(''),
          //   map (reviewer => {             
                
          //       // console.log(reviewer);
          //       const name = typeof reviewer === 'string' ? reviewer : reviewer?.firstName + " " + reviewer?.lastName;
          //       var res2 = name ? this._filter(name as string): this.nistContacts.slice();
          //       // console.log(res.length);
          //       if (res2.length ===1){
          //         this.personelForm.patchValue({
          //           nistReviewerFirstName: reviewer.firstName,
          //           nistReviewerLastName:  reviewer.lastName,
          //         })
          //       }
          //       return res2;

          //     }
          //   )
          // );

          this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
            startWith(''),
            map (contributor => {             
                
                // console.log(contributor);
                const name = typeof contributor === 'string' ? contributor : contributor?.firstName + " " + contributor?.lastName;
                var res3 = name ? this._filter(name as string): this.nistContacts.slice();
                // console.log(res.length);
                if (res3.length ===1){
                  this.personelForm.patchValue({
                    nistReviewerFirstName: contributor.firstName,
                    nistReviewerLastName:  contributor.lastName,
                  })
                  this.crntContribName = contributor.firstName;
                  this.crntContribSurname = contributor.lastName;
                  this.crntContribEmail = contributor.e_mail;

                  this.sel_NIST_Contributor = true; // indicates that drop down select has been performed

                  if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
                    this.disableAdd=false;
                  }
                }
                return res3;

              }
            )
          );
        },
        error: (e) => console.error(e) 
      }
    );
  }

  private _filter(nistPerson: string): NistContact[] {
    //split name on white space to get first name and last name
    // Beacuase the person name in the gui is displayed as <first name> <last name> delimited by white space
    // filterValues[1] = last name
    // filterValues[0] = first name
    const filterValues = nistPerson.toLowerCase().split(" ");
    var searchRes;

    if (filterValues.length > 1){
      // if split resulted in more than a single word/entry search first on last name then first name
      searchRes = this.nistContacts.filter(        
        (option:any) => option.lastName.toLowerCase().includes(filterValues[1] || option.firstName.toLowerCase().includes(filterValues[0]) )
      );

    }
    else{
      //here we have only one entry in the filterValues array, so search just on that one value matching first on last name then first name
      searchRes = this.nistContacts.filter(
        (option:any) => option.lastName.toLowerCase().includes(filterValues[0]) || option.firstName.toLowerCase().includes(filterValues[0])
      );

    }
    return searchRes;
  }


  displaySelectedContact(name:NistContact):string{
    var res = name && name.firstName ? name.lastName + ", " + name.firstName : '';
    return res;

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
  
  contributorRoles = ROLES; // sets hardcoded roles values
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

  /**
   * Resets form fields for Contributor personnel
   */
  private resetContributorFields(){
    this.errorMessage = "";
    this.crntContribRole = "";

    // Reset NIST employe / associate fields
    this.nistContribRole = "";    
    this.personelForm.controls['dmp_contributor'].setValue("");

    // reset external collaborator data fields    
    this.extContribRole =  "";
    this.externalContributor = {
      contributor:{firstName:"", lastName:""}, 
      role:"",
      e_mail:"",
      instituion:""
    };
  }

  onContributorChange(value:any){    
    this.contributorRadioSel=value.id;
    this.disableAdd=true;
    this.resetContributorFields();
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

    const regex = /[A-Z]/i;
    // Disable buttons while the user is inputing new row
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;

    //reset dropdown selection flags
    this.sel_NIST_Contributor = false;
    this.sel_NIST_ContribRole = false;

    if (this.contributorRadioSel === "contributorExternal"){
      
      /**
       * Check first name
       */
      if (this.externalContributor.contributor.firstName.match(regex)){
        this.crntContribName = this.externalContributor.contributor.firstName;
      }
      else{
        this.errorMessage = "Missing contributor First Name";
        this.extContribRole =  "";
        return;
      }

      /**
       * Check last name
       */
      if (this.externalContributor.contributor.lastName.match(regex)){
        this.crntContribSurname = this.externalContributor.contributor.lastName;
      }
      else{
        this.errorMessage = "Missing contributor Last Name";
        this.extContribRole =  "";
        return;
      }

      /**
       * Check institution
       */
      if (!(this.externalContributor.instituion.match(regex))){
        this.errorMessage = "Missing contributor Institution / Affiliation";
        this.extContribRole =  "";
        return;
      }

      /**
       * Check e-mail
       */
      if (this.externalContributor.e_mail.match(regex)){
        this.crntContribEmail = this.externalContributor.e_mail;
      }
      else{
        this.errorMessage = "Missing contributor First Name";
        this.extContribRole =  "";
        return;
      }
    }

    var filterOnEmail = this.dmpContributor.filter(      
      (member: any) => member.e_mail.toLowerCase() === this.crntContribEmail.toLowerCase()
    );

    if(filterOnEmail.length > 0){

      this.errorMessage = "Contributor " + this.crntContribName + " " + this.crntContribSurname + " with e-mail address " + this.crntContribEmail + " is already in the list of contributors";

      this.disableAdd = false;
      this.disableClear = false;
      this.disableRemove = false;
      this.extContribRole =  "";
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

    this.resetContributorFields();

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

    this.disableClear=false;
    this.disableRemove=false;

  }

  selExtContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.extContribRole, this.contributorRoles)[0].value;
    this.sel_EXT_ContribRole = true; // indicates that drop down select has been performed
    this.disableAdd=false;
  }

  resetPersonnelForm(){

    this.dmpReviewer = "";
    this.nistContribRole = "";
    this.externalContributor.contributor.firstName = "";
    this.externalContributor.contributor.lastName = "";
    this.externalContributor.instituion = "";
    this.extContribRole = "";
    this.externalContributor.e_mail = "";
    this.contributorRadioSel = "";
    this.personelForm.patchValue({
      nistContactFirstName:       "",
      nistContactLastName:        ""
      // nistReviewerFirstName:      "",
      // nistReviewerLastName:       ""
    });
    this.clearTable();
  }



}
