import { Component, OnInit, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP } from 'src/app/types/DMP.types';

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss']
})
export class BasicInfoComponent implements OnInit {
  // Let's start with a child component that is responsible for a part of the form. 
  // The component injects the FormBuilder and creates a new form group with their form controls, validators and any other configuration
  

  basicInfoForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    dmpSearchable: ['', Validators.required],
    funding: ['', Validators.required],
    fundingNumber: ['', Validators.required],
    projectDescription: ['', Validators.required]

  });

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.basicInfoForm);

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP(basic_info: DMP) {
    this.basicInfoForm.patchValue({
      title: basic_info.title,
      startDate: basic_info.startDate,
      endDate: basic_info.endDate,
      dmpSearchable: basic_info.dmpSearchable,
      funding: basic_info.funding,
      fundingNumber: basic_info.fundingNumber,
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
        (formValue): Partial<DMP> => ({           
          // The observable emits a partial DMP object that only contains the properties related 
          // to our part of the form 
          title: formValue.title,
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          dmpSearchable: formValue.dmpSearchable,
          funding: formValue.funding,
          fundingNumber: formValue.fundingNumber,
          projectDescription:formValue.projectDescription
        })
      )
    )
  );

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
  }

}
