import { Component, Input, Output, ViewChild, ElementRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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

  // The keywords control is explicitly typed string[] so the typed FormBuilder
  // infers FormControl<string[] | null> rather than FormControl<never[] | null>,
  // which would reject patchValue({ keywords: string[] }).
  keyWordsForm = this.fb.group({
    keywords: [[] as string[]]
  });

  reactiveKeywords = signal<string[]>(['']);
  keywordsInputVal = '';
  // Reference the HTML input element that uses chips matching the #chipInput in the HTML
  @ViewChild('chipInput') chipInputEl!: ElementRef<HTMLInputElement>;

  // This finds the MatChipInput directive inside that same element
  @ViewChild(MatChipInput) chipInputDirective!: MatChipInput;

  constructor(private fb: FormBuilder, private spChips: ChipsSplitterService) { }

  @Input()
  set initialDMP_Meta(key_words: DMP_Meta){
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and the children aren't instantiated until initialDMP is set
    // (*ngIf="initialDMP" on the parent form).
    this.keyWordsForm.patchValue({
      keywords: key_words.keywords
    });

    // Use .set() rather than reassigning the signal, so existing references
    // (template bindings, computeds) keep pointing at the live signal.
    this.reactiveKeywords.set(key_words.keywords);
  }

  @Output()
  formReady = of(this.keyWordsForm);

  @Output()
  valueChange = defer(() =>
    this.keyWordsForm.valueChanges.pipe(
      startWith(this.keyWordsForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          keywords: formValue.keywords ?? []
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
    this.keyWordsForm.setValue({
      keywords: []
    });
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
    // we trim each chip first, then drop any that are empty after trimming.
    const chips = (this.spChips.splitChips(event.value.trim()) || [])
      .map(chip => chip.trim())
      .filter(chip => chip.length > 0);

    // Add our keyword
    if (chips.length) {
      this.reactiveKeywords.update(keywords => {
        const merged = [...new Set([...keywords, ...chips])];
        this.keyWordsForm.patchValue({ keywords: merged });
        return merged;
      });

      event.chipInput!.clear();
    }
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