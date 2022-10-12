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
  set initialDMP_Meta(ethical_issues: DMP_Meta) {
    this.ethicalIsuesForm.patchValue({
      ethicalIssue:                ethical_issues.ethicalIssue,
      ethicalIssueDescription:     ethical_issues.ethicalIssueDescription,
      ethicalReport:               ethical_issues.ethicalReport,
      ethicalPII:                  ethical_issues.ethicalPII
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
          ethicalIssue:                formValue.ethicalIssue,
          ethicalIssueDescription:     formValue.ethicalIssueDescription,
          ethicalReport:               formValue.ethicalReport,
          ethicalPII:                  formValue.ethicalPII
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
  }

  selEthicalIssues(name:string): boolean{
    if (!this.selectedEthicalIssue) { // if no radio button is selected, always return false so every nothing is shown  
      return false;  
    }  
    return (this.selectedEthicalIssue === name); // if current radio button is selected, return true, else return false 

  }

  /**
   * This function resets radio buttons to "no" - which is their inital state
   * It also enavles hiding of ethical issues description and report text boxes
   * since default valus are that there are no ethical issues.
   */

  resetRadioButtons (){
    this.selectedEthicalIssue = "no";

  }


}
