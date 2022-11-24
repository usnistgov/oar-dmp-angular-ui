import { Component, Input, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from 'src/app/types/DMP.types';

export interface PreservationLinks {
  path: string;
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
    key: 'path',
    type: 'text',
    label: 'File Path / URL',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

@Component({
  selector: 'app-data-preservation',
  templateUrl: './data-preservation.component.html',
  styleUrls: ['./data-preservation.component.scss', '../keywords/keywords.component.scss']
})
export class DataPreservationComponent {
  disableAdd:boolean = false;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  pathSource: PreservationLinks[] = [];

  preservationForm = this.fb.group(
    {
      preservationDescription: [''],
      pathsURLs:[[]]
    }
  );

  constructor(private fb: FormBuilder) { 
    
  }

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(data_preservation: DMP_Meta) {
    // loop over paths array sent from the server and populate local copy of 
    // paths array to populate the table of paths in the user interface
    data_preservation.pathsURLs.forEach( 
      (initialPath, index) => {  
        this.pathSource.push({id:index, path:initialPath, isEdit:false});
        this.disableClear=false;
        this.disableRemove=false;
      }
    );

    // set initial values for data preservation part of the form
    // to what has been sent from the server
    this.preservationForm.patchValue({
      preservationDescription:  data_preservation.preservationDescription,
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
          pathsURLs:               formValue.pathsURLs
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
      path: '',
      isEdit: true,
    };
    // create a new array using an existing array as one part of it 
    // using the spread operator '...'
    this.pathSource = [newRow, ...this.pathSource];

  }

  errorMessage: string = '';
  onDoneClick(e:any){
    if (!e.path.length) {
      this.errorMessage = "Path / URL can't be empty";
      return;
    }

    this.errorMessage = '';
    this.resetTable();
    this.pathSource.forEach((element)=>{
        if(element.id === e.id){
          element.isEdit = false;
        }
        // re populate paths array
        this.preservationForm.value['pathsURLs'].push(element.path);
      }
    )
    // Enable buttons once user entered new data into a row
    this.disableAdd=false;
    this.disableClear=false;
    this.disableRemove=false;

  }

  removeRow(id:any) {
    // select word from the specific id
    var selWord = this.pathSource.filter((u) => u.id === id);    
    this.preservationForm.value['pathsURLs'].forEach((value:string,index:number) =>{
      selWord.forEach((word)=>{
        if(value === word.path){
          this.preservationForm.value['pathsURLs'].splice(index,1);
        }
      });
    });

    this.pathSource = this.pathSource.filter((u) => u.id !== id);
  }
  removeSelectedRows() {
    this.pathSource = this.pathSource.filter((u: any) => !u.isSelected);
    this.resetTable();
    this.pathSource.forEach((element)=>{
        // re populate paths array
        this.preservationForm.value['pathsURLs'].push(element.path);
    });
    if (this.pathSource.length === 0){
      // If the table is empty disable clear and remove buttons
      this.disableClear=true;
      this.disableRemove=true;
    }
  }
  clearTable(){
    this.pathSource = [];
    this.resetTable();
     // If the table is empty disable clear and remove buttons
    this.disableClear=true;
    this.disableRemove=true;

  }

  resetTable(){
    // this.preservationForm.value['pathsURLs'] = []
    this.preservationForm.setValue({
      // all of preservationForm needs to be "changed" in order to fire the update event and propagate
      // changes up to the parent form but since we are only trying to update the table
      // don't change preservation description text therefore re-assign it to preservationDescription
      preservationDescription: this.preservationForm.value['preservationDescription'],
      // only change table values
      pathsURLs:[]

    })

  }

}
