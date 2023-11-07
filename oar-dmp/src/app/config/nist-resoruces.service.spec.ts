import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { NistResorucesService } from './nist-resoruces.service';

describe('NistResorucesService', () => {
  let service: NistResorucesService;
  let httpController: HttpTestingController;
  let mockdata = { "RESOURCES": [ { "resource": "Storage", "options": [] } ] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ NistResorucesService ]
    });
    service = TestBed.inject(NistResorucesService);
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
