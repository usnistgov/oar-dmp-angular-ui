import { TestBed } from '@angular/core/testing';

import { DmpService } from './dmp.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigurationService } from '../config/config.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Configuration } from '../config/config.model';

describe('DmpService', () => {
  let service: DmpService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  // Mock configuration object
  const mockConfig: Configuration = {
      PDRDMP: 'http://localhost:9091/midas/dmp/mdm1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigurationService]
    });
    service = TestBed.inject(DmpService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
      // After every test, assert that there are no more pending requests.
      // This throws an error if there are any requests that haven't been flushed yet.
      httpController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('fetch a DMP', async() => {
    // Create a promise. This will pause the test until the promise is resolved using await.
    const configPromise = service.fetchDMP("edit", "mdm1:0017").toPromise();

    // By the time the HTTP request is expected, the configPromise has already been created.
    const req = httpController.expectOne('//mdm1:0017');
    expect(req.request.method).toBe('GET');
    // Set the HTTP response
    req.flush(mockConfig);

    // Wait for fetchDMP() to finish, which will hang on HttpClient.get() to finish
    const config = await configPromise;

    // Assert
    expect(config).toEqual(mockConfig);

  });
});
