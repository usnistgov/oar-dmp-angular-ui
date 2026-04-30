import { Component, Input, Output, ChangeDetectionStrategy, signal, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';

import { MatChipInputEvent, MatChipInput } from '@angular/material/chips';
import { ChipsSplitterService } from 'src/app/shared/chips-splitter.service';


import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-data-preservation',
  templateUrl: './data-preservation.component.html',
  styleUrls: ['./data-preservation.component.scss', '../form-layout.scss', '../form-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataPreservationComponent {
  separatorExp: RegExp = /,|;/;

  reactivePathsURLs = signal(['']);
  pathsInputVal = '';
  // Reference the HTML input element that uses chips matching the #pathInput in the HTML
  @ViewChild('pathInput') chipInputEl!: ElementRef<HTMLInputElement>;

  // This finds the MatChipInput directive inside that same element
  @ViewChild(MatChipInput) chipInputDirective!: MatChipInput;
  
  preservationForm = this.fb.group(
    {
      preservationDescription: [''],
      dataAccess: [''],
      pathsURLs:[[]]
    }
  );

  constructor(private fb: UntypedFormBuilder, private spChips: ChipsSplitterService) { 
    // console.log("Data Preservation Component");
  }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(data_preservation: DMP_Meta) {
    if (Object.keys(data_preservation).length < 1){
      this.preservationForm.patchValue(
        {
          preservationDescription:  '',
          dataAccess:               '',
          pathsURLs:                []

        }
      );
      this.reactivePathsURLs = signal([]);
    }
    else{
      // set initial values for data preservation part of the form
      // to what has been sent from the server
      this.preservationForm.patchValue(
        {
          preservationDescription:  data_preservation.preservationDescription,
          dataAccess:               data_preservation.dataAccess,
          pathsURLs:                data_preservation.pathsURLs

        }
      );

      this.reactivePathsURLs = signal(data_preservation.pathsURLs);

      }
    
    
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

  removeReactivePathsURLs(keyword: string) {
    
    this.reactivePathsURLs.update(pathsURLs => {
      const index = pathsURLs.indexOf(keyword);
      if (index < 0) {
        return pathsURLs;
      }

      pathsURLs.splice(index, 1);

      // reset the pathsURLs array
      this.preservationForm.setValue(
        {
          pathsURLs:[]
        }
      )

      // repopulate the array
      pathsURLs.forEach((element)=>{
        this.preservationForm.value['pathsURLs'].push({pathsURLs:element});
      });
      return [...pathsURLs];
    });

    
  }

  addReactivePathsURLs(event: MatChipInputEvent): void {
    // To clean up chips array and ensure no empty strings or "just whitespace" items make it through, 
    // we should make fall back to an empty array [] and use the JavaScript .filter() method. 
    const chips = (this.spChips.splitChips(event.value.trim()) || [])
                  .filter(chip => chip.trim().length > 0);

    // Add our path
    if (chips) {
      this.reactivePathsURLs.update(pathsURLs => {
        // Combine both arrays into a Set to force uniqueness, 
        // then spread it back into a standard array.
        return [...new Set([...pathsURLs, ...chips])];
      }); 
      chips.forEach((chip)=>{
        this.preservationForm.patchValue({
          pathsURLs: chip
        })
      });
      
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  onBlur(event: FocusEvent) {
    // this is called if user did not hit enter on keyboard to add chips but has rather pressed 
    // elsewhere with a mouse
    
    // Trigger event if input is not empty
    if (this.pathsInputVal !== ''){
      this.triggerAddChip();
    }
  }

  onInputChange(value: string){
    // console.log('onInputChange', value);
    this.pathsInputVal = value;

  }

  triggerAddChip() {
    //Construct the mock event
    const mockEvent: MatChipInputEvent = {
      input: this.chipInputEl.nativeElement,
      value: this.pathsInputVal.trim(),
      chipInput: this.chipInputDirective
    };

    // Manually call your existing add function
    this.addReactivePathsURLs(mockEvent);
    // Clear input value
    this.pathsInputVal = '';
  }

}
