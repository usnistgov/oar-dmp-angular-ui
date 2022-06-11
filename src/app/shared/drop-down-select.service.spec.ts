import { TestBed } from '@angular/core/testing';

import { DropDownSelectService } from './drop-down-select.service';

describe('DropDownSelectService', () => {
  let service: DropDownSelectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropDownSelectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
