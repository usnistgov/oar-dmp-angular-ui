jest.mock('jspdf');
jest.mock('file-saver');
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import _ from 'lodash';

import { DmpFormComponent } from './dmp-form.component';
import { DmpService } from '../shared/dmp.service';
import { SubmitDmpService, DmpButtonAction } from '../shared/submit-dmp.service';
import { FormChangedService } from '../shared/form-changed.service';
import { UpdateNistContributorService } from '../shared/update-nist-contributor.service';
import { DmpExportService } from '../shared/dmp-export.service';

describe('DmpFormComponent', () => {
  let component: DmpFormComponent;
  let fixture: ComponentFixture<DmpFormComponent>;

  let dmpServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;
  let submitDmpServiceMock: any;
  let formChangedServiceMock: any;
  let peopleUpdatesMock: any;
  let exportServiceMock: any;

  let buttonSubject$: Subject<DmpButtonAction>;
  let updateNISTContrib$: Subject<any>;
  let updateOUs$: Subject<any>;

  // Mirrors DmpService.NewDmpRecord shape closely enough for component logic.
  const blankDmp = {
    title: '', startDate: '', dmpSearchable: 'yes',
    funding: { grant_source: 'Grant Number', grant_id: '' },
    projectDescription: '', organizations: [], contributors: [],
    keywords: [], dataSize: null, sizeUnit: 'GB', dataSizeDescription: '',
    softwareDevelopment: { development: 'no', softwareUse: 'both', softwareDatabase: 'no', softwareWebsite: 'no' },
    technicalResources: [], instruments: [],
    ethical_issues: { irb_number: '', ethical_issues_exist: 'no', ethical_issues_description: '', ethical_issues_report: '' },
    security_and_privacy: { data_sensitivity: [], cui: [] },
    dataDescription: '', dataCategories: [],
    preservationDescription: '', dataAccess: '', pathsURLs: []
  };

  beforeEach(async () => {
    buttonSubject$ = new Subject<DmpButtonAction>();
    updateNISTContrib$ = new Subject<any>();
    updateOUs$ = new Subject<any>();

    dmpServiceMock = {
      // For action === 'new', DmpService.fetchDMP returns the DMP_Meta directly (of(this.NewDmpRecord)).
      fetchDMP: jest.fn().mockImplementation((action: string) => {
        if (action === 'new') return of(_.cloneDeep(blankDmp));
        // For edit, the real API response is wrapped as { data, name } via HttpClient.get(...).
        return of({ data: {}, name: 'Test DMP' });
      }),
      aclsPermission: jest.fn().mockReturnValue(of(true)),
      getBlankDmp: jest.fn().mockReturnValue(_.cloneDeep(blankDmp)),
      updateDMP: jest.fn().mockReturnValue(of({ id: '123' })),
      createDMP: jest.fn().mockReturnValue(of({ id: '456' }))
    };

    routerMock = {
      navigate: jest.fn()
    };

    activatedRouteMock = {
      snapshot: { paramMap: { get: jest.fn().mockReturnValue('123') } },
      data: of({ action: 'edit' })
    };

    submitDmpServiceMock = {
      buttonSubject$: buttonSubject$.asObservable()
    };

    formChangedServiceMock = {
      disableSaveBtn$: { next: jest.fn() },
      hasUnsavedChanges$: { next: jest.fn() },
      currentDmpId$: { next: jest.fn() }
    };

    peopleUpdatesMock = {
      updateNISTContrib$: updateNISTContrib$.asObservable(),
      updateOUs$: updateOUs$.asObservable()
    };

    exportServiceMock = {
      export: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [DmpFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        FormBuilder,
        { provide: DmpService, useValue: dmpServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: SubmitDmpService, useValue: submitDmpServiceMock },
        { provide: FormChangedService, useValue: formChangedServiceMock },
        { provide: UpdateNistContributorService, useValue: peopleUpdatesMock },
        { provide: DmpExportService, useValue: exportServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DmpFormComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - new DMP flow', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'new' });
    });

    it('should call fetchDMP with "new" and set initialDMP/dmp directly from the returned record', () => {
      fixture.detectChanges();
      expect(dmpServiceMock.fetchDMP).toHaveBeenCalledWith('new', null);
      expect(component.dmp).toEqual(blankDmp);
      expect(component.initialDMP).toEqual(blankDmp);
      expect(component.canWrite).toBe(true);
      expect(component.isAdmin).toBe(false);
      expect(component.canDelete).toBe(false);
    });

    it('should not call aclsPermission for a new record', () => {
      fixture.detectChanges();
      expect(dmpServiceMock.aclsPermission).not.toHaveBeenCalled();
    });

    it('should navigate to error page if initNewDmp fails', () => {
      dmpServiceMock.fetchDMP.mockReturnValue(throwError(() => ({ status: 500, statusText: 'Server Error', message: 'boom' })));
      fixture.detectChanges();
      expect(routerMock.navigate).toHaveBeenCalledWith(['error', expect.objectContaining({ dmpError: expect.any(String) })]);
    });
  });

  describe('ngOnInit - existing DMP flow', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'edit' });
    });

    it('should set nameDisabled and nameClass for edit action', () => {
      fixture.detectChanges();
      expect(component.nameDisabled).toBe(true);
      expect(component.nameClass).toBe('mnemonicNameDisabled');
    });

    it('should load dmp (merged over blank template), name, and permissions via forkJoin when read access is granted', () => {
      dmpServiceMock.aclsPermission.mockReturnValue(of(true));
      dmpServiceMock.fetchDMP.mockReturnValue(of({ data: { title: 'Existing Title' }, name: 'My DMP' }));

      fixture.detectChanges();

      expect(component.name.value).toBe('My DMP');
      expect(component.dmp).toEqual(expect.objectContaining({ title: 'Existing Title' }));
      expect(component.canWrite).toBe(true);
      expect(component.isAdmin).toBe(true);
      expect(component.canDelete).toBe(true);
      expect(dmpServiceMock.getBlankDmp).toHaveBeenCalled();
    });

    it('should redirect to error page and skip loading when read access is denied', () => {
      dmpServiceMock.aclsPermission.mockReturnValue(of(false));
      fixture.detectChanges();
      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['error', expect.objectContaining({ dmpError: expect.stringContaining('read privileges') })]
      );
      expect(dmpServiceMock.fetchDMP).not.toHaveBeenCalled();
    });

    it('should navigate to error page if the forkJoin load fails', () => {
      dmpServiceMock.aclsPermission.mockReturnValueOnce(of(true));
      dmpServiceMock.fetchDMP.mockReturnValue(throwError(() => ({ status: 404, statusText: 'Not Found', message: 'not found' })));
      fixture.detectChanges();
      expect(routerMock.navigate).toHaveBeenCalledWith(['error', expect.objectContaining({ dmpError: expect.any(String) })]);
    });
  });

  describe('addChildForm', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
    });

    it('should register a child form control on dmpFormGrp', () => {
      const dummyGroup = new FormBuilder().group({ foo: 'bar' });
      component.addChildForm('basicInfo' as any, dummyGroup as any);
      expect(component.dmpFormGrp.get('basicInfo')).toBeTruthy();
    });
  });

  describe('patchDMP / save button state', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
    });

    it('should throw if dmp is missing when patching', () => {
      component.dmp = undefined;
      expect(() => component.patchDMP({} as any)).toThrowError('Missing DMP in patch');
    });

    it('should merge patch into dmp and enable save button when values differ from snapshot', () => {
      component.patchDMP({ title: 'Changed Title' } as any);
      expect(component.dmp).toEqual(expect.objectContaining({ title: 'Changed Title' }));
      expect(formChangedServiceMock.disableSaveBtn$.next).toHaveBeenCalledWith(false);
      expect(formChangedServiceMock.hasUnsavedChanges$.next).toHaveBeenCalledWith(true);
      expect(component.formSaved).toBe(false);
    });

    it('should keep save button disabled when patch equals the loaded snapshot', () => {
      const snapshot = _.cloneDeep(component.dmp);
      component.patchDMP(snapshot as any);
      expect(formChangedServiceMock.disableSaveBtn$.next).toHaveBeenCalledWith(true);
      expect(component.formSaved).toBe(true);
    });
  });

  describe('formButtonSubscribe', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
    });

    it('should call saveDraft when a Save action is emitted and canWrite is true', () => {
      const saveSpy = jest.spyOn(component, 'saveDraft');
      component.canWrite = true;
      buttonSubject$.next({ action: 'Save' });
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should alert and not save when a Save action is emitted without write access', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const saveSpy = jest.spyOn(component, 'saveDraft');
      component.canWrite = false;
      buttonSubject$.next({ action: 'Save' });
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("don't have write privileges"));
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should export immediately when a Download action arrives with a format', () => {
      component.dmp = _.cloneDeep(blankDmp) as any;
      buttonSubject$.next({ action: 'Download', format: 'PDF' });
      expect(exportServiceMock.export).toHaveBeenCalledWith(component.dmp, 'PDF');
    });

    it('should export using whatever format is supplied on each Download click', () => {
      component.dmp = _.cloneDeep(blankDmp) as any;
      buttonSubject$.next({ action: 'Download', format: 'Markdown' });
      expect(exportServiceMock.export).toHaveBeenLastCalledWith(component.dmp, 'Markdown');

      buttonSubject$.next({ action: 'Download', format: 'JSON' });
      expect(exportServiceMock.export).toHaveBeenLastCalledWith(component.dmp, 'JSON');
    });

    it('should log an error and not export when a Download action arrives with no format', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      buttonSubject$.next({ action: 'Download' });
      expect(exportServiceMock.export).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('without a format'));
    });
  });

  describe('autoSaveSubscribe', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
      component.canWrite = true;
    });

    it('should trigger saveDraft once when an updateNISTContrib$ indicator fires', fakeAsync(() => {
      const saveSpy = jest.spyOn(component, 'saveDraft').mockImplementation(() => {});
      component.patchDMP({ title: 'trigger autosave wiring' } as any);

      updateNISTContrib$.next({ isUpdated: true });
      tick(60);

      expect(saveSpy).toHaveBeenCalled();
    }));

    it('should ignore indicators where isUpdated is false', fakeAsync(() => {
      const saveSpy = jest.spyOn(component, 'saveDraft').mockImplementation(() => {});
      component.patchDMP({ title: 'trigger autosave wiring' } as any);

      updateNISTContrib$.next({ isUpdated: false });
      tick(60);

      expect(saveSpy).not.toHaveBeenCalled();
    }));

    it('should debounce two rapid indicators (contrib + OU) into a single saveDraft call', fakeAsync(() => {
      const saveSpy = jest.spyOn(component, 'saveDraft').mockImplementation(() => {});
      component.patchDMP({ title: 'trigger autosave wiring' } as any);

      updateNISTContrib$.next({ isUpdated: true });
      updateOUs$.next({ isUpdated: true });
      tick(60);

      expect(saveSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('saveDraft', () => {
    beforeEach(() => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
    });

    it('should alert if dmp is not loaded', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.dmp = undefined;
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('form data is not loaded'));
    });

    it('should alert if record name is empty', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('');
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('DMP Short Name'));
    });

    it('should call createDMP when id is null (new record)', () => {
      component.id = null;
      component.name.setValue('New Record');
      component.saveDraft();
      expect(dmpServiceMock.createDMP).toHaveBeenCalledWith(component.dmp, 'New Record');
      expect(routerMock.navigate).toHaveBeenCalledWith(['edit', '456']);
    });

    it('should call updateDMP when id exists and action is not "new"', () => {
      component.id = '789';
      component.action = 'edit';
      component.name.setValue('Existing Record');
      component.saveDraft();
      expect(dmpServiceMock.updateDMP).toHaveBeenCalledWith(component.dmp, '789');
      expect(routerMock.navigate).toHaveBeenCalledWith(['edit', '789']);
    });

    it('should show success alert on user-initiated save', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.id = '789';
      component.action = 'edit';
      component.name.setValue('Existing Record');
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith('Successfully saved DMP record');
    });

    it('should suppress the success alert when autosave triggered the save', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.id = '789';
      component.action = 'edit';
      component.name.setValue('Existing Record');
      (component as any).autoSaveInProgress = true;
      component.saveDraft();
      expect(alertSpy).not.toHaveBeenCalledWith('Successfully saved DMP record');
    });

    it('should navigate to error page when updateDMP fails', () => {
      dmpServiceMock.updateDMP.mockReturnValue(throwError(() => ({ message: 'update failed' })));
      component.id = '789';
      component.action = 'edit';
      component.name.setValue('Existing Record');
      component.saveDraft();
      expect(routerMock.navigate).toHaveBeenCalledWith(['error', expect.objectContaining({ dmpError: expect.any(String) })]);
    });

    it('should navigate to error page when createDMP fails', () => {
      dmpServiceMock.createDMP.mockReturnValue(throwError(() => ({ message: 'create failed' })));
      component.id = null;
      component.name.setValue('New Record');
      component.saveDraft();
      expect(routerMock.navigate).toHaveBeenCalledWith(['error', expect.objectContaining({ dmpError: expect.any(String) })]);
    });

    it('should alert if title is empty', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('New Record');
      component.dmp = { ..._.cloneDeep(blankDmp), title: '' } as any;
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Title field'));
      expect(dmpServiceMock.createDMP).not.toHaveBeenCalled();
    });

    it('should not alert about title when title is whitespace-trimmed to non-empty content', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('New Record');
      component.dmp = {
        ..._.cloneDeep(blankDmp),
        title: 'Valid Title',
        contributors: [{
          firstName: 'Ada', lastName: 'Lovelace', orcid: '', emailAddress: '',
          groupOrgID: 1, groupNumber: '1', groupName: 'G',
          divisionOrgID: 1, divisionNumber: '1', divisionName: 'D',
          ouOrgID: 1, ouNumber: '1', ouName: 'OU',
          primary_contact: 'Yes', institution: 'NIST', role: 'Project Leader',
          peopleID: 1,
        }],
      } as any;
      component.saveDraft();
      expect(alertSpy).not.toHaveBeenCalledWith(expect.stringContaining('Title field'));
      expect(dmpServiceMock.createDMP).toHaveBeenCalled();
    });

    it('should alert if title is only whitespace', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('New Record');
      component.dmp = { ..._.cloneDeep(blankDmp), title: '   ' } as any;
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Title field'));
    });

    it('should alert if no NIST primary contact exists', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('New Record');
      component.dmp = {
        ..._.cloneDeep(blankDmp),
        title: 'Valid Title',
        contributors: [],
      } as any;
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Primary Contact'));
      expect(dmpServiceMock.createDMP).not.toHaveBeenCalled();
    });

    it('should alert if contributors exist but none are a NIST primary contact', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('New Record');
      component.dmp = {
        ..._.cloneDeep(blankDmp),
        title: 'Valid Title',
        contributors: [
          // External primary contact: institution is not 'NIST', so this must not count.
          {
            firstName: 'Marie', lastName: 'Curie', orcid: '', emailAddress: 'marie@example.com',
            groupOrgID: 0, groupNumber: '', groupName: '',
            divisionOrgID: 0, divisionNumber: '', divisionName: '',
            ouOrgID: 0, ouNumber: '', ouName: '',
            primary_contact: 'Yes', institution: 'Sorbonne', role: 'Project Member',
            peopleID: -1,
          },
          // NIST contributor, but not marked as primary contact.
          {
            firstName: 'Ada', lastName: 'Lovelace', orcid: '', emailAddress: 'ada@nist.gov',
            groupOrgID: 1, groupNumber: '1', groupName: 'G',
            divisionOrgID: 1, divisionNumber: '1', divisionName: 'D',
            ouOrgID: 1, ouNumber: '1', ouName: 'OU',
            primary_contact: 'No', institution: 'NIST', role: 'Project Member',
            peopleID: 2,
          },
        ],
      } as any;
      component.saveDraft();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Primary Contact'));
      expect(dmpServiceMock.createDMP).not.toHaveBeenCalled();
    });

    it('should proceed with save when a NIST contributor is marked as primary contact', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.name.setValue('New Record');
      component.dmp = {
        ..._.cloneDeep(blankDmp),
        title: 'Valid Title',
        contributors: [{
          firstName: 'Ada', lastName: 'Lovelace', orcid: '', emailAddress: 'ada@nist.gov',
          groupOrgID: 1, groupNumber: '1', groupName: 'G',
          divisionOrgID: 1, divisionNumber: '1', divisionName: 'D',
          ouOrgID: 1, ouNumber: '1', ouName: 'OU',
          primary_contact: 'Yes', institution: 'NIST', role: 'Project Leader',
          peopleID: 1,
        }],
      } as any;
      component.saveDraft();
      expect(alertSpy).not.toHaveBeenCalledWith(expect.stringContaining('Title field'));
      expect(alertSpy).not.toHaveBeenCalledWith(expect.stringContaining('Primary Contact'));
      expect(dmpServiceMock.createDMP).toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('should delegate to saveDraft', () => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
      const saveSpy = jest.spyOn(component, 'saveDraft').mockImplementation(() => {});
      component.onSubmit();
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
      const destroy$ = (component as any).destroy$;
      const nextSpy = jest.spyOn(destroy$, 'next');
      const completeSpy = jest.spyOn(destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('currentDmpId$ propagation', () => {
    it('should push the route id into FormChangedService on init', () => {
      activatedRouteMock.snapshot.paramMap.get.mockReturnValue('dmp-999');
      activatedRouteMock.data = of({ action: 'edit' });
      fixture.detectChanges();
      expect(formChangedServiceMock.currentDmpId$.next).toHaveBeenCalledWith('dmp-999');
    });

    it('should push null into FormChangedService on destroy', () => {
      activatedRouteMock.data = of({ action: 'new' });
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(formChangedServiceMock.currentDmpId$.next).toHaveBeenCalledWith(null);
    });
  });
});