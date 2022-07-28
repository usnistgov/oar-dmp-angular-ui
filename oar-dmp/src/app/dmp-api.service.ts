import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DmpAPIService {

  constructor(private http: HttpClient)  { }
  //URL to get a list of mock contacts from MongoDB using python API
  API = "http://127.0.0.1:8000/people"

  public getAll(){
    return this.http.get(this.API);
  }

}
