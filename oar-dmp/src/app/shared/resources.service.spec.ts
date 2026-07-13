import { TestBed } from '@angular/core/testing';

import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  let service: ResourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourcesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('starts with dataCategoriesIsSet false', () => {
      expect(service.dataCategoriesIsSet).toBe(false);
    });

    it('starts with an undefined storageMessage', () => {
      expect(service.storageMessage).toBeUndefined();
    });
  });

  describe('setStorageMessage', () => {
    it('stores the provided message', () => {
      service.setStorageMessage('GB');
      expect(service.storageMessage).toBe('GB');
    });

    it('overwrites a previously set message', () => {
      service.setStorageMessage('GB');
      service.setStorageMessage('TB');
      expect(service.storageMessage).toBe('TB');
    });

    it('accepts an empty string (used to clear the highlight)', () => {
      service.setStorageMessage('GB');
      service.setStorageMessage('');
      expect(service.storageMessage).toBe('');
    });
  });

  describe('setDataCategories', () => {
    it('sets the flag to true', () => {
      service.setDataCategories(true);
      expect(service.dataCategoriesIsSet).toBe(true);
    });

    it('sets the flag back to false', () => {
      service.setDataCategories(true);
      service.setDataCategories(false);
      expect(service.dataCategoriesIsSet).toBe(false);
    });
  });

  // The service exposes three Subjects used to message unrelated components.
  // These tests confirm they emit to subscribers (multicast, no replay).
  describe('storageSubject$', () => {
    it('emits the value pushed onto it', () => {
      const received: string[] = [];
      service.storageSubject$.subscribe(v => received.push(v));
      service.storageSubject$.next('TB');
      expect(received).toEqual(['TB']);
    });

    it('does not replay values to subscribers that join later (plain Subject)', () => {
      const received: string[] = [];
      service.storageSubject$.next('missed');
      service.storageSubject$.subscribe(v => received.push(v));
      service.storageSubject$.next('seen');
      expect(received).toEqual(['seen']);
    });
  });

  describe('softwareSubject$', () => {
    it('emits the value pushed onto it', () => {
      const received: string[] = [];
      service.softwareSubject$.subscribe(v => received.push(v));
      service.softwareSubject$.next('internal');
      expect(received).toEqual(['internal']);
    });
  });

  describe('dataCategories$', () => {
    it('emits the boolean pushed onto it', () => {
      const received: boolean[] = [];
      service.dataCategories$.subscribe(v => received.push(v));
      service.dataCategories$.next(true);
      service.dataCategories$.next(false);
      expect(received).toEqual([true, false]);
    });

    it('is independent of the dataCategoriesIsSet field (subject vs stored flag)', () => {
      // Emitting on the subject does NOT mutate the stored flag; only
      // setDataCategories() does. This guards against conflating the two.
      service.dataCategories$.next(true);
      expect(service.dataCategoriesIsSet).toBe(false);
    });
  });
});