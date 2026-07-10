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
import { SubmitDmpService } from '../shared/submit-dmp.service';
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

  let buttonSubject$: Subject<string>;
  let exportFormatSubject$: Subject<string>;
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
    buttonSubject$ = new Subject<string>();
    exportFormatSubject$ = new Subject<string>();
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
      buttonSubject$: buttonSubject$.asObservable(),
      exportFormatSubject$: exportFormatSubject$.asObservable()
    };

    formChangedServiceMock = {
      disableSaveBtn$: { next: jest.fn() },
      hasUnsavedChanges$: { next: jest.fn() }
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

    it('should call saveDraft when "Save" is emitted and canWrite is true', () => {
      const saveSpy = jest.spyOn(component, 'saveDraft');
      component.canWrite = true;
      buttonSubject$.next('Save');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should alert and not save when "Save" is emitted without write access', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const saveSpy = jest.spyOn(component, 'saveDraft');
      component.canWrite = false;
      buttonSubject$.next('Save');
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("don't have write privileges"));
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should alert when downloading without selecting an export format', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.dmpExportFormatType = '';
      buttonSubject$.next('Download');
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('export format'));
      expect(exportServiceMock.export).not.toHaveBeenCalled();
    });

    it('should alert when downloading with unsaved changes', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      component.dmpExportFormatType = 'pdf';
      component.formSaved = false;
      buttonSubject$.next('Download');
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('save changes'));
      expect(exportServiceMock.export).not.toHaveBeenCalled();
    });

    it('should export when format selected, form saved, and action is not "new"', () => {
      component.dmpExportFormatType = 'pdf';
      component.formSaved = true;
      component.action = 'edit';
      buttonSubject$.next('Download');
      expect(exportServiceMock.export).toHaveBeenCalledWith(component.dmp, 'pdf');
    });

    it('should not export twice for a freshly created record (action === "new")', () => {
      component.dmpExportFormatType = 'pdf';
      component.formSaved = true;
      component.action = 'new';
      buttonSubject$.next('Download');
      expect(exportServiceMock.export).not.toHaveBeenCalled();
    });

    it('should track selected export format from exportFormatSubject$', () => {
      exportFormatSubject$.next('json');
      expect(component.dmpExportFormatType).toBe('json');
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
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Record name is empty'));
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
});