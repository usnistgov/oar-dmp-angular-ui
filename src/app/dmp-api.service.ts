import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DmpAPIService {

  constructor(private http: HttpClient)  { }
  API = "http://127.0.0.1:5000/api/dmps"

  public getAll(){
    return this.http.get(this.API);
  }

}
