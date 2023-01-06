import { Component, Input, Output } from '@angular/core';
import { FormBuilder, Validators, ControlValueAccessor, NgControl, AbstractControl, FormControl} from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss']
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

  constructor(private fb: FormBuilder) {}

}
