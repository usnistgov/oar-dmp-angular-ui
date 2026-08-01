import { TestBed } from '@angular/core/testing';

import { FormChangedService } from './form-changed.service';

describe('FormChangedService', () => {
  let service: FormChangedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormChangedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('disableSaveBtn$', () => {
    it('emits the boolean pushed onto it', () => {
      const received: boolean[] = [];
      service.disableSaveBtn$.subscribe(v => received.push(v));
      service.disableSaveBtn$.next(true);
      service.disableSaveBtn$.next(false);
      expect(received).toEqual([true, false]);
    });

    it('does not replay to late subscribers (plain Subject)', () => {
      const received: boolean[] = [];
      service.disableSaveBtn$.next(true); // emitted before anyone subscribed
      service.disableSaveBtn$.subscribe(v => received.push(v));
      service.disableSaveBtn$.next(false);
      expect(received).toEqual([false]);
    });
  });

  describe('hasUnsavedChanges$', () => {
    it('emits the boolean pushed onto it', () => {
      const received: boolean[] = [];
      service.hasUnsavedChanges$.subscribe(v => received.push(v));
      service.hasUnsavedChanges$.next(true);
      expect(received).toEqual([true]);
    });
  });

  it('keeps the two subjects independent', () => {
    const disable: boolean[] = [];
    const unsaved: boolean[] = [];
    service.disableSaveBtn$.subscribe(v => disable.push(v));
    service.hasUnsavedChanges$.subscribe(v => unsaved.push(v));

    service.disableSaveBtn$.next(true);
    expect(disable).toEqual([true]);
    expect(unsaved).toEqual([]); // untouched
  });
});