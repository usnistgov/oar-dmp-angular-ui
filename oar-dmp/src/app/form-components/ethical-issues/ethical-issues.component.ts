import { Component, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, Validators, ControlValueAccessor, NgControl, AbstractControl, FormControl} from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

@Component({
  selector: 'app-ethical-issues',
  templateUrl: './ethical-issues.component.html',
  styleUrls: ['./ethical-issues.component.scss']
})
export class EthicalIssuesComponent {

  // Let's start with a child component that is responsible for a part of the form. 
  // The component injects the FormBuilder and creates a new form group with their 
  // form controls, validators and any other configuration
  ethicalIsuesForm = this.fb.group({
    ethicalIssue: ['', Validators.required],
    ethicalIssueDescription: ['', Validators.required],
    ethicalReport: ['', Validators.required],
    ethicalPII: ['', Validators.required]

  });

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(ethicalIssues: DMP_Meta) {
    this.ethicalIsuesForm.patchValue({
      ethicalIssue:             ethicalIssues.ethical_issues.ethical_issues_exist,
      ethicalReport:            ethicalIssues.ethical_issues.ethical_issues_report,
      ethicalIssueDescription:  ethicalIssues.ethical_issues.ethical_issues_description,
      ethicalPII:               ethicalIssues.ethical_issues.dmp_PII 
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
            dmp_PII:                        formValue.ethicalPII
          }               
          
        })
      )
    )
  );
  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.ethicalIsuesForm);  
  

  constructor(private fb: FormBuilder) {
    
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
    /**
     * TODO:
     * reset text fields for Ethical Issues Description and Ethical issues report
     */
    // if (e === 'no'){
    //   // if there are not ethical issues clear description and report fields
           
    //   this.ethicalIsuesForm.patchValue({
    //     ethical_issues: {
    //       ethical_issues_description:     "",
    //       ethical_issues_report:          "",
    //     }      
    //   });
    // }
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


}
