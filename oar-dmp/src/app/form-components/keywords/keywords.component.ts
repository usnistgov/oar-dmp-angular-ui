import { Component, Input, Output, ViewChild, ElementRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatChipInputEvent, MatChipInput } from '@angular/material/chips';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
import { ChipsSplitterService } from 'src/app/shared/chips-splitter.service';

@Component({
  selector: 'app-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.scss', '../form-layout.scss', '../form-table.scss'], 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeywordsComponent {  

  keyWordsForm = this.fb.group(
    {
      keywords:[[]]
    }
  );

  reactiveKeywords = signal(['']);
  keywordsInputVal = '';
  // Reference the HTML input element that uses chips matching the #chipInput in the HTML
  @ViewChild('chipInput') chipInputEl!: ElementRef<HTMLInputElement>;

  // This finds the MatChipInput directive inside that same element
  @ViewChild(MatChipInput) chipInputDirective!: MatChipInput;

  constructor(private fb: UntypedFormBuilder, private spChips: ChipsSplitterService) { 
    // console.log("Keywords Component");
  }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(key_words: DMP_Meta){
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and the children aren't instantiated until initialDMP is set
    // (*ngIf="initialDMP" on the parent form).
    
    // set initial value of keywords form to what has been sent from the server
    this.keyWordsForm.patchValue({
      keywords: key_words.keywords

    })

    this.reactiveKeywords = signal(key_words.keywords);
    
  }

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.keyWordsForm);

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    // There are a few important things to note here: form.valueChanges will only emit when 
    // the form value changes but not initially. That's why we use startWith to provide the 
    // initial value. And we use defer() to use the latest form value for startWith() 
    // whenever someone subscribes.
    this.keyWordsForm.valueChanges.pipe(
      startWith(this.keyWordsForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({           
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to our part of the form 
          keywords: formValue.keywords
        })
      )

    )
  );

  errorMessage: string = '';
  
  clearKeywordsTable(){
    this.resetKeyWordsForm();
  }

  resetKeyWordsForm(){
    // reset the keywords array
    this.keyWordsForm.setValue(
      {
        keywords:[]
      }
    )

  }

  removeReactiveKeyword(keyword: string) {
    this.reactiveKeywords.update(keywords => {
      const index = keywords.indexOf(keyword);
      if (index < 0) {
        return keywords;
      }

      keywords.splice(index, 1);

      // Keep the form control in sync as a plain string[] — the same shape
      // used on load and in addReactiveKeyword. Patch once with the full array
      // rather than resetting and pushing objects.
      this.keyWordsForm.patchValue({
        keywords: [...keywords]
      });

      return [...keywords];
    });
  }

  addReactiveKeyword(event: MatChipInputEvent): void {
    // To clean up chips array and ensure no empty strings or "just whitespace" items make it through, 
    // we should make fall back to an empty array [] and use the JavaScript .filter() method. 
    const chips = (this.spChips.splitChips(event.value.trim()) || [])
                  .filter(chip => chip.trim().length > 0);

    // Add our keyword
    if (chips.length) {
      this.reactiveKeywords.update(keywords => {
        const merged = [...new Set([...keywords, ...chips])];
        this.keyWordsForm.patchValue({ keywords: merged });
        return merged;
      });
    }
    event.chipInput!.clear();
  }

  onBlur(event: FocusEvent) {
    // this is called if user did not hit enter on keyboard to add chips but has rather pressed 
    // elsewhere with a mouse
    
    // Trigger event if input is not empty
    if (this.keywordsInputVal !== ''){
      this.triggerAddChip();
    }
  }

  onInputChange(value: string){
    // console.log('onInputChange', value);
    this.keywordsInputVal = value;

  }

  triggerAddChip() {
    //Construct the mock event
    const mockEvent: MatChipInputEvent = {
      input: this.chipInputEl.nativeElement,
      value: this.keywordsInputVal.trim(),
      chipInput: this.chipInputDirective
    };

    // Manually call your existing add function
    this.addReactiveKeyword(mockEvent);
    // Clear input value
    this.keywordsInputVal = '';
  }

  

}
