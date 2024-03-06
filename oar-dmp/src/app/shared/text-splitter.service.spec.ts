import { TestBed } from '@angular/core/testing';

import { TextSplitterService } from './text-splitter.service';

describe('TextSplitterService', () => {
  let service: TextSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextSplitterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
