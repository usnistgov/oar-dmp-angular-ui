import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, Subject, BehaviorSubject, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { AppComponent } from './app.component';
import { AuthenticationService, StaffDirectoryService, ConfigurationService } from 'oarng';
import { SubmitDmpService, DmpButtonAction } from './shared/submit-dmp.service';
import { FormChangedService } from './shared/form-changed.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  let authServiceMock: {
    getCredentials: jest.Mock;
  };

  let staffDirectoryServiceMock: {
    setAuthToken: jest.Mock;
  };

  let submitDmpServiceMock: {
    setButtonMessage: jest.Mock;
    buttonSubject$: { next: jest.Mock };
  };

  let disableSaveBtnSubject: Subject<boolean>;
  let hasUnsavedChangesSubject: Subject<boolean>;
  let currentDmpIdSubject: BehaviorSubject<string | null>;

  let formChangedServiceMock: {
    disableSaveBtn$: Subject<boolean>;
    hasUnsavedChanges$: Subject<boolean>;
    currentDmpId$: BehaviorSubject<string | null>;
  };

  let dialogMock: { open: jest.Mock };
  let configServiceMock: { getConfig: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      getCredentials: jest.fn()
    };

    staffDirectoryServiceMock = {
      setAuthToken: jest.fn()
    };

    submitDmpServiceMock = {
      setButtonMessage: jest.fn(),
      buttonSubject$: { next: jest.fn() }
    };

    disableSaveBtnSubject = new Subject<boolean>();
    hasUnsavedChangesSubject = new Subject<boolean>();
    currentDmpIdSubject = new BehaviorSubject<string | null>(null);

    formChangedServiceMock = {
      disableSaveBtn$: disableSaveBtnSubject,
      hasUnsavedChanges$: hasUnsavedChangesSubject,
      currentDmpId$: currentDmpIdSubject
    };

    dialogMock = { open: jest.fn() };
    configServiceMock = {
      getConfig: jest.fn().mockReturnValue({ PDRDMP: 'http://localhost:9091/midas/dmp/mdm1' })
    };

    authServiceMock.getCredentials.mockReturnValue(
      of({
        token: 'abc123',
        userId: 'user1',
        userAttributes: { userName: 'Niksa' }
      })
    );

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: StaffDirectoryService, useValue: staffDirectoryServiceMock },
        { provide: SubmitDmpService, useValue: submitDmpServiceMock },
        { provide: FormChangedService, useValue: formChangedServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: ConfigurationService, useValue: configServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have title dmp_ui2', () => {
    expect(component.title).toBe('dmp_ui2');
  });

  // -------------------------------------------------------------------------
  // Header title fields — passed to <app-header> via titleLn1/titleLn2.
  // Without these, oarng's HeaderComponent falls back to its own default
  // ("MIDAS DATA PUBLISHING"), which is wrong for this app.
  // -------------------------------------------------------------------------
  describe('header title fields', () => {
    it('sets appVersion to "1.0"', () => {
      expect(component.appVersion).toBe('1.0');
    });

    it('sets titleLn1 to "MIDAS"', () => {
      expect(component.titleLn1).toBe('MIDAS');
    });

    it('sets titleLn2 to "DATA MANAGEMENT"', () => {
      expect(component.titleLn2).toBe('DATA MANAGEMENT');
    });
  });

  it('should set authenticated user message on init', () => {
    fixture.detectChanges();

    expect(component.readyDisplay).toBe(true);
    expect(component.authMessage).toBe('Welcome, Niksa');
    expect(staffDirectoryServiceMock.setAuthToken).toHaveBeenCalledWith('abc123');
  });

  it('should fall back to userId when userName is missing', () => {
    authServiceMock.getCredentials.mockReturnValue(
      of({
        token: 'abc123',
        userId: 'user1',
        userAttributes: {}
      })
    );

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.authMessage).toBe('Welcome, user1');
  });

  it('should set not logged in message when token is missing', () => {
    authServiceMock.getCredentials.mockReturnValue(
      of({
        token: null,
        userId: 'user1',
        userAttributes: { userName: 'Niksa' }
      })
    );

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.authMessage).toBe('You are not logged in.');
    expect(component.readyDisplay).toBe(true);
  });

  it('should handle 401 auth error', () => {
    authServiceMock.getCredentials.mockReturnValue(
      throwError(() => ({ status: 401, message: 'Unauthorized' }))
    );

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.authMessage).toBe('User Log-in failure');
    expect(component.readyDisplay).toBe(true);
  });

  it('should handle 500 auth error', () => {
    authServiceMock.getCredentials.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.authMessage).toBe('Unable to log in; authentication server error');
    expect(component.readyDisplay).toBe(true);
  });

  it('should handle generic auth communication error', () => {
    authServiceMock.getCredentials.mockReturnValue(
      throwError(() => ({ status: 400, message: 'Bad request' }))
    );

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.authMessage).toBe('Unable to log in; authentication server communication error');
    expect(component.readyDisplay).toBe(true);
  });

  // -------------------------------------------------------------------------
  // dmpButtonClick — dispatch to SubmitDmpService
  // -------------------------------------------------------------------------
  describe('dmpButtonClick', () => {
    it('dispatches a bare Save action', () => {
      component.dmpButtonClick('Save');

      expect(submitDmpServiceMock.setButtonMessage).toHaveBeenCalledWith({ action: 'Save', format: undefined });
      expect(submitDmpServiceMock.buttonSubject$.next).toHaveBeenCalledWith({ action: 'Save', format: undefined });
    });

    it('dispatches a Download action with the PDF format', () => {
      component.dmpButtonClick('Download', 'PDF');

      const expected: DmpButtonAction = { action: 'Download', format: 'PDF' };
      expect(submitDmpServiceMock.setButtonMessage).toHaveBeenCalledWith(expected);
      expect(submitDmpServiceMock.buttonSubject$.next).toHaveBeenCalledWith(expected);
    });

    it('dispatches a Download action with the Markdown format', () => {
      component.dmpButtonClick('Download', 'Markdown');

      expect(submitDmpServiceMock.buttonSubject$.next).toHaveBeenCalledWith({ action: 'Download', format: 'Markdown' });
    });

    it('dispatches a Download action with the JSON format', () => {
      component.dmpButtonClick('Download', 'JSON');

      expect(submitDmpServiceMock.buttonSubject$.next).toHaveBeenCalledWith({ action: 'Download', format: 'JSON' });
    });
  });

  // -------------------------------------------------------------------------
  // disableDownloadBtns — derived from currentDmpId + hasUnsavedChanges
  // -------------------------------------------------------------------------
  describe('disableDownloadBtns', () => {
    it('is true when no record has been saved yet (currentDmpId is null)', () => {
      fixture.detectChanges();
      expect(component.currentDmpId).toBeNull();
      expect(component.disableDownloadBtns).toBe(true);
    });

    it('is true when a record exists but has unsaved changes', () => {
      fixture.detectChanges();
      currentDmpIdSubject.next('dmp-abc');
      hasUnsavedChangesSubject.next(true);

      expect(component.disableDownloadBtns).toBe(true);
    });

    it('is false once a record has been saved and there are no unsaved changes', () => {
      fixture.detectChanges();
      currentDmpIdSubject.next('dmp-abc');
      hasUnsavedChangesSubject.next(false);

      expect(component.disableDownloadBtns).toBe(false);
    });

    it('flips back to true if changes are made after being saved', () => {
      fixture.detectChanges();
      currentDmpIdSubject.next('dmp-abc');
      hasUnsavedChangesSubject.next(false);
      expect(component.disableDownloadBtns).toBe(false);

      hasUnsavedChangesSubject.next(true);
      expect(component.disableDownloadBtns).toBe(true);
    });
  });

  it('should react to save button state changes', () => {
    component.saveButtonSubscribe();

    disableSaveBtnSubject.next(true);
    hasUnsavedChangesSubject.next(true);

    expect(component.disableSaveBtn).toBe(true);
    expect(component.hasUnsavedChanges).toBe(true);
  });

  it('should subscribe to form-change state during ngOnInit', () => {
    fixture.detectChanges(); // triggers ngOnInit

    disableSaveBtnSubject.next(true);
    hasUnsavedChangesSubject.next(true);

    expect(component.disableSaveBtn).toBe(true);
    expect(component.hasUnsavedChanges).toBe(true);
  });

  it('should re-enable save button when unsaved changes are emitted after a save', () => {
    fixture.detectChanges();

    // Simulate: record saved (save disabled), then edited (unsaved changes)
    disableSaveBtnSubject.next(true);
    expect(component.disableSaveBtn).toBe(true);

    hasUnsavedChangesSubject.next(true);
    disableSaveBtnSubject.next(false);

    expect(component.hasUnsavedChanges).toBe(true);
    expect(component.disableSaveBtn).toBe(false);
  });

  it('should stop reacting to emissions after destroy', () => {
    fixture.detectChanges();
    component.ngOnDestroy();

    disableSaveBtnSubject.next(true);
    hasUnsavedChangesSubject.next(true);

    expect(component.disableSaveBtn).toBe(false);
    expect(component.hasUnsavedChanges).toBe(false);
  });

  describe('currentDmpId and Share dialog', () => {
    it('should track currentDmpId from FormChangedService', () => {
      fixture.detectChanges();
      expect(component.currentDmpId).toBeNull();

      currentDmpIdSubject.next('dmp-abc');
      expect(component.currentDmpId).toBe('dmp-abc');

      currentDmpIdSubject.next(null);
      expect(component.currentDmpId).toBeNull();
    });

    it('should open dialog with correct data when currentDmpId is set', () => {
      fixture.detectChanges();
      currentDmpIdSubject.next('dmp-abc');

      component.openShareDialog();

      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            record: { id: 'dmp-abc', apiBase: 'http://localhost:9091/midas/dmp/mdm1' },
            title: 'Share my record'
          }),
          maxWidth: '95vw'
        })
      );
    });

    it('should not open dialog when currentDmpId is null', () => {
      fixture.detectChanges();
      expect(component.currentDmpId).toBeNull();

      component.openShareDialog();

      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('should stop tracking currentDmpId after destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();

      currentDmpIdSubject.next('dmp-after-destroy');
      expect(component.currentDmpId).toBeNull();
    });
  });
});