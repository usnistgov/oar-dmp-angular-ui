import { Component, OnInit, Input, Output  } from '@angular/core';
import { confirmDialog } from 'src/app/shared/dmp.service';
import { ROLES } from '../../types/contributor-roles';
import { Contributor } from '../../types/contributor.type';
import { DropDownSelectService } from '../../shared/drop-down-select.service';

import { Validators, UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith, lastValueFrom, catchError } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
// import { ORGANIZATIONS } from '../../types/mock-organizations';
import { NistOrganization } from 'src/app/types/nist-organization';
import { ResponsibleOrganizations } from 'src/app/types/responsible-organizations.type';

import {Observable, switchMap, tap} from 'rxjs';

import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';

import * as _ from 'lodash';

// import { error } from 'console';

// used for dropdown menu containing values "Yes" and "No" to indicate
// wheter a NIST DMP contributor is a primary contact
interface primaryContactValues {
  id: number;
  value: string;
}

interface DataContributor extends Contributor{
  id: number;
  isEdit: boolean;
}

interface externalContributor{
  firstName: string;
  lastName:string;
  orcid:string;
  institution:string;
  emailAddress:string;
  role:string;
}

// Schema for Contributors data table
const CONTRIB_COL_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
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
    key: 'primary_contact',
    type: 'text',
    label: 'Primary Contact',
  },
  {
    key: 'institution',
    type: 'text',
    label: 'Institution',
  },
  {
    key: 'groupNumber',
    type: 'text',
    label: 'ORG ID',
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
  
  
]

interface dmpOgranizations {
  groupName: string,
  groupNumber: string,
  groupOrgID: number,
  groupAcronym: string,
  
  divisionName: string,
  divisionNumber: string,
  divisionOrgID: number,
  divisionAcronym: string,

