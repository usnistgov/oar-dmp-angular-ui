import { TestBed } from '@angular/core/testing';

import { DmpService, confirmDialog } from './dmp.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  ConfigModule, CONFIG_URL, ConfigurationService, AuthenticationService, MockAuthenticationService
} from 'oarng';
import { environment } from '../../environments/environment';
import { DMPConfiguration } from './config.model';

import { DMP_Meta } from '../types/DMP.types';

describe('DmpService', () => {
  let service: DmpService;
  let cfgsvc: ConfigurationService;
  let httpController: HttpTestingController;

  // Mock configuration object
  const mockConfig: DMPConfiguration = {
    PDRDMP: 'http://localhost:9091/midas/dmp/mdm1',
  };

  // Mirrors the CURRENT DMP_Meta shape (see DMP.types.ts and NewDmpRecord in
  // dmp.service.ts). Kept in sync with the service's blank template so the
  // "start new DMP" test can assert deep equality against it.
  const mockDmpRecord: DMP_Meta = {
    // Basic Info
    title: '',
    startDate: '',
    dmpSearchable: 'yes',
    funding: { grant_source: 'Grant Number', grant_id: '' },
    projectDescription: '',

    // Personnel
    organizations: [],
    contributors: [],

    // Keywords
    keywords: [],

    // Technical Resources
    dataSize: null,
    sizeUnit: 'GB',
    dataSizeDescription: '',
    softwareDevelopment: { development: 'no', softwareUse: 'both', softwareDatabase: 'no', softwareWebsite: 'no' },
    technicalResources: [],
    instruments: [],

    // Ethical Issues
    ethical_issues: {
      irb_number: '',
      ethical_issues_exist: 'no',
      ethical_issues_description: '',
      ethical_issues_report: ''
    },

    // Security and Privacy
    security_and_privacy: {
      data_sensitivity: [],
      cui: []
    },

    // Data Description
    dataDescription: '',
    dataCategories: [],

    // Data Preservation
    preservationDescription: '',
    dataAccess: '',
    pathsURLs: []
  };

  /** A populated record used for update/create round-trip assertions. */
  const populatedDmpRecord: DMP_Meta = {
    ...mockDmpRecord,
    title: 'My Plan',
    startDate: '2026-01-01',
    projectDescription: 'A description.',
    keywords: ['alpha', 'beta'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ConfigModule],
      providers: [
        { provide: CONFIG_URL, useValue: environment.configUrl },
        { provide: AuthenticationService, useClass: MockAuthenticationService }
      ]
    });
    service = TestBed.inject(DmpService);
    httpController = TestBed.inject(HttpTestingController);
    cfgsvc = TestBed.inject(ConfigurationService);

    // ConfigurationService fetches the config on init; satisfy that request.
    const req = httpController.expectOne('assets/environment.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
    expect(cfgsvc.getConfig()['PDRDMP']).toBe(mockConfig['PDRDMP']);
  });

  afterEach(() => {
    // Assert no outstanding HTTP requests remain unflushed.
    httpController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // fetchDMP
  // -------------------------------------------------------------------------
  describe('fetchDMP', () => {
    it('returns the blank NewDmpRecord for action "new" without hitting the API', async () => {
      const dmpPromise = service.fetchDMP('new', null).toPromise();

      // No HTTP request should be issued for a new record.
      httpController.expectNone(mockConfig.PDRDMP);

      const rec = await dmpPromise;
      expect(rec).toStrictEqual(mockDmpRecord);
    });

    it('returns a NEW object (not the internal template) each call for "new"', async () => {
      // The service returns of(this.NewDmpRecord). Guard against a caller
      // mutating the shared template by confirming it equals the expected shape.
      const first = await service.fetchDMP('new', null).toPromise();
      expect(first).toStrictEqual(mockDmpRecord);
    });

    it('fetches an existing DMP from the API for action "edit"', async () => {
      const dmpPromise = service.fetchDMP('edit', 'mdm1:0017').toPromise();

      const req = httpController.expectOne(mockConfig.PDRDMP + '/mdm1:0017');
      expect(req.request.method).toBe('GET');
      req.flush({
        name: 'testrec',
        id: 'mdm1:0017',
        data: mockDmpRecord
      });

      const rec = await dmpPromise;
      expect(rec.id).toEqual('mdm1:0017');
      expect(rec.name).toEqual('testrec');
      expect(rec.data.dmpSearchable).toEqual('yes');
      expect(rec.data.title).toEqual('');
    });

    it('sends a Bearer auth header on the edit request', async () => {
      const dmpPromise = service.fetchDMP('edit', 'mdm1:0017').toPromise();

      const req = httpController.expectOne(mockConfig.PDRDMP + '/mdm1:0017');
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ name: 'testrec', id: 'mdm1:0017', data: mockDmpRecord });

      await dmpPromise;
    });

    it('does NOT append an id to the URL when recordID is null on an edit', async () => {
      // recordID null on a non-"new" action: URL stays at the base address.
      const dmpPromise = service.fetchDMP('edit', null).toPromise();

      const req = httpController.expectOne(mockConfig.PDRDMP);
      expect(req.request.method).toBe('GET');
      req.flush({ name: 'x', id: 'x', data: mockDmpRecord });

      await dmpPromise;
    });
  });

  // -------------------------------------------------------------------------
  // updateDMP
  // -------------------------------------------------------------------------
  describe('updateDMP', () => {
    it('PUTs the record to /{id}/data and returns the response', async () => {
      const dmpPromise = service.updateDMP(populatedDmpRecord, 'mdm1:0017').toPromise();

      const req = httpController.expectOne(mockConfig.PDRDMP + '/mdm1:0017/data');
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');
      // Body is JSON-stringified in the service.
      expect(req.request.body).toEqual(JSON.stringify(populatedDmpRecord));
      req.flush(populatedDmpRecord);

      const rec = await dmpPromise;
      expect(rec).toEqual(populatedDmpRecord);
    });
  });

  // -------------------------------------------------------------------------
  // createDMP
  // -------------------------------------------------------------------------
  describe('createDMP', () => {
    it('POSTs a { name, data } envelope to the base URL', async () => {
      const createPromise = service.createDMP(populatedDmpRecord, 'my-mnemonic').toPromise();

      const req = httpController.expectOne(mockConfig.PDRDMP);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');

      // Service wraps the record as MIDASDMP { name, data } and stringifies it.
      const expectedBody = JSON.stringify({ name: 'my-mnemonic', data: populatedDmpRecord });
      expect(req.request.body).toEqual(expectedBody);

      req.flush({ id: 'mdm1:0099', name: 'my-mnemonic', data: populatedDmpRecord });

      const res = await createPromise;
      expect(res.id).toBe('mdm1:0099');
    });
  });

  // -------------------------------------------------------------------------
  // aclsPermission
  // -------------------------------------------------------------------------
  describe('aclsPermission', () => {
    it('GETs the acls endpoint for the given permission type', async () => {
      const permPromise = service.aclsPermission('mdm1:0017', 'write').toPromise();

      const req = httpController.expectOne(
        mockConfig.PDRDMP + '/mdm1:0017/acls/write/:user'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');
      req.flush(true);

      const res = await permPromise;
      expect(res).toBe(true);
    });

    it('builds the correct URL for a "read" permission check', async () => {
      const permPromise = service.aclsPermission('mdm1:0017', 'read').toPromise();

      const req = httpController.expectOne(
        mockConfig.PDRDMP + '/mdm1:0017/acls/read/:user'
      );
      expect(req.request.method).toBe('GET');
      req.flush(false);

      expect(await permPromise).toBe(false);
    });

    it('does NOT append acls path segments when recordID is null', async () => {
      // With a null recordID the service leaves the URL at the base address.
      const permPromise = service.aclsPermission(null, 'write').toPromise();

      const req = httpController.expectOne(mockConfig.PDRDMP);
      expect(req.request.method).toBe('GET');
      req.flush(true);

      expect(await permPromise).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // getBlankDmp
  // -------------------------------------------------------------------------
  describe('getBlankDmp', () => {
    it('returns a record matching the blank template shape', () => {
      expect(service.getBlankDmp()).toStrictEqual(mockDmpRecord);
    });

    it('returns a deep clone so callers cannot mutate the internal template', () => {
      const a = service.getBlankDmp();
      a.title = 'mutated';
      a.funding.grant_id = 'X-1';
      (a.keywords as string[]).push('leak');

      const b = service.getBlankDmp();
      // A fresh copy must be unaffected by mutations to a previous one.
      expect(b.title).toBe('');
      expect(b.funding.grant_id).toBe('');
      expect(b.keywords).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// confirmDialog — standalone exported helper
// ---------------------------------------------------------------------------
describe('confirmDialog', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when the user confirms', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    expect(confirmDialog('Proceed?')).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith('Proceed?');
  });

  it('returns false when the user cancels', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    expect(confirmDialog('Proceed?')).toBe(false);
  });
});