import { TestBed } from '@angular/core/testing';

import { SubmitDmpService } from '../submit-dmp.service';

describe('SubmitDmpService', () => {
  let service: SubmitDmpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubmitDmpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
