import { TestBed } from '@angular/core/testing';

import { UpdateNistContributorService } from './update-nist-contributor.service';
import { UpdateIndicator } from '../types/update-indicator.type';

describe('UpdateNistContributorService', () => {
  let service: UpdateNistContributorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateNistContributorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor-initialized state', () => {
    it('seeds updateContributors with a zeroed, not-updated indicator', () => {
      expect(service.updateContributors).toEqual({ numUpdates: 0, isUpdated: false });
    });

    it('seeds updateOUs with a zeroed, not-updated indicator', () => {
      expect(service.updateOUs).toEqual({ numUpdates: 0, isUpdated: false });
    });
  });

  describe('updateNISTContrib$', () => {
    it('emits an UpdateIndicator to subscribers', () => {
      const received: UpdateIndicator[] = [];
      service.updateNISTContrib$.subscribe(v => received.push(v));

      service.updateNISTContrib$.next({ numUpdates: 2, isUpdated: true });

      expect(received).toEqual([{ numUpdates: 2, isUpdated: true }]);
    });

    it('does not replay to late subscribers (plain Subject)', () => {
      const received: UpdateIndicator[] = [];
      service.updateNISTContrib$.next({ numUpdates: 1, isUpdated: true }); // pre-subscribe
      service.updateNISTContrib$.subscribe(v => received.push(v));
      service.updateNISTContrib$.next({ numUpdates: 3, isUpdated: true });

      expect(received).toEqual([{ numUpdates: 3, isUpdated: true }]);
    });
  });

  describe('updateOUs$', () => {
    it('emits an UpdateIndicator to subscribers', () => {
      const received: UpdateIndicator[] = [];
      service.updateOUs$.subscribe(v => received.push(v));

      service.updateOUs$.next({ numUpdates: 1, isUpdated: true });

      expect(received).toEqual([{ numUpdates: 1, isUpdated: true }]);
    });
  });

  it('keeps the two subjects independent', () => {
    const contrib: UpdateIndicator[] = [];
    const ous: UpdateIndicator[] = [];
    service.updateNISTContrib$.subscribe(v => contrib.push(v));
    service.updateOUs$.subscribe(v => ous.push(v));

    service.updateNISTContrib$.next({ numUpdates: 1, isUpdated: true });

    expect(contrib.length).toBe(1);
    expect(ous.length).toBe(0);
  });

  it('emitting on a subject does not mutate the seeded field state', () => {
    // The stored indicators and the subjects are separate; emitting shouldn't
    // change the fields (which are only assigned in the constructor here).
    service.updateNISTContrib$.next({ numUpdates: 9, isUpdated: true });
    expect(service.updateContributors).toEqual({ numUpdates: 0, isUpdated: false });
  });
});