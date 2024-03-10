import { Component, Input, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
import { TextSplitterService } from '../../shared/text-splitter.service';

export interface KeyWord {
  key_word: string;
  id: number;
  isEdit: boolean;
}

const COLUMNS_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  {
    key: 'key_word',
    type: 'text',
    label: 'Keywords / Phrases',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

@Component({
  selector: 'app-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.scss', '../form-table.scss']
})
export class KeywordsComponent {

  disableAdd:boolean = false;  
  keyWordSrc: string[] = [];
  keyWordsText: string = "";
  keyWordsDisplay: string[] | undefined;

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
    this.keyWordsDisplay = [];
    // loop over keywords array sent fromt he server and populat local copy of 
    // keywords aray to populate the table of keywords in the user interface
    key_words.keyWords.forEach( 
      (word) => {        
        this.keyWordSrc.push(word);
        this.keyWordsDisplay?.push(word);
      }
      
    );

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

  parseKeywordsText(){
    this.keyWordsDisplay = [];
    this.disableAdd=true;

    let splitText = this.textSplitter.splitText(this.keyWordsText,",");
    splitText.forEach((kw)=>{
      let keyWord = kw.trim();
      // Make sure keyword is not an empty string
      if (keyWord !==''){        
        // add only if keyword doesn't aleady exist
        if (!this.keyWordSrc.includes(keyWord)){
          // create a new array using an existing array as one part of it 
          // using the spread operator '...'
          this.keyWordSrc = [keyWord, ...this.keyWordSrc];
        }
      }
      
    });
    
    this.resetKeyWordsForm();
    this.keyWordSrc.forEach((element)=>{
        // re populate keywords array
        this.keyWordsDisplay?.push(element);
        this.keyWordsForm.value['keyWords'].push(element);
      }
    );
    this.keyWordsText = "";

    this.disableAdd=false;
  }
  chipRemove(){
    console.log('removed a chip');
  }

}
