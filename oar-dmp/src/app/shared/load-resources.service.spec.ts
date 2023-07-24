import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NistResorucesService } from '../config/nist-resoruces.service';
import { LoadResourcesService } from './load-resources.service';

describe('LoadResourcesService', () => {
  let service: LoadResourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ NistResorucesService, LoadResourcesService ]
    });
    service = TestBed.inject(LoadResourcesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
