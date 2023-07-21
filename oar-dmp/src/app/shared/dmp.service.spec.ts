import { TestBed } from '@angular/core/testing';

import { DmpService } from './dmp.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
    ConfigModule, CONFIG_URL, ConfigurationService, AuthenticationService, MockAuthenticationService
} from 'oarng';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DMPConfiguration } from './config.model';


import { DMP_Meta } from '../types/DMP.types';

describe('DmpService', () => {
  let service: DmpService;
  let cfgsvc: ConfigurationService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  // Mock configuration object
  const mockConfig: DMPConfiguration = {
      PDRDMP: 'http://localhost:9091/midas/dmp/mdm1',
  };

  const mockDmpRecord: DMP_Meta = {
    //Basic Info Meta data
    title:                    '',
    startDate:                '',
    endDate:                  '',
    dmpSearchable:            'yes',
    funding:                  {grant_source:'Grant Number', grant_id:''},
    projectDescription:       '',

    //Personel
    primary_NIST_contact:     {firstName:"", lastName:""},
    contributors:             [],

    //Keywords
    keyWords:                 [],

    //Technical Resources
    dataSize:                 null,
    sizeUnit:                 "GB",
    softwareDevelopment:      {development:"no", softwareUse:"both", softwareDatabase: "no", softwareWebsite: "no"},
    technicalResources:       [],
    
    // Ethical Issues Meta data
    ethical_issues:           {
                                ethical_issues_exist:         'no', 
                                ethical_issues_description:   '', 
                                ethical_issues_report:        '', 
                                dmp_PII:                      'no'
                              },

    // Data Description Meta data
    dataDescription:          '',
    dataCategories:           [],

    // Data Preservation Meta data
    preservationDescription:  '',
    pathsURLs:                []

  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, ConfigModule ],
      providers: [
        { provide: CONFIG_URL, useValue: environment.configUrl },
        { provide: AuthenticationService, useClass: MockAuthenticationService }
      ]
    });
    service = TestBed.inject(DmpService);
    httpController = TestBed.inject(HttpTestingController);
    cfgsvc = TestBed.inject(ConfigurationService);

    let req = httpController.expectOne('assets/environment.json');
    expect(req.request.method).toBe('GET');
    // Set the HTTP response
    req.flush(mockConfig);
    expect(cfgsvc.getConfig()['PDRDMP']).toBe(mockConfig['PDRDMP']);
    // await cfgsvc.fetchConfig().toPromise();
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
    const dmpPromise = service.fetchDMP("edit", "mdm1:0017").toPromise();

    let req = httpController.expectOne(mockConfig.PDRDMP + "/mdm1:0017");
    req.flush({
      name: "testrec",
      id: "mdm1:0017",
      data: mockDmpRecord
    })

    // const req = httpController.expectOne('//mdm1:0017');
    // Wait for fetchDMP() to finish, which will hang on HttpClient.get() to finish
    const rec = await dmpPromise;

    // Assert
    expect(rec.id).toEqual("mdm1:0017");
    expect(rec.data.dmpSearchable).toEqual("yes");
    expect(rec.data.title).toEqual("");

  });

  it('start new DMP', async () => {    
    let dmpPromise = service.fetchDMP("new", null).toPromise();    

    const req = httpController.expectNone('/')
    expect(req).not.toBeNull();

    // Assert
    expect(await dmpPromise).toStrictEqual(mockDmpRecord);

  });

  it('update a DMP', async() => {
    // Create a promise. This will pause the test until the promise is resolved using await.
    const dmpPromise = service.updateDMP(mockDmpRecord, "mdm1:0017").toPromise();

    // By the time the HTTP request is expected, the configPromise has already been created.
    const req = httpController.expectOne(mockConfig.PDRDMP + '/mdm1:0017/data');
    expect(req.request.method).toBe('PUT');
    // Set the HTTP response
    req.flush(mockDmpRecord);

    let rec = await dmpPromise;

    // Assert
    expect(rec).toEqual(mockDmpRecord);    

  });

  /*
  it('create a DMP', async() => {
    // Create a promise. This will pause the test until the promise is resolved using await.
    const configPromise = service.createDMP(mockDmpRecord, "mnemonic").toPromise();

    // By the time the HTTP request is expected, the configPromise has already been created.
    const req = httpController.expectOne('/')
    expect(req.request.method).toBe('POST');
    expect(req).not.toBeNull();

    // Wait for fetchDMP() to finish, which will hang on HttpClient.get() to finish
    const config = await configPromise;

    // Assert
    expect(config).toStrictEqual(mockDmpRecord);

  });
  */
});
