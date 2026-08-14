import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, Subject, BehaviorSubject, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { AppComponent } from './app.component';
import { AuthenticationService, StaffDirectoryService, ConfigurationService } from 'oarng';
import { SubmitDmpService } from './shared/submit-dmp.service';
import { DropDownSelectService } from './shared/drop-down-select.service';
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
    setexportFormat: jest.Mock;
    exportFormatSubject$: { next: jest.Mock };
    setButtonMessage: jest.Mock;
    buttonSubject$: { next: jest.Mock };
  };

  let dropDownSelectServiceMock: {
    getDropDownText: jest.Mock;
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
      setexportFormat: jest.fn(),
      exportFormatSubject$: { next: jest.fn() },
      setButtonMessage: jest.fn(),
      buttonSubject$: { next: jest.fn() }
    };

    dropDownSelectServiceMock = {
      getDropDownText: jest.fn()
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
        { provide: DropDownSelectService, useValue: dropDownSelectServiceMock },
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

  it('should update export format and enable download button', () => {
    dropDownSelectServiceMock.getDropDownText.mockReturnValue([
      { id: '1', format: 'PDF' }
    ]);

    component.exportType = '1';
    component.setExportFormat();

    expect(submitDmpServiceMock.setexportFormat).toHaveBeenCalledWith('PDF');
    expect(submitDmpServiceMock.exportFormatSubject$.next).toHaveBeenCalledWith('PDF');
    expect(submitDmpServiceMock.setButtonMessage).toHaveBeenCalledWith('Download');
    expect(submitDmpServiceMock.buttonSubject$.next).toHaveBeenCalledWith('Download');
    expect(component.disableDownloadBtn).toBe(false);
  });

  it('should not emit when export format lookup returns no match', () => {
    dropDownSelectServiceMock.getDropDownText.mockReturnValue([]);

    component.exportType = 'unknown';
    component.setExportFormat();

    expect(submitDmpServiceMock.setexportFormat).not.toHaveBeenCalled();
    expect(component.disableDownloadBtn).toBe(true);
  });

  it('should dispatch clicked button action', () => {
    component.dmpButtonClick('Save');

    expect(submitDmpServiceMock.setButtonMessage).toHaveBeenCalledWith('Save');
    expect(submitDmpServiceMock.buttonSubject$.next).toHaveBeenCalledWith('Save');
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