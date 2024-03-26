import { Component, Input, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
import { TextSplitterService } from '../../shared/text-splitter.service';

@Component({
  selector: 'app-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.scss', '../form-table.scss']
})
export class KeywordsComponent {

  separatorExp: RegExp = /,|;/;

  keyWordsForm = this.fb.group(
    {
      keyWords:[[]]
    }
  );

  constructor(private fb: UntypedFormBuilder, 
              private textSplitter: TextSplitterService) { 
    
  }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(key_words: DMP_Meta){
    // set initial value of keywords form to what has been sent from the server
    this.keyWordsForm.patchValue({
      keyWords: key_words.keyWords

    })

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
          keyWords: formValue.keyWords
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
        keyWords:[]
      }
    )

  }

  

}
