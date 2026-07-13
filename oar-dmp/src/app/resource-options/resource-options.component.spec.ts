import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';

import { ResourceOptionsComponent } from './resource-options.component';
import { FilterPipe } from './filter.pipe';
import { ResourcesService } from '../shared/resources.service';
import { LoadResourcesService } from '../shared/load-resources.service';

describe('ResourceOptionsComponent', () => {
  let component: ResourceOptionsComponent;
  let fixture: ComponentFixture<ResourceOptionsComponent>;

  let resourcesServiceMock: {
    storageSubject$: Subject<string>;
    softwareSubject$: Subject<string>;
  };

  let loadResourcesServiceMock: {
    getAllResources: jest.Mock;
  };

  const sampleResources = [
    { resource: 'Storage', options: [{ text: 'Box', link: 'http://x/box', highlight: { storageSelection: ['GB'] } }] },
    { resource: 'Software', options: [{ text: 'Tool', link: 'http://x/tool', highlight: { softwareSelection: ['internal'] } }] },
  ];

  beforeEach(async () => {
    resourcesServiceMock = {
      storageSubject$: new Subject<string>(),
      softwareSubject$: new Subject<string>(),
    };

    loadResourcesServiceMock = {
      getAllResources: jest.fn().mockReturnValue(sampleResources),
    };

    await TestBed.configureTestingModule({
      declarations: [ResourceOptionsComponent, FilterPipe],
      providers: [
        { provide: ResourcesService, useValue: resourcesServiceMock },
        { provide: LoadResourcesService, useValue: loadResourcesServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with empty storage and software selections', () => {
      // Selections are set on ngOnInit but no subject has emitted yet.
      expect(component.storageSelection).toBe('');
      expect(component.softwareSelection).toBe('');
    });

    it('loads available resources from LoadResourcesService on init', () => {
      expect(loadResourcesServiceMock.getAllResources).toHaveBeenCalled();
      expect(component.availableResources).toEqual(sampleResources);
    });
  });

  // -------------------------------------------------------------------------
  // storageSubject$ subscription
  // -------------------------------------------------------------------------
  describe('storage subscription', () => {
    it('updates storageSelection when storageSubject$ emits', () => {
      resourcesServiceMock.storageSubject$.next('TB');
      expect(component.storageSelection).toBe('TB');
    });

    it('reflects the most recent storage emission', () => {
      resourcesServiceMock.storageSubject$.next('GB');
      resourcesServiceMock.storageSubject$.next('TB');
      expect(component.storageSelection).toBe('TB');
    });
  });

  // -------------------------------------------------------------------------
  // softwareSubject$ subscription
  // -------------------------------------------------------------------------
  describe('software subscription', () => {
    it('updates softwareSelection when softwareSubject$ emits', () => {
      resourcesServiceMock.softwareSubject$.next('internal');
      expect(component.softwareSelection).toBe('internal');
    });

    it('reflects the most recent software emission', () => {
      resourcesServiceMock.softwareSubject$.next('internal');
      resourcesServiceMock.softwareSubject$.next('external');
      expect(component.softwareSelection).toBe('external');
    });
  });

  // -------------------------------------------------------------------------
  // Wire-once guards
  // -------------------------------------------------------------------------
  describe('subscription guards', () => {
    it('wires the storage stream at most once', () => {
      const spy = jest.spyOn(resourcesServiceMock.storageSubject$, 'subscribe');
      // ngOnInit already subscribed; a second call must be a no-op.
      component.storageSubscribe();
      expect(spy).not.toHaveBeenCalled();
    });

    it('wires the software stream at most once', () => {
      const spy = jest.spyOn(resourcesServiceMock.softwareSubject$, 'subscribe');
      component.softwareSubscribe();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('completes the destroy$ subject', () => {
      const destroy$ = (component as any).destroy$;
      const nextSpy = jest.spyOn(destroy$, 'next');
      const completeSpy = jest.spyOn(destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('stops reacting to emissions after destroy', () => {
      component.ngOnDestroy();
      resourcesServiceMock.storageSubject$.next('TB');
      resourcesServiceMock.softwareSubject$.next('internal');
      expect(component.storageSelection).toBe('');
      expect(component.softwareSelection).toBe('');
    });
  });
});