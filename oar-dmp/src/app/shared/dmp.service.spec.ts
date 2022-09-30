import { TestBed } from '@angular/core/testing';

import { DmpService } from './dmp.service';

describe('DmpService', () => {
  let service: DmpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DmpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
