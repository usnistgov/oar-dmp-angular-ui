import { Component, Input, Output } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
import { ORGANIZATIONS } from '../../types/mock-organizations';
import { NistOrganization } from 'src/app/types/nist-organization';
import {Observable} from 'rxjs';

export interface dmpOgranizations {
  org_id:number;
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
    key: 'org_id',
    type: 'text',
    label: 'org ID',
  },
  {
    key: 'dmp_organization',
    type: 'text',
    label: 'Organization(s)',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss', '../form-table.scss']
})
export class BasicInfoComponent{
  // ================================
  // used for organizations table
  // ================================
  disableAdd:boolean = true;
  disableClear:boolean = true;
  disableRemove:boolean = true;
  errorMessage: string = '';
  dmpOrganizations: dmpOgranizations[] = []
  displayedColumns: string[] = ORG_COL_SCHEMA.map((col) => col.key);
  columnsSchema: any = ORG_COL_SCHEMA;
  fltr_NIST_Org!: Observable<NistOrganization[]>;
  //List of all nist organizations from NIST directory
  nistOrganizations: any = null;
  crntOrgID:number = 0;
  crntOrgName:string = "";
  
  // ================================

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
    projectDescription: ['', Validators.required],
    nistOrganization: [],
    nistOrganizations: [[]]

  });

  // @Input() abstractcontrol!: AbstractControl;
  // ngControl!: NgControl;

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(basic_info: DMP_Meta) {
    // loop over organizations array sent fromt he server and populate local copy of 
    // organizations aray to populate the table of organizations in the GUI interface
    basic_info.organizations.forEach( 
      (org, index) => {        
        this.dmpOrganizations.push({id:index, org_id:org.ORG_ID, dmp_organization:org.name, isEdit:false});
        this.disableClear=false;
        this.disableRemove=false;
      }
      
    );
    this.basicInfoForm.patchValue({
      title: basic_info.title,
      startDate: basic_info.startDate,
      endDate: basic_info.endDate,
      dmpSearchable: basic_info.dmpSearchable,
      grant_source: basic_info.funding.grant_source,
      grant_id: basic_info.funding.grant_id,
      projectDescription: basic_info.projectDescription,
      organizations:basic_info.organizations
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
          projectDescription:formValue.projectDescription,
          organizations:formValue.nistOrganizations
        })
      )
    )
  );

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.basicInfoForm);

  constructor(private fb: FormBuilder) {
    console.log("basic-info component");
  }

  ngOnInit(): void {
    /**
     * NOTE Comment below when woking with API
     */
    this.getNistOrganizations();

  }

  /**
   * This function gets hard coded NIST organizations
   * Used when not working with an API for NIST people service database
   */
  getNistOrganizations(){    
    // this.getNistOrganizationsFromAPI();
    this.getNistOrganizationsNoAPI();

  }

  getNistOrganizationsNoAPI(){
    //ORGANIZATIONS is declared in '../../types/mock-organizations'
    this.nistOrganizations = ORGANIZATIONS;
    this.fltr_NIST_Org = this.basicInfoForm.controls['nistOrganization'].valueChanges.pipe(
      startWith(''),
      map(anOrganization => {
        const orgName = typeof anOrganization ==='string' ? anOrganization : anOrganization?.name
        var res = orgName ? this._filter(orgName as string):this.nistOrganizations.slice();
        if (res.length ===1){
          this.crntOrgID = anOrganization.ORG_ID;
          this.crntOrgName = anOrganization.name;

          this.disableAdd = false;
        }
        else{
          this.disableAdd = true;
        }
        return res;
      }

      )

    );

  }

  displaySelectedOrganization(org:NistOrganization):string{
    var res = org && org.ORG_ID? org.name : '';
    return res;

  }

  removeSelectedRows() {
    console.log('remove selected orgs');
  }

  resetTable(){
    this.basicInfoForm.patchValue({
      nistOrganizations:[]
    })
  }

  clearTable(){
    this.dmpOrganizations = []
    this.resetTable();
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;
  }

  addRow(){
    const newRow = {
      id: Date.now(),      
      org_id:this.crntOrgID,
      dmp_organization: this.crntOrgName,
      isEdit: false,
    };
    this.dmpOrganizations = [newRow, ...this.dmpOrganizations]
  }

  removeRow(id:any) {
    var selRow = this.dmpOrganizations.filter((u) => u.id === id); 
    this.basicInfoForm.value['nistOrganizations'].forEach(
      (value:NistOrganization, index:number)=>{
        selRow.forEach(
          (org)=>{
            if (value.ORG_ID === org.org_id){
              //remove selected organization
              this.basicInfoForm.value['nistOrganizations'].splice(index,1);
            }
          }
        )
      }
    )

    // remove from the display table
    this.dmpOrganizations = this.dmpOrganizations.filter((u) => u.id !== id);
  }

  private _filter(nistOrg:string): NistOrganization[] {
    const filterValues = nistOrg.toLowerCase()
    var searchRes;
    searchRes = this.nistOrganizations.filter(
      (option:any) => option.name.toLowerCase().includes(filterValues)
    );

    return searchRes;

  }

}
