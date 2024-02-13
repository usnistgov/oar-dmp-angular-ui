import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NistResourcesService } from '../config/nist-resources.service';

@Injectable({
  providedIn: 'root'
})
export class LoadResourcesService {

  constructor(
    private configService: NistResourcesService
  ) { }

  getAllResources():Observable<any>{
    let getInfo = this.configService.getNistResources().RESOURCES;
    return getInfo
  }
}
