import { Component, Input, Output, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators, ControlValueAccessor, NgControl, AbstractControl, FormControl} from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-ethical-issues',
  templateUrl: './ethical-issues.component.html',
  styleUrls: ['./ethical-issues.component.scss', '../form-layout.scss']
})
export class EthicalIssuesComponent {

  dataSensitivityMap = new Map([
    ['Low', false],
    ['Medium', false],
    ['High', false]
  ]);

  cuiMap = new Map([
    ['BII', false],
    ['PII', false],
    ['Export Controlled (EAR)', false],
    ['ITAR', false],
    ['Proprietary', false]
  ]);

  showCUI_chk: boolean = false;

  // Let's start with a child component that is responsible for a part of the form. 
  // The component injects the FormBuilder and creates a new form group with their 
  // form controls, validators and any other configuration
  ethicalIsuesForm = this.fb.group({
    ethicalIssue: ['', Validators.required],
    ethicalIssueDescription: [''],
    ethicalReport: [''],
    dataSensitivity: [[]],
    dataCUI:[[]]
    // ethicalPII: ['', Validators.required]

  });

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(ethicalIssues: DMP_Meta) {
    if(ethicalIssues.ethical_issues.data_sensitivity !== undefined){
      ethicalIssues.ethical_issues.data_sensitivity.forEach (
        (value)=>{
          // populate map for displaying check marks on the GUI form
          this.dataSensitivityMap.set(value,true)

          this.showCUI();
        }
      );
    }
    else{
      // initialize arrays if they don't exist in od DMP records
      ethicalIssues.ethical_issues.data_sensitivity = [];
    }

    if(ethicalIssues.ethical_issues.cui !== undefined){
      ethicalIssues.ethical_issues.cui.forEach (
        (value)=>{
          // populate map for displaying check marks on the GUI form
          this.cuiMap.set(value,true)
        }
      );
    }
    else{
      // initialize arrays if they don't exist in od DMP records
      ethicalIssues.ethical_issues.cui = [];
    }

    this.ethicalIsuesForm.patchValue({
      ethicalIssue:             ethicalIssues.ethical_issues.ethical_issues_exist,
      ethicalReport:            ethicalIssues.ethical_issues.ethical_issues_report,
      ethicalIssueDescription:  ethicalIssues.ethical_issues.ethical_issues_description,      
      // ethicalPII:               ethicalIssues.ethical_issues.dmp_PII 
      dataSensitivity:          ethicalIssues.ethical_issues.data_sensitivity,
      dataCUI:                  ethicalIssues.ethical_issues.cui
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
    this.ethicalIsuesForm.valueChanges.pipe(
      startWith(this.ethicalIsuesForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({           
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to this part of the form 
          ethical_issues: {
            ethical_issues_exist:           formValue.ethicalIssue,
            ethical_issues_description:     formValue.ethicalIssueDescription,
            ethical_issues_report:          formValue.ethicalReport,
            // dmp_PII:                        formValue.ethicalPII
            data_sensitivity:               formValue.dataSensitivity,
            cui:                            formValue.dataCUI
          }               
          
        })
      )
    )
  );
  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.ethicalIsuesForm);  
  

  constructor(private fb: UntypedFormBuilder) {
    
   }

  private selectedEthicalIssue: string="no"; 

  ngOnInit(): void {
    // sets this value after initial data from the parent has been passed in and allows for
    // <div *ngIf="selEthicalIssues('yes')"> in ethica-issues.component.html to display text
    // boxes if there are existing ethical issues
    this.selectedEthicalIssue = this.ethicalIsuesForm.controls['ethicalIssue'].value;
  }

  setEthicalIssues(e: string): void {
    this.selectedEthicalIssue = e; 
    if (e === 'no'){
      // if there are not ethical issues clear description and report fields
           
      this.ethicalIsuesForm.patchValue({        
        ethicalReport:            "",
        ethicalIssueDescription:  "",
      });
    }
    // console.log(this.selectedEthicalIssue);
  }

  selEthicalIssues(name:string): boolean{
    if (!this.selectedEthicalIssue) { // if no radio button is selected, always return false so every nothing is shown  
      return false;  
    }  
    return (this.selectedEthicalIssue === name); // if current radio button is selected, return true, else return false 

  }

  /**
   * This function resets radio buttons to "no" - which is their initial state
   * It also enables hiding of ethical issues description and report text boxes
   * since default values are that there are no ethical issues.
   */

  resetRadioButtons (){
    this.selectedEthicalIssue = "no";

  }

  dataSensitivityChange(e:any){
    this.dataSensitivityMap.set(e.target.defaultValue,e.target.checked)

    this.showCUI();

    // pass by reference
    let data_sensitivity = this.ethicalIsuesForm.value['dataSensitivity'] as string[];

    if (e.target.checked){      
      data_sensitivity.push(e.target.defaultValue);
    }
    else{
      data_sensitivity.forEach((value,index)=>{
        if(value === e.target.defaultValue) 
          data_sensitivity.splice(index,1)
        });
    }
  }

  cuiChange(e:any){
    this.cuiMap.set(e.target.defaultValue,e.target.checked)

    // pass by reference
    let CUI = this.ethicalIsuesForm.value['dataCUI'] as string[];

    if (e.target.checked){      
      CUI.push(e.target.defaultValue);
    }
    else{
      CUI.forEach((value,index)=>{
        if(value === e.target.defaultValue) 
          CUI.splice(index,1)
        });
    }
  }

  private showCUI(){
    // set flag whether to show CUI check marks on the GUI form
    if (this.dataSensitivityMap.get('Medium') || this.dataSensitivityMap.get('High')){
      this.showCUI_chk = true;
    }
    else{
      this.showCUI_chk = false;
    }
  }


}
