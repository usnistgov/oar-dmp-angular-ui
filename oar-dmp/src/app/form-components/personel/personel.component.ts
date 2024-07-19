import { Component, OnInit, Input, Output  } from '@angular/core';
import { ROLES } from '../../types/mock-roles';
import { NIST_STAFF, NIST_CONTACT } from '../../types/nist-staff-mock.type'; //possibly need to comment this out
import { Contributor } from '../../types/contributor.type';
import { DmpAPIService } from '../../shared/dmp-api.service';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
import { NistContact } from '../../types/nist-contact'

import { Validators, UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith, lastValueFrom } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
// import { ORGANIZATIONS } from '../../types/mock-organizations';
import { NistOrganization } from 'src/app/types/nist-organization';

import {Observable} from 'rxjs';

interface DataContributor extends Contributor{
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
    key: 'firstName',
    type: 'text',
    label: 'Name',
  },
  {
    key: 'lastName',
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
    key: 'emailAddress',
    type: 'text',
    label: 'e-mail',
  },
  {
    key: 'orcid',
    type: 'text',
    label: 'ORCID',
  },
  {
    key: 'groupNumber',
    type: 'text',
    label: 'ORG ID',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

interface dmpOgranizations {
  org_cd:string;
  dmp_organization: string;  
  id: number;
  isEdit: boolean;
}

const ORG_COL_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  {
    key: 'org_cd',
    type: 'text',
    label: 'Org ID',
  },
  {
    key: 'dmp_organization',
    type: 'text',
    label: 'Organization',
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
  styleUrls: ['./personel.component.scss', '../form-layout.scss', '../form-table.scss']
})
export class PersonelComponent implements OnInit {
  // ================================
  // used for organizations table
  // ================================
  org_disableAdd:boolean = true;
  org_disableClear:boolean = true;
  org_disableRemove:boolean = true;
  org_errorMessage: string = '';
  dmpOrganizations: dmpOgranizations[] = []
  org_displayedColumns: string[] = ORG_COL_SCHEMA.map((col) => col.key);
  org_columnsSchema: any = ORG_COL_SCHEMA;
  fltr_NIST_Org!: Observable<NistOrganization[]>;
  //List of all nist organizations from NIST directory
  nistOrganizations: any = null;
  crntOrgID:number = 0;
  crntOrgCD:string ="";
  crntOrgName:string = "";
  
  // ================================  

  disableAdd:boolean = true;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  dmpContributors: DataContributor[] = []

  // flags to determine if select drop down has been used
  sel_NIST_Contributor: boolean = false; 
  sel_NIST_ContribRole: boolean = false;
  
  sel_EXT_Contributor: boolean = false;
  sel_EXT_ContribRole: boolean = false;

  crntContribName: string = "";
  crntContribSurname: string = "";  
  crntContribOrcid: string = "";
  crntContribEmail: string = "";

  crntContribGroupOrgID: number = 0;  
  crntContribGroupNumber: string = "";
  crntContribGroupName: string = "";

  crntContribDivisionOrgID: number = 0;  
  crntContribDivisionNumber: string = "";
  crntContribDivisionName: string = "";

  crntContribOuOrgID: number = 0;  
  crntContribOuNumber: string = "";
  crntContribOuName: string = "";

  crntContribRole: string = "";
  
  
  nistContribOrcid: string = "";
  nistContribRole: string = "";

  extContribOrcid: string = "";
  extContribRole: string = "";

  primNistContactOrcid: string = "";

  contributorRoles = ROLES; // sets hardcoded roles values
  
  fltr_Prim_NIST_Contact!: Observable<NistContact[]>;
  fltr_NIST_Contributor!: Observable<NistContact[]>;

  nistPeople!: any;
  NISTOUDivisionGroup!: Array<any>;
  initializing!:boolean;


  // Default values of external contributor
  externalContributor: Contributor={
    
    firstName:"", lastName:"", orcid:"", emailAddress:"", 
    groupOrgID:0, groupNumber:"", groupName:"",
    divisionOrgID:0, divisionNumber:"", divisionName:"",
    ouOrgID:0, ouNumber:"", ouName:"",
    
    role:"",
    institution:""
  };

  
  pncOrcidWarn: string = ""; // primary NIST contact warning message
  pncErrorMessage: string =""; //primary NIST contact error messag

