import { TestBed } from '@angular/core/testing';

import { PageResizeService } from './page-resize.service';

describe('PageResizeService', () => {
  let service: PageResizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageResizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
