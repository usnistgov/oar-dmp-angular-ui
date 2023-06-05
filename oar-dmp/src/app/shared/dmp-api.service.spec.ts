import { TestBed } from '@angular/core/testing';

import { DmpAPIService } from './dmp-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DmpAPIService', () => {
  let service: DmpAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DmpAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
