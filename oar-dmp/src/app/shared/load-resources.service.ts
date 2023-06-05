import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NistResorucesService } from '../config/nist-resoruces.service';

@Injectable({
  providedIn: 'root'
})
export class LoadResourcesService {

  constructor(
    private configService: NistResorucesService
  ) { }

  getAllResources():Observable<any>{
    let getInfo = this.configService.getNistResources().RESOURCES;
    return getInfo
  }
}
