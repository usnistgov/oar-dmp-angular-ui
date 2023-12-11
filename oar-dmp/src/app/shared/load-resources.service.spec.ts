import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NistResourcesService } from '../config/nist-resources.service';
import { LoadResourcesService } from './load-resources.service';

describe('LoadResourcesService', () => {
  let service: LoadResourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ NistResourcesService, LoadResourcesService ]
    });
    service = TestBed.inject(LoadResourcesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
