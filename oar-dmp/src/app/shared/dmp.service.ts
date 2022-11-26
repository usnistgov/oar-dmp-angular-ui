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

    //Keywords
    keyWords:                 ['Keyword', 'Example'],

    //Technical Resources
    dataSize:                 105,
    sizeUnit:                 "GB",
    softwareDevelopment:      {development:"yes", softwareUse:"both", softwareDatabase: "yes", softwareWebsite: "yes"},
    technicalResources:       ['Technical', 'Resources'],
    
    // Ethical Issues Meta data
    ethicalIssue:             'yes', 
    ethicalIssueDescription:  'Ethical Issues Description paragraph example', 
    ethicalReport:            'Ethical Report paragraph example', 
    ethicalPII:               'yes',

    // Data Description Meta data
    dataDescription:          'Data Description Example',
    dataCategories:           ['Working', 'Derived'],

    // Data Preservation Meta data
    preservationDescription:  'Data preservation description example text',
    pathsURLs:                ['link 1', 'lik 2']

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
