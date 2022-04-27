import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DmpAPIService {

  constructor(private http: HttpClient)  { }
  //URL to get a list of mock contacts from MongoDB using python API
  API = "http://127.0.0.1:5000/api/people"

  public getAll(){
    return this.http.get(this.API);
  }

}