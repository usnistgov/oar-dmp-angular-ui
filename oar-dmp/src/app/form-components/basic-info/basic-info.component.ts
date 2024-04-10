import { Component, Input, Output } from '@angular/core';
import { UntypedFormBuilder, Validators} from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';

import {Observable} from 'rxjs';

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss', '../form-layout.scss', '../form-table.scss']
})
export class BasicInfoComponent{
  

  // Let's start with a child component that is responsible for a part of the form. 
  // The component injects the FormBuilder and creates a new form group with their 
  // form controls, validators and any other configuration  

  basicInfoForm = this.fb.group({
    title: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    dmpSearchable: ['', Validators.required],
    grant_source: ['', Validators.required],
    grant_id: ['', Validators.required],
    projectDescription: ['', Validators.required]

  });

  // @Input() abstractcontrol!: AbstractControl;
  // ngControl!: NgControl;

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(basic_info: DMP_Meta) {
    this.basicInfoForm.patchValue({
      title: basic_info.title,
      startDate: basic_info.startDate,
      endDate: basic_info.endDate,
      dmpSearchable: basic_info.dmpSearchable,
      grant_source: basic_info.funding.grant_source,
      grant_id: basic_info.funding.grant_id,
      projectDescription: basic_info.projectDescription
    });
  }

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    // There are a few important things to note here: form.valueChanges will only emit when 
    // the form value changes but not initially. That's why we use startWith to provide the 
    // initial value. And we use defer() to use the latest form value for startWith() 
    // whenever someone subscribes.
    this.basicInfoForm.valueChanges.pipe(
      startWith(this.basicInfoForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({           
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to our part of the form 
          title: formValue.title,
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          dmpSearchable: formValue.dmpSearchable,
          funding: {grant_source:formValue.grant_source, grant_id:formValue.grant_id},
          projectDescription:formValue.projectDescription
        })
      )
    )
  );

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.basicInfoForm);

  constructor(private fb: UntypedFormBuilder) {
    
  }

  ngOnInit(): void {
    // /**
    //  * NOTE Comment below when woking with API
    //  */
    // this.getNistOrganizations();

  }

  // /**
  //  * This function gets hard coded NIST organizations
  //  * Used when not working with an API for NIST people service database
  //  */
  // getNistOrganizations(){    
  //   // this.getNistOrganizationsFromAPI();
  //   this.getNistOrganizationsNoAPI();

  // }

  // getNistOrganizationsNoAPI(){
  //   //ORGANIZATIONS is declared in '../../types/mock-organizations'
  //   this.nistOrganizations = ORGANIZATIONS;
  //   this.fltr_NIST_Org = this.basicInfoForm.controls['nistOrganization'].valueChanges.pipe(
  //     startWith(''),
  //     map(anOrganization => {
  //       const orgName = typeof anOrganization ==='string' ? anOrganization : anOrganization?.name
  //       var res = orgName ? this._filter(orgName as string):this.nistOrganizations.slice();
  //       if (res.length ===1){
  //         this.crntOrgID = anOrganization.ORG_ID;
  //         this.crntOrgName = anOrganization.name;

  //         this.disableAdd = false;
  //       }
  //       else{
  //         this.disableAdd = true;
  //       }
  //       return res;
  //     }

  //     )

  //   );

  // }

  // displaySelectedOrganization(org:NistOrganization):string{
  //   var res = org && org.ORG_ID? org.name : '';
  //   return res;

  // }

  // removeSelectedRows() {
  //   //assign unselected rows to dmpOrganizations
  //   this.dmpOrganizations = this.dmpOrganizations.filter((u: any) => !u.isSelected);
  //   //reset the table 
  //   this.resetTable();
  //   //repopulate the table with what's left in the array
  //   this.rePopulateOrgs();

  //   if (this.dmpOrganizations.length === 0){
  //     // If the table is empty disable clear and remove buttons
  //     this.disableClear=true;
  //     this.disableRemove=true;
  //   }
  // }

  // resetTable(){
  //   this.basicInfoForm.patchValue({
  //     organizations:[]
  //   })
  // }

  // clearTable(){
  //   this.dmpOrganizations = []
  //   this.resetTable();
  //   this.disableAdd=true;
  //   this.disableClear=true;
  //   this.disableRemove=true;
  // }

  // addRow(){
  //   const newRow = {
  //     id: Date.now(),      
  //     org_id:this.crntOrgID,
  //     dmp_organization: this.crntOrgName,
  //     isEdit: false,
  //   };
  //   // check that if any org id or org name is undefined 
  //   // - this can happen if user types in the search box but does not select 
  //   //    an actual organization from the drop down menu

  //   if (typeof newRow.org_id === "undefined" || typeof newRow.dmp_organization === "undefined"){
  //     this.errorMessage = "Select an existing NIST Organization";
  //     return;

  //   }

  //   // Check if selected organization is already in the table
  //   var selRow = this.dmpOrganizations.filter((u) => u.org_id === newRow.org_id);
  //   if (selRow.length > 0){
  //     this.errorMessage = "The selected Organization is already associated with this DMP.";
  //     return;
  //   }
  //   //add new row to the dmpOrganizations array
  //   this.dmpOrganizations = [newRow, ...this.dmpOrganizations]

  //   //reset the table
  //   this.resetTable();

  //   // re-populate the table with entries from dmpOrganizations array 
  //   // and update the form metadata
  //   this.rePopulateOrgs();

  //   this.disableAdd=true;
  //   this.disableClear=false;
  //   this.disableRemove=false;
  // }

  // private rePopulateOrgs(){
  //   this.dmpOrganizations.forEach(
  //     (org)=>{
  //       this.basicInfoForm.value['organizations'].push(
  //         {
  //           ORG_ID:org.org_id,
  //           name:org.dmp_organization
  //         }
  //       )
  //     }
  //   )
  // }

  // removeRow(id:any) {
  //   var selRow = this.dmpOrganizations.filter((u) => u.id === id); 

  //   // update the form metadata
  //   this.basicInfoForm.value['organizations'].forEach(
  //     (value:NistOrganization, index:number)=>{
  //       selRow.forEach(
  //         (org)=>{
  //           if (value.ORG_ID === org.org_id){
  //             //remove selected organization
  //             this.basicInfoForm.value['organizations'].splice(index,1);
  //           }
  //         }
  //       )
  //     }
  //   )

  //   // remove from the display table
  //   this.dmpOrganizations = this.dmpOrganizations.filter((u) => u.id !== id);
  // }

  // private _filter(nistOrg:string): NistOrganization[] {
  //   // add button should be disabled while filtering is being performed
  //   // and should be enabled only when an existing organization has been selected
  //   this.disableAdd = true;

  //   const filterValues = nistOrg.toLowerCase()
  //   var searchRes;
  //   searchRes = this.nistOrganizations.filter(
  //     (option:any) => option.name.toLowerCase().includes(filterValues)
  //   );

  //   return searchRes;

  // }

}
