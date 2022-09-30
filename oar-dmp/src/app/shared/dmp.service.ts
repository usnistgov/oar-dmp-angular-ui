import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DMP_Meta } from '../types/DMP.types';

@Injectable({
  providedIn: 'root'
})
export class DmpService {

  constructor() { }

  // For demo purposes we just store the DmpRecord here in the service
  // In a real world application you would make a request to the backend
  private DmpRecord: DMP_Meta = {
    title: 'initial val',
    startDate: 'initial val',
    endDate: 'initial val',
    dmpSearchable: 'initial val',
    funding: 'initial val',
    fundingNumber: 'initial val',
    projectDescription: 'initial val',
    issue: 'initial val', 
    issueDescription: 'initial val', 
    report: 'initial val', 
    pii: 'initial val'
  };

  fetchDMP(): Observable<DMP_Meta> {
    return of(this.DmpRecord);
  }

  updateDMP(DmpRecord: DMP_Meta): Observable<DMP_Meta> {
    // The main objective of the spread operator is to spread the elements 
    // of an array or object. This is best explained with examples.
    // function foo(x, y, z) { }
    // var args = [0, 1, 2];
    // foo(...args);
    
    this.DmpRecord = { ...DmpRecord };
    //emits any number of provided values in sequence
    return of(this.DmpRecord);
  }
}
