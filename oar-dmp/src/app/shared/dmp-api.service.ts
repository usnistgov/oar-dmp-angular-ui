import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DmpAPIService {
  // 30 day token: created 08/21/2024
  nsdtoken:String = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJOSVNUX0FTRCIsImF1ZCI6IkFTRF9BUEkiLCJleHAiOjE3MjY4NTA2MTYsImlhdCI6MTcyNDI1ODYxNiwiY2xpZW50X2lkIjoiTUlEQVMifQ.FarbuiqzEfWSxNFwgdvPaYhYCc2ZxKb9ZsKmXUMu7i4';
  initialPeopleParams = {
    "hasCPRRoles": false,
    "hasInactivePeople": false,
    "lastName": [
        ""
    ],
    "matchOnlyBeginning": true
  }  

  orgParams ={

  };

  peopleResponse!:any;
  orgsResponse!:any;

  constructor(private http: HttpClient)  { }
  //URL to get a list of mock contacts from MongoDB using python API
  API = "https://nsd-test.nist.gov/nsd/api/v1/People/list/";
  ORGS = "https://nsd-test.nist.gov/nsd/api/v1/NISTOUDivisionGroup";
  

  public async get_NIST_Personnel(searchStr:string):Promise<any>{
    const httpHeaders:HttpHeaders = new HttpHeaders({
      'accept': 'text/plain; x-api-version=1.0',
      'Content-Type': 'application/json; x-api-version=1.0',
      'Authorization': 'Bearer ' + this.nsdtoken

    });
    this.initialPeopleParams.lastName = [searchStr];
    // return this.http.get(this.API);
    const response = this.http.post<any>(this.API, this.initialPeopleParams, {headers: httpHeaders});
    this.peopleResponse = await lastValueFrom(response);
    // console.log(this.peopleResponse);
    return this.peopleResponse;
    
  }

  public async get_NISTOUDivisionGroup():Promise<any>{
    const httpHeaders:HttpHeaders = new HttpHeaders({
      'accept': 'text/plain; x-api-version=1.0',
      'Authorization': 'Bearer ' + this.nsdtoken

    });
    const response = this.http.get<any>(this.ORGS, {headers: httpHeaders});
    this.orgsResponse = await lastValueFrom(response);
    return this.orgsResponse;
    
  }

}
