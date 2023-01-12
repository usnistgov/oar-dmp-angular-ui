import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DMP_Meta } from '../types/DMP.types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MIDASDMP } from '../types/midas-dmp.type';

@Injectable({
  providedIn: 'root'
})
export class DmpService {

  PDR_full = "http://localhost:9091/midas/dmp/mdm1"
  dmpsAPI = "http://127.0.0.1:5000/dmps"  
  /**
   * See these two articles for setting up CORS in Angular
   * https://dev-academy.com/angular-cors/
   * https://www.azilen.com/blog/how-to-resolve-cors-errors-by-using-angular-proxy
   * ng serve -o --proxy-config src/proxy.conf.json
   */
  PDR = "/api/midas/dmp/mdm1"

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient)  { }


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
    // NIST_DMP_Reviewer:        {firstName:"Ray", lastName:"Plante"},
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

  fetchPDR(): Observable<any>{
    // console.log("fetchPDR")
    let getInfo = this.http.get<any>(this.dmpsAPI);
    return getInfo
  }

  postDMP(): Observable<any>{
    console.log("postDMP")
    
    return this.http.post(this.dmpsAPI, JSON.stringify(this.DmpRecord), this.httpOptions)
  }

  fetchDMP(ex:string): Observable<DMP_Meta> {   
    // console.log("fetchDMP") 
    return of(this.DmpRecord);
  }

  updateDMP(dmpMeta: DMP_Meta): Observable<MIDASDMP> {
    // The main objective of the spread operator is to spread the elements 
    // of an array or object. This is best explained with examples.
    // function foo(x, y, z) { }
    // var args = [0, 1, 2];
    // foo(...args);
    // console.log("updateDMP")
    // console.log(dmpMeta)

    let dateTime = new Date().toLocaleString()
    let midasDMP:MIDASDMP = {name:dateTime, data:dmpMeta}
    this.DmpRecord = { ...dmpMeta };
    // let postRes = this.http.post<MIDASDMP>(this.PDR_full, JSON.stringify(midasDMP), this.httpOptions)
    let postRes = this.http.post<MIDASDMP>(this.dmpsAPI, JSON.stringify(midasDMP), this.httpOptions)
    //emits any number of provided values in sequence
    let ofDMP = of(midasDMP);
    return postRes;
  }
}
