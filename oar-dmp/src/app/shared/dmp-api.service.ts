import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DmpAPIService {
  nsdtoken:String = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJOSVNUX0FTRCIsImF1ZCI6IkFTRF9BUEkiLCJleHAiOjE3MjAxMDkyMjUsImlhdCI6MTcyMDAyMjgyNSwiY2xpZW50X2lkIjoiTUlEQVMifQ.9PvD_Y6g-iCgOdiiYuvzI35xm-jPYknkAFt7UArlTSE';
  initialPeopleParams = {
    "hasCPRRoles": false,
    "hasInactivePeople": false,
    "lastName": [
        ""
    ],
    "matchOnlyBeginning": true
  }

  constructor(private http: HttpClient)  { }
  //URL to get a list of mock contacts from MongoDB using python API
  API = "https://nsd-test.nist.gov/nsd/api/v1/People/list/"
  

  public get_NIST_Personnel(searchStr:string){
    const httpHeaders:HttpHeaders = new HttpHeaders({
      'accept': 'text/plain; x-api-version=1.0',
      'Content-Type': 'application/json; x-api-version=1.0',
      'Authorization': 'Bearer ' + this.nsdtoken

    });
    this.initialPeopleParams.lastName = [searchStr];
    // return this.http.get(this.API);
    return this.http.post<any>(this.API, this.initialPeopleParams, {headers: httpHeaders});
    
  }

}