  contribOrcidWarn: string = ""; //contributor orcid warning message
  errorMessage: string = ""; // contributor error message
  static ORCID_ERROR = "Ivalid ORCID format. The correct ORCID format is of the form xxxx-xxxx-xxxx-xxxx where first three groups are numeric and final fourth group is numeric with optional letter 'X' at the end";
  static NIST_ORCID_WARNING = "Warning: Missing primary NIST contact's ORCID information. While this is not a mandatory field for a DMP it will be required if this DMP results in a publication.";
  static ORCID_WARNING = "Warning: Missing contributor ORCID information. While this is not a mandatory field for a DMP it will be required if this DMP results in a publication.";

  people:Array<NistContact> =[] ;

  constructor(
    private dropDownService: DropDownSelectService,
    private apiService: DmpAPIService,
    private fb: UntypedFormBuilder
  ) {
    /**
     * NOTE uncoment this when pulling data from API with a backend database
     */
    // this.getNistContactsFromAPI(); //sets values from API service
    // console.log(" PersonelComponent constructor");

  }

  personelForm = this.fb.group(
    {
      primary_NIST_contact:       ['', Validators.required],
      primNistContactOrcid:       [''],
      dmp_contributor:            [''],
      // nistContactFirstName:       [''],
      // nistContactLastName:        [''],      
      contributors:               [[]],
      nistOrganization: [],
      organizations: [[]]
    }
  );

  

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(personel: DMP_Meta) {
    // loop over organizations array sent from the server and populate local copy of 
    // organizations aray in order to populate the table of organizations in the GUI interface
    personel.organizations.forEach( 
      (org, index) => {        
        this.dmpOrganizations.push({id:index, org_cd:org.ORG_CD, dmp_organization:org.name, isEdit:false});
        this.disableClear=false;
        this.disableRemove=false;
      }
      
    );
    // loop over resources array sent from the server and populate local copy of 
    // resources array to populate the table of resources in the user interface
    this.contribOrcidWarn = '';
    personel.contributors.forEach(
      (aContributor, index) => {
        if (aContributor.orcid.length === 0){
          this.contribOrcidWarn = PersonelComponent.ORCID_WARNING;
        }
        this.dmpContributors.push({
          id:           index, 
          isEdit:       false, 
      
          firstName:        aContributor.firstName,
          lastName:         aContributor.lastName,
          orcid:            aContributor.orcid,
          emailAddress:     aContributor.emailAddress,

          groupOrgID:       aContributor.groupOrgID,
          groupNumber:      aContributor.groupNumber,
          groupName:        aContributor.groupName,

          divisionOrgID:    aContributor.divisionOrgID,
          divisionNumber:   aContributor.divisionNumber,
          divisionName:     aContributor.divisionName,

          ouOrgID:          aContributor.ouOrgID,
          ouNumber:         aContributor.ouNumber,
          ouName:           aContributor.ouName,
       
      
          role:         aContributor.role,
          institution:  aContributor.institution
          
          
        });
        this.disableClear=false;
        this.disableRemove=false;
      }
    )

    this.personelForm.patchValue({
      primary_NIST_contact:       { firstName: personel.primary_NIST_contact.firstName, 
                                    lastName:personel.primary_NIST_contact.lastName,
                                    orcid:personel.primary_NIST_contact.orcid
                                  },
      nistContactFirstName:       personel.primary_NIST_contact.firstName,
      nistContactLastName:        personel.primary_NIST_contact.lastName,
      primNistContactOrcid:       personel.primary_NIST_contact.orcid,
      contributors:               personel.contributors,
      organizations:              personel.organizations
    });

    this.pncOrcidWarn = '';
    if(personel.primary_NIST_contact.orcid.length === 0){
      this.pncOrcidWarn = PersonelComponent.NIST_ORCID_WARNING;
    }
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
            primary_NIST_contact:   { 
                                      firstName:      formValue.primary_NIST_contact.firstName, 
                                      lastName:       formValue.primary_NIST_contact.lastName,
                                      orcid:          formValue.primary_NIST_contact.orcid,
                                      emailAddress:   formValue.primary_NIST_contact.emailAddress,
                                      
                                      groupOrgID:     formValue.primary_NIST_contact.groupOrgID,
                                      groupNumber:    formValue.primary_NIST_contact.groupNumber,
                                      groupName:      formValue.primary_NIST_contact.groupName,

                                      divisionOrgID:  formValue.primary_NIST_contact.divisionOrgID,
                                      divisionNumber: formValue.primary_NIST_contact.divisionNumber,
                                      divisionName:   formValue.primary_NIST_contact.divisionName,

                                      ouOrgID:        formValue.primary_NIST_contact.ouOrgID,
                                      ouNumber:       formValue.primary_NIST_contact.ouNumber,
                                      ouName:         formValue.primary_NIST_contact.ouName
                                    },
            contributors:           formValue.contributors,
            organizations:          formValue.organizations

          }
        )
      )
    )
  );

  ngOnInit(): void {
    // console.log(" PersonelComponent ngOnInit");
    /**
     * NOTE Comment below when woking with API
     */
    this.initializing = true;//set this flag the first time the form is loaded
    this.getNistContacts();

    /**
     * NOTE Comment below when woking with API
     */
    this.getNistOrganizations();

  }  

  //List of contributors that will be aded to the DMP
  contributors: Contributor[]=[];

  //List of all nist contacts from NIST directory
  nistContacts: any = null;

  pncOrcidChange(){
    // set/reset NIST primary contact ORCID warning and error messages message if ORCID data is entered/changed
    this.pncOrcidWarn = "";
    this.pncErrorMessage = "";
    let orcid = this.personelForm.value['primNistContactOrcid'];
    if (orcid.length > 0){
      if(!this.isValidPrimaryContactOrcid()){
        this.pncErrorMessage = PersonelComponent.ORCID_ERROR;
      }
    }
    else {
      this.pncOrcidWarn = PersonelComponent.NIST_ORCID_WARNING;
    }

  }

  /**
   * This function gets hard coded NIST contasts
   * Used when not working with an API for NIST contacts database
   */
  getNistContacts(){    
    // this.getNistContactsNoAPI();
    this.getNistContactsFromAPI();

  }

  getNistContactsNoAPI(){
    this.nistContacts = NIST_STAFF;
    // Below line gets executed anytime the user types - or the input value changes
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

          const name = typeof value === 'string' ? value : value?.firstName + " " + value?.lastName;
          var res = name ? this._filter(name as string): this.nistContacts.slice();

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

    // Below line gets executed anytime the user types - or the input value changes
    this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
      startWith(''),
      map (contributor => {             
          
          const name = typeof contributor === 'string' ? contributor : contributor?.firstName + " " + contributor?.lastName;
          var res3 = name ? this._filter(name as string): this.nistContacts.slice();
          
          if (res3.length ===1){            
            this.crntContribName = contributor.firstName;
            this.crntContribSurname = contributor.lastName;
            this.crntContribEmail = contributor.emailAddress;

            this.sel_NIST_Contributor = true; // indicates that drop down select has been performed

            if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
              this.disableAdd=false;
            }
          }
          return res3;

        }
      )
    );

  }


  getNistContactsFromAPI(){
    // ---------------------------------------------------------------------------------------------
    //                              PRIMARY NIST CONTACT
    // ---------------------------------------------------------------------------------------------
    // Below line gets executed anytime the user types - or the input value changes
    this.fltr_Prim_NIST_Contact = this.personelForm.controls['primary_NIST_contact'].valueChanges.pipe(
      startWith(''),
      map (value => {
          let res:NistContact[] = [];

          const name = typeof value === 'string'; //checks the type of input value

          if (!name){ 
            // if value is not string that means the user has picked a selection from dropdown suggestion box
            // so return an empty array to clear the dropdown suggestion box and set form values accordingly
            this.personelForm.patchValue({
              nistContactFirstName: value.firstName,
              nistContactLastName:  value.lastName,
              primNistContactOrcid: value.orcid
            });

            if(value.orcid){
              this.personelForm.value['primNistContactOrcid'] = value.orcid; // automatically populate orcid field
              this.pncOrcidChange(); // fire off orcid change to determine whether to show warning message  
            }
            
            
            return res;
            // this.people = [];
            // return this.people;
          }

          if (value.trim().length < 2){
            this.people = [];//reset search results
          }

          if (value.trim().length === 2 && this.people.length ===0){
            // query people service and cache results
            this.apiService.get_NIST_Personnel(value).then(
              (nistPeople: any[]) => {
                this.people = [];
                // nist people can be blank if return has no match
                if(nistPeople){
                  for(var i=0; i<nistPeople.length; i++) {
                    this.people.push({
                      // We are only using metadata for firstName, lastName and orcid but other data could be used int he future
                      displayName:nistPeople[i].displayName,
                      firstName:nistPeople[i].firstName,
                      lastName:nistPeople[i].lastName,
                      orcid:nistPeople[i].orcid,                      
                      emailAddress:nistPeople[i].emailAddress,

                      groupOrgID:nistPeople[i].groupOrgID,
                      groupNumber:nistPeople[i].groupNumber,
                      groupName:nistPeople[i].groupName,

                      divisionOrgID:nistPeople[i].divisionOrgID,
                      divisionNumber:nistPeople[i].divisionNumber,
                      divisionName:nistPeople[i].divisionName,

                      ouOrgID:nistPeople[i].ouOrgID,
                      ouNumber:nistPeople[i].ouNumber,
                      ouName:nistPeople[i].divisionName
    
                    });
                  }
                  // this.people = nistPeople;
                  console.log(this.people);
                  res = this.people;
                  
                }                
              }
            );
          }
          else{
            res = this._filter(value as string);
          }

          // Don't patch empty values if the form is loading for the first time because it will clear
          // data that has come from the retreiving an existing record from database
          if (!this.initializing){
            // Patch empty value until the user has picked a selection. 
            // This forces the form to accept only values that were selected from the dropdown menu
            this.personelForm.patchValue({
              nistContactFirstName: '',
              nistContactLastName:  '',
              primNistContactOrcid: ''
            });
            this.personelForm.value['primNistContactOrcid'] = ''; // automatically clear orcid field
          }
          // set initialization flag to false once the record has been loaded
          this.initializing = false;

          
          return res;
        }
      )
    );
    // ---------------------------------------------------------------------------------------------
    //                              NIST CONTRIBUTOR
    // ---------------------------------------------------------------------------------------------
    this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
      startWith(''),
      map (contributor => {
          let res:NistContact[] = [];

          const name = typeof contributor === 'string'; //checks the type of input value

          if (!name){ 
            // if value is not string that means the user has picked a selection from dropdown suggestion box
            // so return an empty array to clear the dropdown suggestion box and set form values accordingly
            this.crntContribName = contributor.firstName;
            this.crntContribSurname = contributor.lastName;
            
            if(contributor.orcid){
              //orcid can be null so assign it only if it is not null
              this.nistContribOrcid = contributor.orcid; // automatically populate orcid field if it is not null
            }

            if(contributor.emailAddress){
              // email can apparently be null - Planchard Joshua is/was an example
              this.crntContribEmail = contributor.emailAddress;
            }

            this.crntContribGroupOrgID = contributor.groupOrgID;
            this.crntContribGroupNumber = contributor.groupNumber;
            this.crntContribGroupName = contributor.groupName;

            this.crntContribDivisionOrgID = contributor.divisionOrgID;
            this.crntContribDivisionNumber = contributor.divisionNumber;
            this.crntContribDivisionName = contributor.divisionName;

            this.crntContribOuOrgID = contributor.ouOrgID;
            this.crntContribOuNumber = contributor.ouNumber;
            this.crntContribOuName = contributor.ouName;

            

            this.sel_NIST_Contributor = true; // indicates that drop down select has been performed

            if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
              // If contributor role has been selected and nist contributor has been picked then allow
              // for adding a contributor to the table
              this.disableAdd=false;
            }
            
            return res;
          }

          if (contributor.trim().length < 2){
            return res;
          }

          
          this.apiService.get_NIST_Personnel(contributor).then(
            (nistPeople: any[]) => {
              // nist people can be blank if return has no match
              if(nistPeople){
                for(var i=0; i<nistPeople.length; i++) {
                  res.push({
                    // We are only using metadata for firstName, lastName and orcid but other data could be used int he future
                    displayName:nistPeople[i].displayName,
                    firstName:nistPeople[i].firstName,
                    lastName:nistPeople[i].lastName,
                    orcid:nistPeople[i].orcid,                      
                    emailAddress:nistPeople[i].emailAddress,

                    groupOrgID:nistPeople[i].groupOrgID,
                    groupNumber:nistPeople[i].groupNumber,
                    groupName:nistPeople[i].groupName,

                    divisionOrgID:nistPeople[i].divisionOrgID,
                    divisionNumber:nistPeople[i].divisionNumber,
                    divisionName:nistPeople[i].divisionName,

                    ouOrgID:nistPeople[i].ouOrgID,
                    ouNumber:nistPeople[i].ouNumber,
                    ouName:nistPeople[i].ouName
  
                  });
                }
              }
              
            }
          );
          

          // clear values until the user has picked a selection. 
          // This forces the form to accept only values that were selected from the dropdown menu
          this.crntContribName = '';
          this.crntContribSurname = '';
          this.crntContribEmail = '';
          this.nistContribOrcid = '';

          return res;

        }
      )

    );



    //       this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
    //         startWith(''),
    //         map (contributor => {             
                
    //             const name = typeof contributor === 'string' ? contributor : contributor?.firstName + " " + contributor?.lastName;
    //             var res3 = name ? this._filter(name as string): this.nistContacts.slice();
                
    //             if (res3.length ===1){
    //               this.crntContribName = contributor.firstName;
    //               this.crntContribSurname = contributor.lastName;
    //               this.crntContribEmail = contributor.emailAddress;

    //               this.sel_NIST_Contributor = true; // indicates that drop down select has been performed

    //               if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
    //                 this.disableAdd=false;
    //               }
    //             }
    //             return res3;

    //           }
    //         )
    //       );
    //     },
    //     error: (e) => console.error(e) 
    //   }
    // );
  }

  private _filter(nistPerson: string): NistContact[] {
    //split name on comma to get last name
    // Beacuase the person name in the gui is displayed as <last name>, <first name> delimited by comma and white space
    // filterValues[1] = last name
    // filterValues[0] = first name String(person.year).startsWith('198')
    const filterValues = nistPerson.toLowerCase().split(",");
    var searchRes;

    searchRes = this.people.filter(
      (option:any) => option.lastName.toLowerCase().startsWith(filterValues[0])
    );

    return searchRes;
  }

  private old_filter(nistPerson: string): NistContact[] {
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
  
  
  selContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.nistContribRole, this.contributorRoles)[0].value;

    this.sel_NIST_ContribRole = true; // indicates that drop down select has been performed

    if (this.sel_NIST_ContribRole && this.sel_NIST_Contributor){
      this.disableAdd=false;
    }

  }  
  
  private contributorRadioSel: string="";

  /**
   * Resets form fields for Contributor personnel
   */
  private resetContributorFields(){
    this.errorMessage = "";
    this.crntContribRole = "";

    // Reset NIST employe / associate fields
    this.nistContribRole = "";
    this.nistContribOrcid = ""    ;
    this.personelForm.controls['dmp_contributor'].setValue("");

    // reset external collaborator data fields    
    this.extContribRole =  "";
    this.externalContributor = {
      
      firstName:"", lastName:"", orcid:"", emailAddress:"", 
      groupOrgID:0, groupNumber:"", groupName:"",
      divisionOrgID:0, divisionNumber:"", divisionName:"",
      ouOrgID:0, ouNumber:"", ouName:"",
  
      role:"",
      institution:""
    };
  }

  onContributorChange(value:any){    
    this.contributorRadioSel=value.id;
    this.disableAdd=true;
    this.resetContributorFields();
  }
  
  removeSelectedRows() {
    this.dmpContributors = this.dmpContributors.filter((u: any) => !u.isSelected);
    this.resetTable();
    this.contribOrcidWarn = "";
    this.dmpContributors.forEach((element)=>{        
        if (element.orcid.length == 0){
          this.contribOrcidWarn = PersonelComponent.ORCID_WARNING;
        }
        // re populate contributors array
        this.personelForm.value['contributors'].push({
          
          firstName:element.firstName, 
          lastName:element.lastName,
          orcid: element.orcid,
          emailAddress: element.emailAddress,

          groupOrgID:element.groupOrgID,
          groupNumber:element.groupNumber,
          groupName:element.groupName,

          divisionOrgID:element.divisionOrgID,
          divisionNumber:element.divisionNumber,
          divisionName:element.divisionName,

          ouOrgID:element.ouOrgID,
          ouNumber:element.ouNumber,
          ouName:element.ouName,
          
          institution: element.institution,
          role: element.role
        });
    });
    if (this.dmpContributors.length === 0){
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
    this.dmpContributors = [];
    this.resetTable();
     // If the table is empty disable clear and remove buttons
    this.disableClear=true;
    this.disableRemove=true;
  }

  private isORCID(val:string):boolean{
    const reORCID = /^(\d{4}-){3}\d{3}(\d|X)$/;
    return reORCID.test(val);

  }

  onDoneClick(e:any){
    this.contribOrcidWarn = "";
    if (!e.emailAddress.length) {
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
    else if(!e.firstName.length) {
      this.errorMessage = "Name can't be empty";
      return;
    }
    else if(!e.role.length) {
      this.errorMessage = "Role can't be empty";
      return;
    }
    else if(!e.lastName.length) {
      this.errorMessage = "Surname can't be empty";
      return;
    }
    else if (!this.isORCID(e.orcid) && e.orcid.length > 0){
      this.errorMessage = PersonelComponent.ORCID_ERROR;
      return;
    }    

    this.errorMessage = '';
    this.resetTable();
    this.contribOrcidWarn = "";
    this.dmpContributors.forEach((element)=>{
        if(element.id === e.id){
          element.isEdit = false;
        }        
        if (element.orcid.length == 0){
          this.contribOrcidWarn = PersonelComponent.ORCID_WARNING;
        }
        // re populate contributors array
        this.personelForm.value['contributors'].push({
          
          firstName:element.firstName, 
          lastName:element.lastName,
          orcid: element.orcid,
          emailAddress: element.emailAddress,

          groupOrgID:element.groupOrgID,
          groupNumber:element.groupNumber,
          groupName:element.groupName,

          divisionOrgID:element.divisionOrgID,
          divisionNumber:element.divisionNumber,
          divisionName:element.divisionName,

          ouOrgID:element.ouOrgID,
          ouNumber:element.ouNumber,
          ouName:element.ouName,
          
          institution: element.institution,
          role: element.role
        });
      }
    )

    this.disableClear=false;
    this.disableRemove=false;

  }

  addRow(){

    const regex = /[A-Z]/i;
    /*
    * TODO:
    Rethink when to check input. Currently this function and onDoneClick both perform
    input validation. This one does immedeate input validation before adding row to the 
    GUI table while onDoneClick performs validation of data that is sent to the MongoDB
    */

    if (this.contributorRadioSel === "contributorExternal"){
      // TODO: regex checks only that the first value is a letter.
      // More comprehensive input validation is necessary

      /**
       * Check first name
       */
      if (this.externalContributor.firstName.match(regex)){        
        this.crntContribName = this.externalContributor.firstName;
      }
      else{
        this.errorMessage = "Missing contributor First Name";
        this.extContribRole =  "";
        return;
      }

      /**
       * Check last name
       */
      if (this.externalContributor.lastName.match(regex)){
        this.crntContribSurname = this.externalContributor.lastName;
      }
      else{
        this.errorMessage = "Missing contributor Last Name";
        this.extContribRole =  "";
        return;
      }

      /**
       * Check institution
       */
      if (!(this.externalContributor.institution.match(regex))){
        this.errorMessage = "Missing contributor Institution / Affiliation";
        this.extContribRole =  "";
        return;
      }

      /**
       * Check e-mail
       */
      if (this.externalContributor.emailAddress.match(regex)){
        this.crntContribEmail = this.externalContributor.emailAddress;
      }
      else{
        this.errorMessage = "Missing contributor First Name";
        this.extContribRole =  "";
        return;
      }

      // add ORCID field
      this.crntContribOrcid = this.externalContributor.orcid;      
    }
    else{
      //we're adding a nist contributor so assign orcid text field
      this.crntContribOrcid = this.nistContribOrcid;
    }

    // check ORCID
    const isORCID = this.isORCID(this.crntContribOrcid);
      
    if (!isORCID && this.crntContribOrcid.length>0){
      this.errorMessage = PersonelComponent.ORCID_ERROR;
      return;
    }
    else if(this.crntContribOrcid.length == 0){
      this.contribOrcidWarn = PersonelComponent.ORCID_WARNING;
    }

    var filterOnEmail = this.dmpContributors.filter(      
      (member: any) => member.emailAddress.toLowerCase() === this.crntContribEmail.toLowerCase()
    );

    if(filterOnEmail.length > 0){

      this.errorMessage = "Contributor " + this.crntContribName + " " + this.crntContribSurname + " with e-mail address " + this.crntContribEmail + " is already in the list of contributors";

      this.disableAdd = false;
      this.disableClear = false;
      this.disableRemove = false;
      this.extContribRole =  "";
      return;

    }

    // Disable buttons while the user is inputing new row
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;

    //reset dropdown selection flags
    this.sel_NIST_Contributor = false;
    this.sel_NIST_ContribRole = false;

    const newRow = {
      
      firstName: this.crntContribName,
      lastName: this.crntContribSurname,
      orcid: this.crntContribOrcid,
      emailAddress: this.crntContribEmail,

      groupOrgID:this.crntContribGroupOrgID,
      groupNumber:this.crntContribGroupNumber,
      groupName:this.crntContribGroupName,

      divisionOrgID:this.crntContribDivisionOrgID,
      divisionNumber:this.crntContribDivisionNumber,
      divisionName:this.crntContribDivisionName,

      ouOrgID:this.crntContribOuOrgID,
      ouNumber:this.crntContribOuNumber,
      ouName:this.crntContribOuName,

      institution:"",
      role:this.crntContribRole,
      
      id: Date.now(),
      isEdit: false,
    };
    
    if (this.contributorOption == "NIST"){
      newRow.institution = this.contributorOption;
    }
    else{
      newRow.institution = this.externalContributor.institution;
    }

    // create a new array using an existing array as one part of it 
    // using the spread operator '...'
    this.dmpContributors = [newRow, ...this.dmpContributors];

    //update changes made to the table in the personel form
    this.onDoneClick(newRow);

    this.resetContributorFields();

  }

  isValidPrimaryContactOrcid(){    
    let orcid = this.personelForm.value['primNistContactOrcid'];
    if (orcid.length > 0){
      return this.isORCID(orcid);
    }
    else{
      return true;
    }
  }

  removeRow(id:any) {
    // select word from the specific id
    var selWord = this.dmpContributors.filter((u) => u.id === id);    
    this.personelForm.value['contributors'].forEach((value:Contributor,index:number) =>{
      selWord.forEach((word)=>{
        /**
         * NOTE: 
         * assuming here that e-mail is always unique
         * i.e. that there are no two contributors with the same e-mail
         * Some check could be performed as a future feature to ensure that
         * when adding a new contributor the e-mail is unique and always present field
         */
        if(value.emailAddress === word.emailAddress){
          //remove from DmpRecord
          this.personelForm.value['contributors'].splice(index,1);
        }
      });
    });

    // remove from the display table
    this.dmpContributors = this.dmpContributors.filter((u) => u.id !== id);
  }

  selExtContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.extContribRole, this.contributorRoles)[0].value;
    this.sel_EXT_ContribRole = true; // indicates that drop down select has been performed
    this.disableAdd=false;
  }

  resetPersonnelForm(){
    
    this.nistContribRole = "";
    this.nistContribOrcid = "";
    this.externalContributor.firstName = "";
    this.externalContributor.lastName = "";
    this.externalContributor.orcid = "";
    this.externalContributor.institution = "";
    this.extContribRole = "";
    this.externalContributor.emailAddress = "";
    this.contributorRadioSel = "";
    this.personelForm.patchValue({
      nistContactFirstName:       "",
      nistContactLastName:        "",
      primNistContactOrcid:       ""
    });
    this.clearTable();
    this.org_clearTable();
  }

  // ==================================================
  // ==================================================
  // ==================================================

   /**
   * This function gets all NIST organizations by querying people service
   * 
   */
   getNistOrganizations(){    
    this.nistOrganizations = [];
    // preload list of all OUs by making a call to people service
    this.apiService.get_NISTOUDivisionGroup().then(
      (DivsAndGroups:any[])=>{
        if(DivsAndGroups){
          for(let i=0; i < DivsAndGroups.length; i++){
            // Cache the results taking only ou Id and full name
            this.nistOrganizations.push(
              {
              ORG_CD:DivsAndGroups[i].orG_CD,
              name:DivsAndGroups[i].orG_Name,
              }
            );
            
          }
        }
      }
    );
    this.getNistOrganizationsFromAPI();
    // this.getNistOrganizationsNoAPI();

  }

  getNistOrganizationsFromAPI(){
    //ORGANIZATIONS is declared in '../../types/mock-organizations'
    // this.nistOrganizations = ORGANIZATIONS;
    this.fltr_NIST_Org = this.personelForm.controls['nistOrganization'].valueChanges.pipe(
      startWith(''),
      map(anOrganization => {
        let res:Array<any> = [];
        const orgName = typeof anOrganization ==='string';

        if (!orgName){
          // if value is not string that means the user has picked a selection from dropdown suggestion box
          // so return an empty array to clear the dropdown suggestion box and set form values accordingly
          this.crntOrgCD = anOrganization.ORG_CD;
          this.crntOrgName = anOrganization.name;

          this.org_disableAdd = false;

        }
        else{
          res =this._filter_org(anOrganization as string);
          this.org_disableAdd = true;

        }
        return res;
      }

      )

    );

  }

  getNistOrganizationsNoAPI(){
    //ORGANIZATIONS is declared in '../../types/mock-organizations'
    this.nistOrganizations = []//ORGANIZATIONS;
    this.fltr_NIST_Org = this.personelForm.controls['nistOrganization'].valueChanges.pipe(
      startWith(''),
      map(anOrganization => {
        const orgName = typeof anOrganization ==='string' ? anOrganization : anOrganization?.name
        var res = orgName ? this._filter_org(orgName as string):this.nistOrganizations.slice();
        if (res.length ===1){
          this.crntOrgCD = anOrganization.ORG_CD;
          this.crntOrgName = anOrganization.name;

          this.org_disableAdd = false;
        }
        else{
          this.org_disableAdd = true;
        }
        return res;
      }

      )

    );

  }

  displaySelectedOrganization(org:NistOrganization):string{
    var res = org && org.ORG_CD? org.name : '';
    return res;

  }

  org_removeSelectedRows() {
    //assign unselected rows to dmpOrganizations
    this.dmpOrganizations = this.dmpOrganizations.filter((u: any) => !u.isSelected);
    //reset the table 
    this.org_resetTable();
    //repopulate the table with what's left in the array
    this.rePopulateOrgs();

    if (this.dmpOrganizations.length === 0){
      // If the table is empty disable clear and remove buttons
      this.org_disableClear=true;
      this.org_disableRemove=true;
    }
  }

  org_resetTable(){
    this.personelForm.patchValue({
      organizations:[]
    })
  }

  org_clearTable(){
    this.dmpOrganizations = []
    this.org_resetTable();
    this.org_disableAdd=true;
    this.org_disableClear=true;
    this.org_disableRemove=true;
  }

  org_addRow(){
    const newRow = {
      id: Date.now(),      
      org_cd:this.crntOrgCD,
      dmp_organization: this.crntOrgName,
      isEdit: false,
    };
    // check that if any org id or org name is undefined 
    // - this can happen if user types in the search box but does not select 
    //    an actual organization from the drop down menu

    if (typeof newRow.org_cd === "undefined" || typeof newRow.dmp_organization === "undefined"){
      this.org_errorMessage = "Select an existing NIST Organization";
      return;

    }

    // Check if selected organization is already in the table
    var selRow = this.dmpOrganizations.filter((u) => u.org_cd === newRow.org_cd);
    if (selRow.length > 0){
      this.org_errorMessage = "The selected Organization is already associated with this DMP.";
      return;
    }
    //add new row to the dmpOrganizations array
    this.dmpOrganizations = [newRow, ...this.dmpOrganizations]

    //reset the table
    this.org_resetTable();

    // re-populate the table with entries from dmpOrganizations array 
    // and update the form metadata
    this.rePopulateOrgs();

    this.org_disableAdd=true;
    this.org_disableClear=false;
    this.org_disableRemove=false;
    // reset the form field to make it clear that one can add multiple orgs
    this.personelForm.controls['nistOrganization'].setValue("");
  }

  private rePopulateOrgs(){
    this.dmpOrganizations.forEach(
      (org)=>{
        this.personelForm.value['organizations'].push(
          {
            ORG_CD:org.org_cd,
            name:org.dmp_organization
          }
        )
      }
    )
  }

  org_removeRow(id:any) {
    var selRow = this.dmpOrganizations.filter((u) => u.id === id); 

    // update the form metadata
    this.personelForm.value['organizations'].forEach(
      (value:NistOrganization, index:number)=>{
        selRow.forEach(
          (org)=>{
            if (value.ORG_CD === org.org_cd){
              //remove selected organization
              this.personelForm.value['organizations'].splice(index,1);
            }
          }
        )
      }
    )

    // remove from the display table
    this.dmpOrganizations = this.dmpOrganizations.filter((u) => u.id !== id);
  }

  private _filter_org(nistOrg:string): NistOrganization[] {
    // add button should be disabled while filtering is being performed
    // and should be enabled only when an existing organization has been selected
    this.org_disableAdd = true;

    const filterValues = nistOrg.toLowerCase()
    var searchRes;
    searchRes = this.nistOrganizations.filter(
      (option:any) => option.name.toLowerCase().includes(filterValues)
    );

    return searchRes;

  }
  /**

  // this function gets executed on iput change and on focus change
  p_filter(){
    
    let a = this.personelForm.controls['primary_NIST_contact'].value;
    if (a.length > 1){
      // search if two or more characters were entered
      console.log(a);
      this.apiService.get_NIST_Personnel(a).subscribe(
        (value: any[]) => {
          for(var i=0; i<value.length; i++) {
            let temp_val = value[i];
            let temp2=2;
          }
        }
      );
    }
  }
     */






}
