import { Component, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { defer, map, of, startWith, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-ethical-issues',
  templateUrl: './ethical-issues.component.html',
  styleUrls: ['./ethical-issues.component.scss', '../form-layout.scss']
})
export class EthicalIssuesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  // Let's start with a child component that is responsible for a part of the form.
  // The component injects the FormBuilder and creates a new form group with their
  // form controls, validators and any other configuration
  ethicalIssuesForm = this.fb.group({
    IRBNumber: [''],
    ethicalIssue: ['', Validators.required],
    ethicalIssueDescription: [''],
    ethicalReport: ['']

  });

  // We want to receive the initial data from the parent component and initialize
  // the form values. For that we create an input property with a setter that updates
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(ethicalIssues: DMP_Meta) {
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and the children aren't instantiated until initialDMP is set
    // (*ngIf="initialDMP" on the parent form).
    this.ethicalIssuesForm.patchValue({
      IRBNumber:                ethicalIssues.ethical_issues.irb_number,
      ethicalIssue:             ethicalIssues.ethical_issues.ethical_issues_exist,
      ethicalReport:            ethicalIssues.ethical_issues.ethical_issues_report,
      ethicalIssueDescription:  ethicalIssues.ethical_issues.ethical_issues_description
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
    this.ethicalIssuesForm.valueChanges.pipe(
      startWith(this.ethicalIssuesForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          // The observable emits a partial DMP_Meta object that only contains the properties related
          // to this part of the form
          ethical_issues: {
            irb_number:                     formValue.IRBNumber,
            ethical_issues_exist:           formValue.ethicalIssue,
            ethical_issues_description:     formValue.ethicalIssueDescription,
            ethical_issues_report:          formValue.ethicalReport
          }

        })
      )
    )
  );
  // Because RxJS observables are compatible with Angular EventEmitters we can create an
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.ethicalIssuesForm);


  constructor(private fb: UntypedFormBuilder) {
    // console.log("Ethical Issues Component");
   }

  ngOnInit(): void {
    // Visibility of the description/report boxes is derived directly from the
    // control value (see selEthicalIssues), so there is nothing to snapshot here.
    // When the answer changes to "no", clear the dependent fields.
    this.ethicalIssuesForm.controls['ethicalIssue'].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value === 'no') {
          this.ethicalIssuesForm.patchValue({
            ethicalReport: "",
            ethicalIssueDescription: "",
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Visibility is derived from the control, so it stays correct regardless of
   * how the value changed (user click, patchValue, reset, or input rebind).
   */
  selEthicalIssues(name: string): boolean {
    return this.ethicalIssuesForm.controls['ethicalIssue'].value === name;
  }

}