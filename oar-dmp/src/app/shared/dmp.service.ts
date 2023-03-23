import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DMP_Meta } from '../types/DMP.types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MIDASDMP } from '../types/midas-dmp.type';
import * as jsonData from '../../assets/environment.json'

@Injectable({
  providedIn: 'root'
})
export class DmpService {

  // PDR_API = "http://localhost:9091/midas/dmp/mdm1"//https://mdsdev.nist.gov
  // dmpsAPI = "http://127.0.0.1:5000/dmps"  

  // The link for the API that saves and gets data for DMP is provided in the 
  // environment.json file located in assets directory
  API_CONF: any = jsonData; //get data from environment.json

  /**
   * See these two articles for setting up CORS in Angular
   * https://dev-academy.com/angular-cors/
   * https://www.azilen.com/blog/how-to-resolve-cors-errors-by-using-angular-proxy
   * ng serve -o --proxy-config src/proxy.conf.json
   */
  // PDR = "/api/midas/dmp/mdm1"

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient)  { }

  private NewDmpRecord: DMP_Meta = {
    //Basic Info Meta data
    title:                    '',
    startDate:                '',
    endDate:                  '',
    dmpSearchable:            'yes',
    funding:                  {grant_source:'Grant Number', grant_id:''},
    projectDescription:       '',

    //Personel
    primary_NIST_contact:     {firstName:"", lastName:""},
    // NIST_DMP_Reviewer:        {firstName:"Ray", lastName:"Plante"},
    contributors:             [],

    //Keywords
    keyWords:                 [],

    //Technical Resources
    dataSize:                 0,
    sizeUnit:                 "GB",
    softwareDevelopment:      {development:"no", softwareUse:"both", softwareDatabase: "no", softwareWebsite: "no"},
    technicalResources:       [],
    
    // Ethical Issues Meta data
    ethical_issues:           {
                                ethical_issues_exist:         'no', 
                                ethical_issues_description:   '', 
                                ethical_issues_report:        '', 
                                dmp_PII:                      'no'
                              },

    // Data Description Meta data
    dataDescription:          '',
    dataCategories:           [],

    // Data Preservation Meta data
    preservationDescription:  '',
    pathsURLs:                []

  };


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
    let getInfo = this.http.get<any>(this.API_CONF.PDRDMP);
    return getInfo
  }

  fetchDMP(action:string, recordID:string|null) {   
    //Action can be new or edit and it indicates if we need to create a new DMP - i.e. a blank DMP
    // or if we are editing an existing one and which needs to be pulled from API
    // console.log("fetchDMP");
    console.log(this.API_CONF.PDRDMP);
    if (action === 'new'){
      return of(this.NewDmpRecord);
    }
    else{
      /**
       * get DMP record from API
       */
      let apiAddress:string = this.API_CONF.PDRDMP; //this.PDR_API;
      if (recordID !==null){
        apiAddress += "/" + recordID;
      }
      // console.log("fetchDMP: pre get");
      return this.http.get<any>(apiAddress);
    }
    
  }

  updateDMP(dmpMeta: DMP_Meta, dmpID: string) {
    // console.log("updateDMP");
    let apiAddress:string = this.API_CONF.PDRDMP; //this.PDR_API;
    apiAddress += "/" + dmpID + "/data";
    return this.http.put<any>(apiAddress, JSON.stringify(dmpMeta), this.httpOptions)

  }

  createDMP(dmpMeta: DMP_Meta, name:string){
    // console.log("createDMP")
    let midasDMP:MIDASDMP = {name:name, data:dmpMeta}
    return this.http.post<any>(this.API_CONF.PDRDMP, JSON.stringify(midasDMP), this.httpOptions)
    // return this.http.post<Array<any>>(this.dmpsAPI, JSON.stringify(midasDMP), this.httpOptions)
    

  }

}
