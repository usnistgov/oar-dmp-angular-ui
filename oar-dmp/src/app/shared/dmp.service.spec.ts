import { TestBed } from '@angular/core/testing';

import { DmpService } from './dmp.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigurationService } from '../config/config.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

describe('DmpService', () => {
  let service: DmpService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigurationService]
    });
    service = TestBed.inject(DmpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('new DMP record', () => {
    expect(service).toBeTruthy();
  });
});
