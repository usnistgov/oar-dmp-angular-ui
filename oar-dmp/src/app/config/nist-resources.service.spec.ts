import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { NistResourcesService } from './nist-resources.service';
import { NIST_Resources } from './nist-resources.model';
import { environment } from '../../environments/environment';

describe('NistResourcesService', () => {
  let service: NistResourcesService;
  let httpController: HttpTestingController;

  const mockData: NIST_Resources = {
    RESOURCES: [
      { resource: 'Storage', options: [] },
      { resource: 'Compute', options: [] }
    ]
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NistResourcesService]
    });
    service = TestBed.inject(NistResourcesService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize nistResources url from environment', () => {
    expect(service.nistResources).toBe(environment.NIST_Resources);
  });

  it('should start with resources as null', () => {
    expect(service.resources).toBeNull();
  });

  describe('loadResources', () => {
    it('should set resources from provided data', () => {
      service.loadResources(mockData);
      expect(service.resources).toEqual(mockData);
    });

    it('should log a debug message when environment.debug is true', () => {
      const originalDebug = environment.debug;
      (environment as any).debug = true;
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

      service.loadResources(mockData);

      expect(infoSpy).toHaveBeenCalledWith('✓ NIST resources loaded');

      infoSpy.mockRestore();
      (environment as any).debug = originalDebug;
    });

    it('should not log when environment.debug is false', () => {
      const originalDebug = environment.debug;
      (environment as any).debug = false;
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

      service.loadResources(mockData);

      expect(infoSpy).not.toHaveBeenCalled();

      infoSpy.mockRestore();
      (environment as any).debug = originalDebug;
    });
  });

  describe('getNistResources', () => {
    it('should return an empty RESOURCES array when nothing has been loaded', () => {
      const result = service.getNistResources();
      expect(result).toEqual({ RESOURCES: [] });
    });

    it('should return loaded resources after loadResources is called', () => {
      service.loadResources(mockData);
      const result = service.getNistResources();
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchNistResources', () => {
    it('should GET from the default environment URL when no argument is passed', async () => {
      const promise = service.fetchNistResources().toPromise();
      const req = httpController.expectOne(environment.NIST_Resources);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
      await promise;

      expect(service.getNistResources()).toEqual(mockData);
    });

    it('should GET from a custom URL when one is provided', async () => {
      const customUrl = 'assets/custom-resources.json';
      const promise = service.fetchNistResources(customUrl).toPromise();
      const req = httpController.expectOne(customUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
      await promise;

      expect(service.getNistResources()).toEqual(mockData);
    });

    it('should load and expose resources via tap on success', async () => {
      const promise = service.fetchNistResources().toPromise();
      const req = httpController.expectOne(environment.NIST_Resources);
      req.flush(mockData);
      await promise;

      expect(service.resources).toEqual(mockData);
    });

    it('should handle a server-side error and rethrow the message', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const promise = service.fetchNistResources().toPromise();
      const req = httpController.expectOne(environment.NIST_Resources);

      req.flush('Server error body', { status: 500, statusText: 'Internal Server Error' });

      await expect(promise).rejects.toContain('Error Code: 500');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load NIST resources:'));

      errorSpy.mockRestore();
    });

    it('should handle a client-side ErrorEvent and rethrow the message', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const promise = service.fetchNistResources().toPromise();
      const req = httpController.expectOne(environment.NIST_Resources);

      const errorEvent = new ErrorEvent('Network error', {
        message: 'Simulated client-side network failure'
      });

      req.error(errorEvent);

      await expect(promise).rejects.toBe('Simulated client-side network failure');
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to load NIST resources: Simulated client-side network failure'
      );

      errorSpy.mockRestore();
    });

    it('should not overwrite resources when the fetch fails', async () => {
      service.loadResources(mockData);

      const promise = service.fetchNistResources().toPromise();
      const req = httpController.expectOne(environment.NIST_Resources);
      req.flush('error', { status: 404, statusText: 'Not Found' });

      await promise.catch(() => {});

      expect(service.resources).toEqual(mockData);
    });
  });
});