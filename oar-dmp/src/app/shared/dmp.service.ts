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
    funding:                  {grant_source:'Grant Number', grant_id:'12345'},
    projectDescription:       'Example Project Description',

    //Personel
    primary_NIST_contact:     {firstName:"Niksa", lastName:"Blonder"},
    NIST_DMP_Reviewer:        {firstName:"Ray", lastName:"Plante"},
    contributors:             [{contributor:{
                                  firstName:"Niksa", 
                                  lastName:"Blonder"}, 
                                role:"Contact Person", 
                                instituion:"NIST", 
                                e_mail:"nik@nist.gov"},
                               {contributor:{
                                  firstName:"Joe", 
                                  lastName:"Dalton"}, 
                                role:"Contact Person", 
                                instituion:"IAEA", 
                                e_mail:"joe@iaea.gov"}
                              ],

    //Keywords
    keyWords:                 ['Trace Elements', 'Stable Isotope Ratios'],

    //Technical Resources
    dataSize:                 105,
    sizeUnit:                 "GB",
    softwareDevelopment:      {development:"yes", softwareUse:"both", softwareDatabase: "yes", softwareWebsite: "yes"},
    technicalResources:       ['Mass Spectrometer', 'Microsope'],
    
    // Ethical Issues Meta data
    ethical_issues:           {
                                ethical_issues_exist:         'yes', 
                                ethical_issues_description:   'Ethical Issues Description paragraph example', 
                                ethical_issues_report:        'Ethical Report paragraph example', 
                                dmp_PII:                      'yes'
                              },

    // Data Description Meta data
    dataDescription:          'Data Description Example',
    dataCategories:           ['Working', 'Derived'],

    // Data Preservation Meta data
    preservationDescription:  'Data preservation description example text',
    pathsURLs:                ['https://github.com/exampleuser/example_set', 'https://example.com']

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
