import { Component, Input, Output, ChangeDetectionStrategy, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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

  reactivePathsURLs = signal<string[]>(['']);
  pathsInputVal = '';
  // Reference the HTML input element that uses chips matching the #pathInput in the HTML
  @ViewChild('pathInput') chipInputEl!: ElementRef<HTMLInputElement>;

  // This finds the MatChipInput directive inside that same element
  @ViewChild(MatChipInput) chipInputDirective!: MatChipInput;

  // pathsURLs is explicitly typed string[] so the typed FormBuilder infers
  // FormControl<string[] | null> rather than FormControl<never[] | null>.
  preservationForm = this.fb.group(
    {
      preservationDescription: [''],
      dataAccess: [''],
      pathsURLs: [[] as string[]]
    }
  );

  constructor(private fb: FormBuilder, private spChips: ChipsSplitterService) { }

  @Input()
  set initialDMP_Meta(data_preservation: DMP_Meta) {
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and the children aren't instantiated until initialDMP is set
    // (*ngIf="initialDMP" on the parent form).

    // set initial values for data preservation part of the form
    // to what has been sent from the server
    this.preservationForm.patchValue(
      {
        preservationDescription:  data_preservation.preservationDescription,
        dataAccess:               data_preservation.dataAccess,
        pathsURLs:                data_preservation.pathsURLs
      }
    );

    // Use .set() rather than reassigning the signal, so existing references
    // (template bindings, computeds) keep pointing at the live signal.
    this.reactivePathsURLs.set(data_preservation.pathsURLs);
  }

  @Output()
  formReady = of(this.preservationForm);

  @Output()
  valueChange = defer(() =>
    this.preservationForm.valueChanges.pipe(
      startWith(this.preservationForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          preservationDescription: formValue.preservationDescription ?? '',
          dataAccess:              formValue.dataAccess ?? '',
          pathsURLs:               formValue.pathsURLs ?? []
        })
      )
    )
  );

  errorMessage: string = '';

  clearTable(){
    this.resetTable();
  }

  resetTable(){
    this.preservationForm.setValue({
      // all of preservationForm needs to be "changed" in order to fire the update event and propagate
      // changes up to the parent form but since we are only trying to update the table
      // don't change preservation description text therefore re-assign it to preservationDescription
      preservationDescription: this.preservationForm.value['preservationDescription'] ?? '',
      dataAccess: this.preservationForm.value['dataAccess'] ?? '',
      // only change table values
      pathsURLs: []
    });
  }

  removeReactivePathsURLs(keyword: string) {
    this.reactivePathsURLs.update(pathsURLs => {
      const index = pathsURLs.indexOf(keyword);
      if (index < 0) {
        return pathsURLs;
      }

      pathsURLs.splice(index, 1);

      // Keep the form control in sync as a plain string[] — the same shape
      // used on load and in addReactivePathsURLs. Patch once with the full array.
      this.preservationForm.patchValue({
        pathsURLs: [...pathsURLs]
      });

      return [...pathsURLs];
    });
  }

  addReactivePathsURLs(event: MatChipInputEvent): void {
    // To clean up chips array and ensure no empty strings or "just whitespace" items make it through,
    // we trim each chip first, then drop any that are empty after trimming.
    const chips = (this.spChips.splitChips(event.value.trim()) || [])
      .map(chip => chip.trim())
      .filter(chip => chip.length > 0);

    // Add our path
    if (chips.length) {
      this.reactivePathsURLs.update(pathsURLs => {
        const merged = [...new Set([...pathsURLs, ...chips])];

        // Patch once with the full deduped string[] — matching the shape used
        // on load and in removeReactivePathsURLs.
        this.preservationForm.patchValue({ pathsURLs: merged });

        return merged;
      });

      event.chipInput!.clear();
    }
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