import { Component, OnInit, Input, Output  } from '@angular/core';
import { ROLES } from '../../types/mock-roles';
import { Contributor } from 'src/app/types/contributor.type';
import { DmpAPIService } from '../../dmp-api.service';
import { DropDownSelectService } from '../../shared/drop-down-select.service';

import { FormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

interface DataContributor {
  contributor: Contributor,
  id: number;
  isEdit: boolean;
}

@Component({
  selector: 'app-personel',
  templateUrl: './personel.component.html',
  styleUrls: ['./personel.component.scss']
})
export class PersonelComponent implements OnInit {

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

  dmpContributors: DataContributor[] = []
  disableAdd:boolean = false;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(personel: DMP_Meta) {
    // loop over resources array sent from the server and populate local copy of 
    // resources array to populate the table of resources in the user interface
    personel.contributors.forEach(
      (aContributor, index) => {
        this.dmpContributors.push({id:index, isEdit:false, contributor:aContributor});
        this.disableClear=false;
        this.disableRemove=false;
      }
    )

    this.personelForm.patchValue({
      nistContactFirstName:       personel.primary_NIST_contact.firstName,
      nistContactLastName:        personel.primary_NIST_contact.lastName,
      nistReviewerFirstName:      personel.nistReviewer.firstName,
      nistReviewerLastName:       personel.nistReviewer.lastName,
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
            nistReviewer:           {firstName:formValue.nistReviewerFirstName, lastName: formValue.nistReviewerLastName},
            contributors: formValue.dmpContributors
          }
        )
      )
    )
  );

  ngOnInit(): void {
    console.log("ngOnInit");
    this.personelForm.value["nistContactFirstName"] = {}
    // console.log(this.personelForm.controls["nistContactFirstName"].value);
    // console.log(this.personelForm.controls["nistContactLastName"].value);
    // console.log(this.personelForm.controls["nistReviewerFirstName"].value);
    // console.log(this.personelForm.controls["nistReviewerLastName"].value);
    // console.log(this.personelForm.controls["contributors"].value);
    
  }  

  btnAddContrib: boolean=false;
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
        error: (e) => console.error(e),
        // complete: () => console.info('complete') 
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
    
    
    if (!this.contributorOption) { // if no radio button is selected, always return false so every nothing is shown  
      return false;  
    }  
    return (this.contributorOption === name); // if current radio button is selected, return true, else return false  

  }

  nistContributor: string = "";
  crntNistContribName: string = "";
  crntNistContribSurname: string = "";
  crntNistContribEmail: string = "";
  selNistContributor(){
    
    this.crntNistContribName = this.dropDownService.getDropDownText(this.nistContributor, this.nistContacts)[0].firstName;
    this.crntNistContribSurname = this.dropDownService.getDropDownText(this.nistContributor, this.nistContacts)[0].lastName;
    this.crntNistContribEmail = this.dropDownService.getDropDownText(this.nistContributor, this.nistContacts)[0].e_mail;
  }

  private clearContributor():void{
    this.contributorRole ="";
    this.nistContributor = "";
    // this.externalContributor = {firstName:"", lastName:"",instituion:"", e_mail:"", role:""};
  }

  contributorRoles = ROLES;
  contributorRole: string = "";
  crntContribRole:any;
  selContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.dropDownService.getDropDownText(this.contributorRole, this.contributorRoles)[0].value;
  }

  // Default values of external contributor
  // externalContributor: Contributor={firstName:"", lastName:"",instituion:"", e_mail:"", role:""};
  
  addContributor(role:string):void{
    // if (this.contributorRadioSel === "contributorNIST"){
    //   //Add NIST employe / associate contributor
    //   this.contributors.push(
    //     {
    //       firstName: this.crntNistContribName,
    //       lastName: this.crntNistContribSurname,
    //       instituion:"NIST",
    //       e_mail:this.crntNistContribEmail,
    //       role:this.crntContribRole
    //     }
    //   );
    // }
    // else if (this.contributorRadioSel === "contributorExternal"){
    //   // console.log("adding contributorExternal");
    //   this.externalContributor.role=this.crntContribRole
    //   this.contributors.push(this.externalContributor);
    // }
    
    // //Clear previously selected options on radio button click
    // this.clearContributor();

  }

  private contributorRadioSel: string="";
  onContributorChange(value:any){
    // console.log(value.id);
    this.contributorRadioSel=value.id;
    this.btnAddContrib=true;
  }

  dmpReviewer: string="";
  crntReviewerName: string="";
  crntReviewerSurname: string="";
  selDmpReviewer(){
    // select DMP reviewer from a drip down list
    this.crntReviewerName = this.dropDownService.getDropDownText(this.dmpReviewer, this.nistContacts)[0].firstName;
    this.crntReviewerSurname = this.dropDownService.getDropDownText(this.dmpReviewer, this.nistContacts)[0].lastName;
  }



}
