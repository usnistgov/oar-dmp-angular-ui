import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { NistResourcesService } from './nist-resources.service';

describe('NistResourcesService', () => {
  let service: NistResourcesService;
  let httpController: HttpTestingController;
  let mockdata = { "RESOURCES": [ { "resource": "Storage", "options": [] } ] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ NistResourcesService ]
    });
    service = TestBed.inject(NistResourcesService);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('can fetch data', async () => {
    let prom = service.fetchNistResources().toPromise();
    let req = httpController.expectOne('assets/nist-resources.json');
    req.flush(mockdata);
    await prom;
    let info = service.getNistResources();
    expect(info.RESOURCES).toBeTruthy();
  });
});