  ouName: string,
  ouNumber: string,
  ouOrgID: number,
  ouAcronym: string,

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
    key: 'groupName',
    type: 'text',
    label: 'Group Name',
  },
  {
    key: 'divisionName',
    type: 'text',
    label: 'Division Name',
  },
  {
    key: 'ouName',
    type: 'text',
    label: 'OU Name',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

const NOT_PRIMARY_CONTACT: string = '1';
const name_regex = /\b([A-ZÀ-ÿ][-,. ']*)+/i;
// email regex taken from https://emailregex.com/index.html
const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


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
  fltr_NIST_Org!: Observable<SDSuggestion[]>;


  // ================================  
  /** 
   * Organizations hieararchy:
   * based on  orG_LVL_ID number
   * level 3 = group
   * level 2 = division
   * level 1 = lab
   * occasionally theyre are leves less than 3 such as orG_LVL_ID = 5 being NIST Headquarters
   * those are top level orgs so they are level 1
   */
  // ================================  
  orgGroupOrgID!:number;
  orgGroupNumber!:string;
  orgGroupName!:string;
  orgGroupAcronym!:string;

  orgDivisionOrgID!:number;
  orgDivisionNumber!:string;
  orgDivisionName!:string;
  orgDivisionAcronym!:string;

  orgOuOrgID!:number;
  orgOuNumber!:string;
  orgOuName!:string;
  orgOuAcronym!:string;

  disableAdd:boolean = true;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  contrib_dispCols: string[] = CONTRIB_COL_SCHEMA.map((col) => col.key);
  contrib_colSchema: any = CONTRIB_COL_SCHEMA;
  dmpContributors: DataContributor[] = []
  
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

  extContribRole: string = "";

  primaryContact: string = "";
  primaryContactSelection: string = "";
  primaryContactOptions: Array<primaryContactValues> = [{id:0, value:'Yes'}, {id:1, value:'No'}]
  
  contributorRoles = ROLES; // sets hardcoded roles values
  
  // fltr_NIST_Contributor!: Observable<NistContact[]>;
  fltr_NIST_Contributor!: Observable<SDSuggestion[]>;

  // Default values of external contributor
  externalContributor: Contributor={
    
    firstName:"", lastName:"", orcid:"", emailAddress:"", 
    groupOrgID:0, groupNumber:"", groupName:"",
    divisionOrgID:0, divisionNumber:"", divisionName:"",
    ouOrgID:0, ouNumber:"", ouName:"",
    
    primary_contact:"",
    role:"",
    institution:""
  };

  contribOrcidWarn: string = ""; //contributor orcid warning message
  errorMessage: string = ""; // contributor error message
  static ORCID_ERROR = "Ivalid ORCID format. The correct ORCID format is of the form xxxx-xxxx-xxxx-xxxx where first three groups are numeric and final fourth group is numeric with optional letter 'X' at the end";
  static ORCID_WARNING = "Warning: Missing contributor ORCID information. While this is not a mandatory field for a DMP it will be required if this DMP results in a publication.";
  
  // =====================
  //  for people service
  // =====================

  minPromptLength = 2;                  // don't do any searching of people service unless we have 2 chars
  // for people search
  sd_index: SDSIndex|null = null;       // the index we will download after the first minPromptLength (2) characters are typed
  suggestions: SDSuggestion[] = []      // the current list of suggested completions matching what has been typed so far.

  //for organizations search
  org_index: SDSIndex|null = null;      // the index we will download after the first minPromptLength (2) characters are typed
  orgSuggestions: SDSuggestion[] = []   // the current list of suggested completions matching what has been typed so far.
  
  constructor(
    private dropDownService: DropDownSelectService,
    private fb: UntypedFormBuilder,
    private sdsvc: StaffDirectoryService
  ) {
    // console.log("Personel Component");
    this.getNistContactsFromAPI();    
    this.getNistOrganizations();
  }

  personelForm = this.fb.group(
    {
      dmp_contributor:            [''],
      contributors:               [[]],
      nistOrganization:           [],
      organizations:              [[]]
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
        this.dmpOrganizations.push(
          {
            id:index,
            groupName:org.groupName,
            groupNumber: org.groupNumber,
            groupOrgID: org.groupOrgID,
            groupAcronym: org.groupAcronym,
            
            divisionName:org.divisionName,
            divisionNumber: org.divisionNumber,
            divisionOrgID: org.divisionOrgID,
            divisionAcronym: org.divisionAcronym,

            ouName: org.ouName,
            ouNumber: org.ouNumber,
            ouOrgID: org.ouOrgID,
            ouAcronym: org.ouAcronym,            
            
            isEdit:false
          }
        );
        this.org_disableClear=false;
        this.org_disableRemove=false;
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
       
          primary_contact:  aContributor.primary_contact,
          role:             aContributor.role,
          institution:      aContributor.institution
          
        });
        this.disableClear=false;
        this.disableRemove=false;
      }
    )

    this.personelForm.patchValue({
      contributors:               personel.contributors,
      organizations:              personel.organizations
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
            contributors:           formValue.contributors,
            organizations:          formValue.organizations

          }
        )
      )
    )
  );

  ngOnInit(): void {
    // console.log(" PersonelComponent ngOnInit");
  }  

  //List of contributors that will be aded to the DMP
  contributors: Contributor[]=[];

  //List of all nist contacts from NIST directory
  nistContacts: any = null;

  presonID: number = 0;

  getNistContactsFromAPI(){
    // ---------------------------------------------------------------------------------------------
    //                              NIST CONTRIBUTOR
    // ---------------------------------------------------------------------------------------------
    this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
      switchMap(usrInput => {        
        // clear values until the user has picked a selection. 
        // This forces the form to accept only values that were selected from the dropdown menu
        this.crntContribName = '';
        this.crntContribSurname = '';
        this.crntContribEmail = '';
        this.nistContribOrcid = '';

        const val = typeof usrInput === 'string'; //checks the type of input value
        if (!val){ 
          // if value is not string that means the user has picked a selection from dropdown suggestion box
          // so return an empty array to clear the dropdown suggestion box and set form values accordingly

          // returning result made to an async call
          this.presonID = usrInput.id;
          return usrInput.getRecord().pipe(
            map((rec:any) =>{ // typecast return of getRecord as 'any' since we're expecting an object type there
              this.crntContribName = rec.firstName;
              this.crntContribSurname = rec.lastName;
              
              if(rec.orcid){
                //orcid can be null so assign it only if it is not null
                this.nistContribOrcid = rec.orcid; // automatically populate orcid field if it is not null
              }

              if(rec.emailAddress){
                // email can apparently be null - Planchard Joshua is/was an example
                this.crntContribEmail = rec.emailAddress;
              }

              this.crntContribGroupOrgID = rec.groupOrgID;
              this.crntContribGroupNumber = rec.groupNumber;
              this.crntContribGroupName = rec.groupName;

              this.crntContribDivisionOrgID = rec.divisionOrgID;
              this.crntContribDivisionNumber = rec.divisionNumber;
              this.crntContribDivisionName = rec.divisionName;

              this.crntContribOuOrgID = rec.ouOrgID;
              this.crntContribOuNumber = rec.ouNumber;
              this.crntContribOuName = rec.ouName;

              // clear sarch suggestions since the user has selected an option from drop down menu
              this.sd_index = null;
              this.suggestions = [];
              // enable adding of contact to contributors list
              this.disableAdd=false;
              // retuns an empty array to the next function in the pipe -> in this case a map function
              return this.suggestions;
            }),
            catchError( err => {
              console.log('Failed to pull people record'+err)
              return []
            })
          )
        }

        if (usrInput.trim().length >= this.minPromptLength){
          // this is where initial querying of people service occurs if user has typed more than two characters

          if (! this.sd_index) {
              // if initial query was not performed yet, query people service based on first two letters
              // and return array of suggestions that will be passed to the next function in the pipe

              // returning result from an async call
              return this.sdsvc.getPeopleIndexFor(usrInput).pipe(
                map( idx => {
                  this.sd_index = idx;
                  if (this.sd_index != null) {
                      // pull out the matching suggestions
                      this.suggestions = (this.sd_index as SDSIndex).getSuggestions(usrInput);
                  }
                  return this.suggestions;
                }),
                catchError( err => {
                  console.log('Failed to pull people index for "'+usrInput+'"'+err)
                  return [];
                })
                
              )
          }
          
        }
        // pass user input as a string array to the next function in the pipe -> in this case the map function
        return [usrInput];
      }),     
      map (pipedValue => {
          // Data that comes here is piped in from the previous function in the pipeline in this case switchMap function

          const val = typeof pipedValue === 'string'; //checks the type of value passed down by the switchMap function

          if (!val){ 
            // if value is not string that means that one of two thing have happened:
            // 1) we need to display initial drop down suggestions based on initial people query results
            // 2) the user has selected an option from the drop down menu in which case the suggestions array is empty so we return it
            return this.suggestions;
          }
          else if (typeof pipedValue === 'string' && pipedValue.trim().length >= 2 && this.sd_index){
            // we already have a downloaded index; just pull out the matching suggestions
            // and return the array of suggestions for the dropdown menu 
            this.suggestions = (this.sd_index as SDSIndex).getSuggestions(pipedValue);
            return this.suggestions;
          }
          else if (typeof pipedValue === 'string' && pipedValue.trim().length < 2 && this.sd_index){
            // if the input was cleared, clear out our index and suggestions
            this.sd_index = null;
            this.suggestions = [];
            return this.suggestions;
          }

          // if number of characters entered are less than two return an empty array
          return [];
        }
      )
    );

  }


  displaySelectedSDSuggestion(name:SDSuggestion):string{
    var res = name && name.display ? name.display : '';
    return res;

  }

  selectedContributor(name: string): boolean{
    if (!this.contributorOption) { // if no radio button is selected, always return false so nothing is shown  
      return false;  
    }  
    return (this.contributorOption === name); // if current radio button is selected, return true, else return false  

  }  

  private contributorOption: string="false";
  setContributor(e:string):void{
    this.contributorOption = e;
    
    if (e === 'NIST'){
      this.setPrimContact(NOT_PRIMARY_CONTACT);
      // disable add button to make sure that the user has selected a contributor from the drop-down menu
      this.disableAdd=true;
    }
    else{
      // enable add button and perform user input check manually to make sure that all required metadata has been entered
      this.disableAdd=false;
    }

  }  

  private setPrimContact(val:string){
    // If we're selecting a nist contact, set by default that NIST conatct will not be a primary contact
    this.primaryContact = val; // 1 indicates 'No' in the drop down key-value pair for primaryContactOptions
    this.selPrimaryContact(); // trigger dropdown selection so by default dropdown will be set to No value
  }
  
  selContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.nistContribRole, this.contributorRoles)[0].value;

  }

  selExtContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownSelection(this.extContribRole, this.contributorRoles)[0].value;
  }

  selPrimaryContact(){
    // select role for the contributors from a drop down list
    this.primaryContactSelection = this.dropDownService.getDropDownSelection(this.primaryContact, this.primaryContactOptions)[0].value;
  } 
  
  private contributorRadioSel: string="";

  /**
   * Resets form fields for Contributor personnel
   */
  private resetContributorFields(){
    this.setPrimContact(NOT_PRIMARY_CONTACT);
    this.errorMessage = "";

    // Reset NIST employe / associate fields
    this.crntContribName = "";
    this.crntContribSurname = "";  
    this.crntContribOrcid = "";
    this.crntContribEmail = "";

    this.crntContribGroupOrgID = 0;  
    this.crntContribGroupNumber = "";
    this.crntContribGroupName = "";

    this.crntContribDivisionOrgID = 0;  
    this.crntContribDivisionNumber = "";
    this.crntContribDivisionName = "";

    this.crntContribOuOrgID = 0;  
    this.crntContribOuNumber = "";
    this.crntContribOuName = "";

    this.crntContribRole = "";    
    
    this.nistContribOrcid = "";
    this.nistContribRole = "";

    this.extContribRole = "";
    
    this.personelForm.controls['dmp_contributor'].setValue("");

    this.externalContributor = {
      
      firstName:"", lastName:"", orcid:"", emailAddress:"", 
      groupOrgID:0, groupNumber:"", groupName:"",
      divisionOrgID:0, divisionNumber:"", divisionName:"",
      ouOrgID:0, ouNumber:"", ouName:"",
  
      primary_contact:"",
      role:"",
      institution:""
    };
  }

  onContributorChange(value:any){    
    this.contributorRadioSel=value.id;
    this.resetContributorFields();
    this.resetWarningAndErrorMessages();
  }
  
  removeSelectedRows() {

    const result = confirmDialog("Are you sure you want to delete selected contributor(s) for this DMP?");

    if (result) {
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
            
            primary_contact: element.primary_contact,
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
  }

  resetTable(){
    this.personelForm.patchValue({
      contributors:[]
    })
  }

  clearTable(){
    const result = confirmDialog("Are you sure you want to delete all contributors for this DMP?");

    if (result) {
      this.dmpContributors = [];
      this.resetWarningAndErrorMessages();
      this.resetTable();
      // If the table is empty disable clear and remove buttons
      this.disableClear=true;
      this.disableRemove=true;
    }
    
  }

  private isORCID(val:string):boolean{
    const reORCID = /^(\d{4}-){3}\d{3}(\d|X)$/;
    return reORCID.test(val);

  }

  onDoneClick(e:any){
    // Perform input validation here when user is editing an exising external contributor data
    this.contribOrcidWarn = "";
    let externalContrib:externalContributor = {
      firstName:e.firstName,
      lastName:e.lastName,
      orcid:e.orcid,
      institution:e.institution,
      emailAddress:e.emailAddress,
      role:this.crntContribRole
    }

    let isValidExtcontrib = this.validateExternalContributorInput(externalContrib);
    if (isValidExtcontrib){
      // add ORCID field
      this.crntContribOrcid = e.orcid;
    }
    else{
      return;
    }

    this.errorMessage = '';
    this.resetTable();
    // this.contribOrcidWarn = "";
    this.dmpContributors.forEach((contributor)=>{
      if(contributor.id === e.id){
        contributor.isEdit = false;
      }
      
      // if contributor that we're adding/edditing is external by default the divisionOrgID will be 0 and other institutional values need to be empty too
      // so we can use that to make sure that certin fields if manually edited remain empty or within default values
      // for example assigning primary contact as yes to an external contributor should not be allowed

      if(contributor.divisionOrgID === 0){

        contributor.groupOrgID = 0;
        contributor.groupNumber ='';
        contributor.groupName ='';

        contributor.divisionOrgID = 0;
        contributor.divisionNumber ='';
        contributor.divisionName ='';

        contributor.ouOrgID = 0;
        contributor.ouNumber ='';
        contributor.ouName ='';

        // prevent users erroniously assigning primary contact to an external contributor
        contributor.primary_contact = 'No'; 

        // make sure that role is from accepted values          
        let editedRole = [];                    
        editedRole = _.filter(this.contributorRoles,{value:String(contributor.role)}); //search roles on value 
        if (editedRole.length === 0){
          //if search yielded no results set role to an empty string
          contributor.role = '';
        }
      }
      // re populate contributors array
      this.personelForm.value['contributors'].push({
        
        firstName:contributor.firstName, 
        lastName:contributor.lastName,
        orcid: contributor.orcid,
        emailAddress: contributor.emailAddress,

        groupOrgID:contributor.groupOrgID,
        groupNumber:contributor.groupNumber,
        groupName:contributor.groupName,

        divisionOrgID:contributor.divisionOrgID,
        divisionNumber:contributor.divisionNumber,
        divisionName:contributor.divisionName,

        ouOrgID:contributor.ouOrgID,
        ouNumber:contributor.ouNumber,
        ouName:contributor.ouName,
        
        primary_contact: contributor.primary_contact,
        institution: contributor.institution,
        role: contributor.role
      });
    })

    this.disableClear=false;
    this.disableRemove=false;

    // patch value to also indicate that the form has changed and Save button can change color
    this.personelForm.patchValue({
      contributors:this.personelForm.value['contributors']
    })

  }

  addRow(){
    if (this.contributorRadioSel === "contributorExternal"){
      let externalContrib:externalContributor = {
        firstName:this.externalContributor.firstName,
        lastName:this.externalContributor.lastName,
        orcid:this.externalContributor.orcid,
        institution:this.externalContributor.institution,
        emailAddress:this.externalContributor.emailAddress,
        role:this.crntContribRole
      }

      let isValidExtcontrib = this.validateExternalContributorInput(externalContrib);
      if (isValidExtcontrib){
        // add ORCID field
        this.crntContribOrcid = this.externalContributor.orcid;
      }
      else{
        return;
      }
      
    }
    else{
      //we're adding a nist contributor so assign orcid text field
      this.crntContribOrcid = this.nistContribOrcid;
      // check ORCID
      const isORCID = this.isORCID(this.crntContribOrcid);
        
      if (!isORCID && this.crntContribOrcid.length>0){
        this.errorMessage = PersonelComponent.ORCID_ERROR;
        return;
      }
      else if(this.crntContribOrcid.length == 0){
        this.contribOrcidWarn = PersonelComponent.ORCID_WARNING;
      }
    }

    

    // We're using email as an id for a person assuming that each contributor will have unique email address
    var filterOnEmail = this.dmpContributors.filter(      
      (member: any) => member.emailAddress.toLowerCase() === this.crntContribEmail.toLowerCase()
    );

    if(filterOnEmail.length > 0){

      this.errorMessage = "Contributor " + this.crntContribName + " " + this.crntContribSurname + " with e-mail address " + this.crntContribEmail + " is already in the list of contributors";

      this.disableAdd = false;
      this.disableClear = false;
      this.disableRemove = false;
      return;

    }

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

      primary_contact: this.primaryContactSelection,
      institution:"",
      role:this.crntContribRole,
      
      id: Date.now(),
      isEdit: false,
    };
    
    if (this.contributorOption == "NIST"){
      newRow.institution = this.contributorOption;
      // check if the new contributor is a primary contact and if so find their OU
      if (this.primaryContactSelection === 'Yes'){
        
        this.sdsvc.getOrgsFor(this.presonID).subscribe({
          next: (recs:any) =>{
            this.setResponsibleOrgs(recs);            
            // clear sarch suggestions since the user has selected an option from drop down menu
            this.org_index = null;
            this.orgSuggestions = []
            this.org_addRow();
          },
          error: (err: any) => {
            console.log('Failed to pull orgs for index "'+this.presonID+'"'+err)
            
          }
        })
        
      }
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

  private validateExternalContributorInput(extContrib:externalContributor):boolean{
    /**
     * Check first name
     */
    if (extContrib.firstName.match(name_regex)){        
      this.crntContribName = extContrib.firstName;
    }
    else{
      this.errorMessage = "Missing or invalid contributor First Name";
      return false;
    }

    /**
     * Check last name
     */
    if (extContrib.lastName.match(name_regex)){
      this.crntContribSurname = extContrib.lastName;
    }
    else{
      this.errorMessage = "Missing or invalid contributor Last Name";
      return false;
    }

    /**
     * Check institution
     */
    if (!(extContrib.institution.match(name_regex))){
      this.errorMessage = "Missing or invalid contributor Institution / Affiliation";
      return false;
    }

    /**
     * Check e-mail
     */
    if (extContrib.emailAddress.match(email_regex)){
      this.crntContribEmail = extContrib.emailAddress;
    }
    else{
      this.errorMessage = "Missing or invalid contributor e-mail";
      return false;
    }

    // check ORCID
    const isORCID = this.isORCID(extContrib.orcid);
      
    if (!isORCID && extContrib.orcid.length>0){
      this.errorMessage = PersonelComponent.ORCID_ERROR;
      return false;
    }
    else if(extContrib.orcid.length == 0){
      this.contribOrcidWarn = PersonelComponent.ORCID_WARNING;
    }

    return true;

  }

  private resetWarningAndErrorMessages(){
    this.contribOrcidWarn = "";
    this.errorMessage = "";
  }

  private setResponsibleOrgs(orgs:any){
    let index:number =0;
    // loop through the list of parent organizations with first
    // element in the array being the organization that was selected by the user
    while(index < orgs?.length ){
      let anOrganization = orgs[index];
      /**
       * Case 1:
       * User selected a group from dropdown menu
       * In this case orG_LVL_ID = 3
       */
      if (anOrganization.orG_LVL_ID === 3){
        this.orgGroupNumber = anOrganization.orG_CD;
        this.orgGroupOrgID = anOrganization.orG_ID;
        this.orgGroupName = anOrganization.orG_Name;
        this.orgGroupAcronym = anOrganization.orG_ACRNM;

        index++;
        let divisionData = orgs[index];

        this.orgDivisionNumber = divisionData.orG_CD;
        this.orgDivisionOrgID = divisionData.orG_ID;      
        this.orgDivisionName = divisionData.orG_Name;
        this.orgDivisionAcronym = divisionData.orG_ACRNM;

        // find parent of the parent info
        index++;
        let OUData = orgs[index];

        this.orgOuNumber = OUData.orG_CD;
        this.orgOuOrgID = OUData.orG_ID;
        this.orgOuName = OUData.orG_Name;
        this.orgOuAcronym = OUData.orG_ACRNM;
        break;
      } 
      /**
       * Case 2:
       * User selected a division from dropdown menu
       * In this case orG_LVL_ID = 2 or 4
       */               
      else if(
        anOrganization.orG_LVL_ID === 2 ||
        anOrganization.orG_LVL_ID === 4
      ){

        this.orgGroupNumber = "";
        this.orgGroupOrgID = 0;
        this.orgGroupName = "";
        this.orgGroupAcronym = "";

        this.orgDivisionNumber = anOrganization.orG_CD;
        this.orgDivisionOrgID = anOrganization.orG_ID;
        this.orgDivisionName = anOrganization.orG_Name;
        this.orgDivisionAcronym = anOrganization.orG_ACRNM;

        index++;
        let OUData = orgs[index];

        this.orgOuNumber = OUData.orG_CD;
        this.orgOuOrgID = OUData.orG_ID;
        this.orgOuName = OUData.orG_Name;
        this.orgDivisionAcronym = OUData.orG_ACRNM;
        break;
      }
      else{
        /**
         * Case 3:
         * User selected a top level organization from dropdown menu
         * In this case parenT_ORG_CD is null
         */
        this.orgGroupNumber = "";
        this.orgGroupOrgID = 0;
        this.orgGroupName = "";

        this.orgDivisionNumber = "";
        this.orgDivisionOrgID = 0;
        this.orgDivisionName = "";

        this.orgOuNumber = anOrganization.orG_CD;
        this.orgOuOrgID = anOrganization.orG_ID;  
        this.orgOuName = anOrganization.orG_Name;
        break;

      }
    }
  }

  removeRow(id:any) {
    const result = confirmDialog("Are you sure you want to delete selected contributor(s) for this DMP?");

    if (result) {
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
      this.resetWarningAndErrorMessages();

      // patch value to also indicate that the form has changed and Save button can change color
      this.personelForm.patchValue({
        contributors:this.personelForm.value['contributors']
      })
      
    }
  }

  resetPersonnelForm(){
    
    this.nistContribRole = "";
    this.nistContribOrcid = "";
    this.externalContributor.firstName = "";
    this.externalContributor.lastName = "";
    this.externalContributor.orcid = "";
    this.externalContributor.institution = "";
    this.externalContributor.emailAddress = "";
    this.contributorRadioSel = "";
    this.clearTable();
    this.org_clearTable();
  }


   /**
   * This function gets all NIST organizations by querying people service
   * 
   */
   getNistOrganizations(){ 

    this.fltr_NIST_Org = this.personelForm.controls['nistOrganization'].valueChanges.pipe(
      switchMap(usrInput => {
        const val = typeof usrInput === 'string'; //checks the type of input value
        if (!val){
          // if value is not string that means the user has picked a selection from dropdown suggestion box
          /**
           * If it's a group we need to find the lab that groups division belongs to
           * If it's a division then we set group to null
           * If it's a lab then division and group are null
           */
          // Make async call to get parent organizations of the corganization selected by the user
          return this.sdsvc.getParentOrgs(usrInput.id, true).pipe(                
            map((recs:any) =>{              
              this.setResponsibleOrgs(recs);
              this.org_disableAdd = false;
              // clear sarch suggestions since the user has selected an option from drop down menu
              this.org_index = null;
              this.orgSuggestions = []
              return []
            }),
            catchError( err => {
              console.log('Failed to pull orgs for index "'+usrInput.id+'"'+err)
              return [];
            })
          )
        }
        if (usrInput.trim().length >= 2){
          if (! this.org_index) {
            
            return this.sdsvc.getOrgsIndexFor(usrInput).pipe(
              map(pi => {
                // save it to use with subsequent typing
                this.org_index = pi;
                if (this.org_index != null) {
                  // pull out the matching suggestions
                  this.orgSuggestions = (this.org_index as SDSIndex).getSuggestions(usrInput);
                }
                return this.orgSuggestions;
              }),
              catchError( err => {
                console.log('Failed to pull orgs index for "'+usrInput+'": '+err)
                return [];
              })
            );
          }
        }
        // pass user input as a string array to the next function in the pipe -> in this case the map function
        return [usrInput];
      }),
      map(pipedValue => {
        let res:Array<any> = [];
        const val = typeof pipedValue ==='string';

        if (!val){ 
          // if value is not string that means that one of two thing have happened:
          // 1) we need to display initial drop down suggestions based on initial people query results
          // 2) the user has selected an option from the drop down menu in which case the suggestions array is empty so we return it
          return this.orgSuggestions;
        }
        else if (typeof pipedValue === 'string' && pipedValue.trim().length >= 2 && this.org_index){
          // we already have a downloaded index; just pull out the matching suggestions
          // and return the array of suggestions for the dropdown menu 
          this.orgSuggestions = (this.org_index as SDSIndex).getSuggestions(pipedValue);
          return this.orgSuggestions;
        }
        else if (typeof pipedValue === 'string' && pipedValue.trim().length < 2 && this.org_index){
          // if the input was cleared, clear out our index and suggestions
          this.org_index = null;
          this.orgSuggestions = [];
          return this.orgSuggestions;
        }

        // if number of characters entered are less than two return an empty array
        return [];

        
      }),
      catchError( err => {
        console.log('Failed to pull orgs index'+err)
        return [];
      })

    );

  }

  org_removeSelectedRows() {
    const result = confirmDialog("Are you sure you want to delete selected organization(s) for this DMP?");

    if (result) {
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
  }

  org_resetTable(){
    this.personelForm.patchValue({
      organizations:[]
    })
  }

  org_clearTable(){
    const result = confirmDialog("Are you sure you want to delete all organizations for this DMP?");

    if (result) {
      this.dmpOrganizations = []
      this.org_resetTable();
      this.org_disableAdd=true;
      this.org_disableClear=true;
      this.org_disableRemove=true;
    }
  }

  org_addRow(){
    const newRow = {
      id: Date.now(),
      isEdit: false,
      groupName:this.orgGroupName,
      groupNumber: this.orgGroupNumber,
      groupOrgID: this.orgGroupOrgID,
      groupAcronym: this.orgGroupAcronym,
      
      divisionName:this.orgDivisionName,
      divisionNumber: this.orgDivisionNumber,
      divisionOrgID: this.orgDivisionOrgID,
      divisionAcronym: this.orgDivisionAcronym,

      ouName: this.orgOuName,
      ouNumber: this.orgOuNumber,
      ouOrgID: this.orgOuOrgID,
      ouAcronym: this.orgOuAcronym
    };

    // Check if selected organization is already in the table
    // all three values combined are a unique value in a row
    
    const selRow = this.dmpOrganizations.filter(
      (u) => u.groupName === newRow.groupName && u.divisionName === newRow.divisionName && u.ouName === newRow.ouName);
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
            groupName:org.groupName,
            groupNumber: org.groupNumber,
            groupOrgID: org.groupOrgID,
            groupAcronym: org.groupAcronym,
            
            divisionName:org.divisionName,
            divisionNumber: org.divisionNumber,
            divisionOrgID: org.divisionOrgID,
            divisionAcronym: org.divisionAcronym,

            ouName: org.ouName,
            ouNumber: org.ouNumber,
            ouOrgID: org.ouOrgID,
            ouAcronym: org.ouAcronym
          }
        )
      }
    )
  }

  org_removeRow(id:any) {
    const result = confirmDialog("Are you sure you want to delete selected organization(s) for this DMP?");

    if (result) {
      var selRow = this.dmpOrganizations.filter((u) => u.id === id); 

      // update the form metadata
      this.personelForm.value['organizations'].forEach(
        (value:ResponsibleOrganizations, index:number)=>{
          selRow.forEach(
            (org)=>{
              if (
                value.divisionName === org.divisionName &&
                value.groupName === org.groupName &&
                value.ouName === org.ouName
              ){
                //remove selected organization
                this.personelForm.value['organizations'].splice(index,1);
              }
            }
          )
        }
      )

      // remove from the display table
      this.dmpOrganizations = this.dmpOrganizations.filter((u) => u.id !== id);
      this.personelForm.patchValue({
        organizations:              this.personelForm.value['organizations']
      });
    }
    else{
      const temp = 0;
    }
  }

  

}
