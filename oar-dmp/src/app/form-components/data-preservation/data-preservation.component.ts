import { Component, Input, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-data-preservation',
  templateUrl: './data-preservation.component.html',
  styleUrls: ['./data-preservation.component.scss', '../form-table.scss']
})
export class DataPreservationComponent {
  separatorExp: RegExp = /,|;/;
  
  preservationForm = this.fb.group(
    {
      preservationDescription: [''],
      dataAccess: [''],
      pathsURLs:[[]]
    }
  );

  constructor(private fb: UntypedFormBuilder) { 

  }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(data_preservation: DMP_Meta) {
    
    // set initial values for data preservation part of the form
    // to what has been sent from the server
    this.preservationForm.patchValue({
      preservationDescription:  data_preservation.preservationDescription,
      dataAccess:               data_preservation.dataAccess,
      pathsURLs:                data_preservation.pathsURLs

    });
  }

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.preservationForm);

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    // There are a few important things to note here: form.valueChanges will only emit when 
    // the form value changes but not initially. That's why we use startWith to provide the 
    // initial value. And we use defer() to use the latest form value for startWith() 
    // whenever someone subscribes.
    this.preservationForm.valueChanges.pipe(
      startWith(this.preservationForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({           
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to our part of the form 
          preservationDescription: formValue.preservationDescription,
          dataAccess:              formValue.dataAccess, 
          pathsURLs:               formValue.pathsURLs
        })
      )

    )
  );
  

  errorMessage: string = '';
  
  clearTable(){
    this.resetTable();
  }

  resetTable(){
    // this.preservationForm.value['pathsURLs'] = []
    this.preservationForm.setValue({
      // all of preservationForm needs to be "changed" in order to fire the update event and propagate
      // changes up to the parent form but since we are only trying to update the table
      // don't change preservation description text therefore re-assign it to preservationDescription
      preservationDescription: this.preservationForm.value['preservationDescription'],
      dataAccess: this.preservationForm.value['dataAccess'],
      // only change table values
      pathsURLs:[]

    })

  }

}
