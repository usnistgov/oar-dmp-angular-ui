import { TestBed } from '@angular/core/testing';

import { NistResorucesService } from './nist-resoruces.service';

describe('NistResorucesService', () => {
  let service: NistResorucesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NistResorucesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
