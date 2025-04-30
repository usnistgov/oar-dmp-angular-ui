import { TestBed } from '@angular/core/testing';

import { FormChangedService } from './form-changed.service';

describe('FormChangedService', () => {
  let service: FormChangedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormChangedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
