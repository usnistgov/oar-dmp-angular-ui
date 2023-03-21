import { TestBed } from '@angular/core/testing';

import { DmpAPIService } from './dmp-api.service';

describe('DmpAPIService', () => {
  let service: DmpAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DmpAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
