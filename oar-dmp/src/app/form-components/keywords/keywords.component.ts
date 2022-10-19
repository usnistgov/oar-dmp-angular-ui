import { Component, OnInit, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

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
  styleUrls: ['./keywords.component.scss']
})
export class KeywordsComponent {

  disableAdd:boolean = false;
  disableClear:boolean = true;
  disableRemove:boolean = true;
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  keyWordSource: KeyWord[] = [];

  keyWordsForm = this.fb.group(
    {
      keyWords:[[]]
    }
  );

  constructor(private fb: FormBuilder) { 
    
  }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(key_words: DMP_Meta){
    // loop over keywords array sent fromt he server and populat local copy of 
    // keywords aray to populate the table of keywords in the user interface
    key_words.keyWords.forEach( 
      (word, index) => {        
        this.keyWordSource.push({id:index, key_word:word, isEdit:false});
        this.disableClear=false;
        this.disableRemove=false;
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

  
  addRow() {
    // Disable buttons while the user is inputing new row
    this.disableAdd=true;
    this.disableClear=true;
    this.disableRemove=true;
    
    const newRow = {
      id: Date.now(),
      key_word: '',
      isEdit: true,
    };
    // create a new array using an existing array as one part of it 
    // using the spread operator '...'
    this.keyWordSource = [newRow, ...this.keyWordSource];

  }

  errorMessage: string = '';
  onDoneClick(e:any){
    if (!e.key_word.length) {
      this.errorMessage = "Keywords / Phrases can't be empty";
      return;
    }

    this.errorMessage = '';
    this.resetKeyWordsForm();
    this.keyWordSource.forEach((element)=>{
        if(element.id === e.id){
          element.isEdit = false;
        }
        // re populate keywords array
        this.keyWordsForm.value['keyWords'].push(element.key_word);
      }
    )
    // Enable buttons once user entered new data into a row
    this.disableAdd=false;
    this.disableClear=false;
    this.disableRemove=false;

  }

  removeRow(id:any) {
    // select word from the specific id
    var selWord = this.keyWordSource.filter((u) => u.id === id);    
    this.keyWordsForm.value['keyWords'].forEach((value:string,index:number) =>{
      selWord.forEach((word)=>{
        if(value === word.key_word){
          this.keyWordsForm.value['keyWords'].splice(index,1);
        }
      });
    });

    this.keyWordSource = this.keyWordSource.filter((u) => u.id !== id);
  }
  removeSelectedRows() {
    this.keyWordSource = this.keyWordSource.filter((u: any) => !u.isSelected);
    this.resetKeyWordsForm();
    this.keyWordSource.forEach((element)=>{
        // re populate keywords array
        this.keyWordsForm.value['keyWords'].push(element.key_word);
    });
    if (this.keyWordSource.length === 0){
      // If the table is empty disable clear and remove buttons
      this.disableClear=true;
      this.disableRemove=true;
    }
  }
  clearKeywordsTable(){
    this.keyWordSource = [];
    this.resetKeyWordsForm();
     // If the table is empty disable clear and remove buttons
    this.disableClear=true;
    this.disableRemove=true;

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
