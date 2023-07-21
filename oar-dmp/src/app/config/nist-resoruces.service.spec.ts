import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NistResorucesService } from './nist-resoruces.service';

describe('NistResorucesService', () => {
  let service: NistResorucesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ NistResorucesService ]
    });
    service = TestBed.inject(NistResorucesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
