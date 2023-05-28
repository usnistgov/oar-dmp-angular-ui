import { TestBed } from '@angular/core/testing';

import { LoadResourcesService } from './load-resources.service';

describe('LoadResourcesService', () => {
  let service: LoadResourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadResourcesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
