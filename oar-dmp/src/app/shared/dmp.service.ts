import { Injectable } from '@angular/core';
import { Observable, of, catchError, throwError, switchMap } from 'rxjs';
import { DMP_Meta } from '../types/DMP.types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MIDASDMP } from '../types/midas-dmp.type';
import { ConfigurationService, AuthenticationService, Credentials } from 'oarng';
import { DMPConfiguration } from './config.model';
// import { ConfigurationService } from '../config/config.module';
// import * as jsonData from '../../assets/environment.json'// remove this line and import configservice from ../service config.service

@Injectable({
  providedIn: 'root'
})
export class DmpService {

  // PDR_API = "http://localhost:9091/midas/dmp/mdm1"//https://mdsdev.nist.gov
  // dmpsAPI = "http://127.0.0.1:5000/dmps"  

  // The link for the API that saves and gets data for DMP is provided in the 
  // environment.json file located in assets directory
  API_CONF: any = null; //jsonData; //get data from environment.json

  /**
   * See these two articles for setting up CORS in Angular
   * https://dev-academy.com/angular-cors/
   * https://www.azilen.com/blog/how-to-resolve-cors-errors-by-using-angular-proxy
   * ng serve -o --proxy-config src/proxy.conf.json
   */
  // PDR = "/api/midas/dmp/mdm1"

  constructor(private http: HttpClient, private configService: ConfigurationService,
              private authService: AuthenticationService)
  { }

  // Http Options
  getHttpOptions(creds?: Credentials): {headers: HttpHeaders} {
      let hdrs: {[name: string]: string} = {
      'Content-Type': 'application/json',
    };
    if (creds)
      hdrs["Authorization"] = "Bearer "+creds.token;
    return { headers: new HttpHeaders(hdrs) };
  };

  private NewDmpRecord: DMP_Meta = {
    //Basic Info Meta data
    title:                    '',
    startDate:                '',
    // endDate:                  '',
    dmpSearchable:            'yes',
    funding:                  {grant_source:'Grant Number', grant_id:''},
    projectDescription:       '',
    

    //Personel
    // primary_NIST_contact:     {
    //   firstName:"", lastName:"", orcid:"", emailAddress:"",
    //   groupOrgID:0, groupNumber:"", groupName:"",
    //   divisionOrgID:0, divisionNumber:"", divisionName:"",
    //   ouOrgID:0, ouNumber:"", ouName:"",
    // },
    organizations:            [],
    contributors:             [],

    //Keywords
    keywords:                 [],

    //Technical Resources
    dataSize:                 null,
    sizeUnit:                 "GB",
    softwareDevelopment:      {development:"no", softwareUse:"both", softwareDatabase: "no", softwareWebsite: "no"},
    technicalResources:       [],
    instruments:              [],
    
    // Ethical Issues Meta data
    ethical_issues:           {
                                irb_number:                   '',
                                ethical_issues_exist:         'no', 
                                ethical_issues_description:   '', 
                                ethical_issues_report:        ''
                                
                              },
    security_and_privacy:       {
                                data_sensitivity:             [],
                                cui:                          []
                              },                              

    // Data Description Meta data
    dataDescription:          '',
    dataCategories:           [],

    // Data Preservation Meta data
    preservationDescription:  '',
    dataAccess:               '',
    pathsURLs:                []

  };

  fetchPDR(): Observable<any>{
    // console.log("fetchPDR")
    let getInfo = this.http.get<any>(this.configService.getConfig<DMPConfiguration>().PDRDMP);
    return getInfo
  }

  fetchDMP(action:string, recordID:string|null) {   
    //Action can be new or edit and it indicates if we need to create a new DMP - i.e. a blank DMP
    // or if we are editing an existing one and which needs to be pulled from API
    // console.log("fetchDMP");
    console.log(this.configService.getConfig<DMPConfiguration>().PDRDMP);
    if (action === 'new'){
      return of(this.NewDmpRecord);
    }
    else{
      /**
       * get DMP record from API
       */
      let apiAddress:string = this.configService.getConfig<DMPConfiguration>().PDRDMP; //this.PDR_API;
      if (recordID !==null){
        apiAddress += "/" + recordID;
      }
      // console.log("fetchDMP: pre get");
      //return this.http.get<any>(apiAddress, this.getHttpOptions(creds));
      return this.authService.getCredentials().pipe(
        switchMap(creds => {
          if (! creds)
            throwError(new Error("Authentication Failed"));
          return this.http.get<any>(apiAddress, this.getHttpOptions(creds))
        })
      );
    }
    
  }

  updateDMP(dmpMeta: DMP_Meta, dmpID: string) {
    // console.log("updateDMP");
    let apiAddress:string = this.configService.getConfig<DMPConfiguration>().PDRDMP; //this.PDR_API;
    apiAddress += "/" + dmpID + "/data";

    return this.authService.getCredentials().pipe(
      switchMap(creds => {
        if (! creds)
          throwError(new Error("Authentication Failed"));
        return this.http.put<any>(apiAddress, JSON.stringify(dmpMeta), this.getHttpOptions(creds))
      })
    );
  }

  createDMP(dmpMeta: DMP_Meta, name:string) {
    // console.log("createDMP")
    let midasDMP:MIDASDMP = {name:name, data:dmpMeta}
    let apiAddress:string = this.configService.getConfig<DMPConfiguration>().PDRDMP; //this.PDR_API;

    return this.authService.getCredentials().pipe(
      switchMap(creds => {
        if (! creds)
          throwError(new Error("Authentication Failed"));
        return this.http.post<any>(apiAddress,
                                   JSON.stringify(midasDMP),
                                   this.getHttpOptions(creds));
        // return this.http.post<Array<any>>(this.dmpsAPI,
        //                                   JSON.stringify(midasDMP),
        //                                   this.getHttpOptions(creds))
      })
    );
    

  }

}
