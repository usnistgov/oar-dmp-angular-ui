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
    //Basic Info Meta data
    title:                    'Example Title',
    startDate:                '2022-09-28',
    endDate:                  '2023-09-28',
    dmpSearchable:            'yes',
    funding:                  'Grant Number',
    fundingNumber:            '12345',
    projectDescription:       'Example Project Description',
    
    // Ethical issues Meta data
    ethicalIssue:             'yes', 
    ethicalIssueDescription:  'When it comes to healthcare, ethical issues are a field of applied ethics concerned with the moral decision-making medical staff must apply when making decisions. Moral and ethical views in medicine tend to vary based on the country and culture.', 
    ethicalReport:            'Healthcare practitioners must collaborate with patients to understand and balance their needs and desires. For example, would it be ethical to provide a blood transfusion to a Jehovah’s Witness even if it would save their life?', 
    ethicalPII:               'yes'
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
