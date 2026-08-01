import { Component, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss', '../form-layout.scss', '../form-table.scss']
})
export class BasicInfoComponent {

  // The typed FormBuilder infers each control's type from its initial value, so
  // basicInfoForm.controls['title'] is FormControl<string | null> — which the
  // [formControl] directive accepts. (Under UntypedFormBuilder these were
  // AbstractControl, which strictTemplates rejects.)
  basicInfoForm = this.fb.group({
    title: ['', Validators.required],
    startDate: ['', Validators.required],
    dmpSearchable: ['', Validators.required],
    grant_source: ['Grant Number', Validators.required],
    grant_id: ['', Validators.required],
    projectDescription: ['', Validators.required]
  });

  @Input()
  set initialDMP_Meta(basic_info: DMP_Meta) {
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and the children aren't instantiated until initialDMP is set
    // (*ngIf="initialDMP" on the parent form). So funding et al. are always present.
    this.basicInfoForm.patchValue(
      {
        title: basic_info.title,
        startDate: basic_info.startDate,
        dmpSearchable: basic_info.dmpSearchable,
        grant_source: basic_info.funding.grant_source,
        grant_id: basic_info.funding.grant_id,
        projectDescription: basic_info.projectDescription
      }
    );
  }

  @Output()
  valueChange = defer(() =>
    this.basicInfoForm.valueChanges.pipe(
      startWith(
        this.basicInfoForm.value
      ),
      map(
        (formValue): Partial<DMP_Meta> => (
          {
            title: formValue.title ?? '',
            startDate: formValue.startDate ?? '',
            dmpSearchable: formValue.dmpSearchable ?? '',
            funding: {
              grant_source: formValue.grant_source ?? '',
              grant_id: formValue.grant_id ?? ''
            },
            projectDescription: formValue.projectDescription ?? ''
          }
        )
      )
    )
  );

  @Output()
  formReady = of(this.basicInfoForm);

  constructor(private fb: FormBuilder) {
    // console.log("Basic Info Component");
  }

}