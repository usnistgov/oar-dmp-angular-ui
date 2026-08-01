import { Component, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
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

  ethicalIssuesForm = this.fb.group({
    IRBNumber: [''],
    ethicalIssue: ['', Validators.required],
    ethicalIssueDescription: [''],
    ethicalReport: ['']
  });

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

  @Output()
  valueChange = defer(() =>
    this.ethicalIssuesForm.valueChanges.pipe(
      startWith(this.ethicalIssuesForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          ethical_issues: {
            irb_number:                 formValue.IRBNumber ?? '',
            ethical_issues_exist:       formValue.ethicalIssue ?? '',
            ethical_issues_description: formValue.ethicalIssueDescription ?? '',
            ethical_issues_report:      formValue.ethicalReport ?? ''
          }
        })
      )
    )
  );

  @Output()
  formReady = of(this.ethicalIssuesForm);

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
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