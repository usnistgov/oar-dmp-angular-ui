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
    // loop over paths array sent fromt he server and populat local copy of 
    // paths aray to populate the table of paths in the user interface
  }
  

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
    this.preservationForm.value['pathsURLs'] = []

  }

}
