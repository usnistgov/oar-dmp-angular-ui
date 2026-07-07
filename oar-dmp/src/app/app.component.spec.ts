import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthenticationService, StaffDirectoryService } from 'oarng';
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

  let formChangedServiceMock: {
    disableSaveBtn$: Subject<boolean>;
    hasUnsavedChanges$: Subject<boolean>;
  };

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

    formChangedServiceMock = {
      disableSaveBtn$: disableSaveBtnSubject,
      hasUnsavedChanges$: hasUnsavedChangesSubject
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
        { provide: FormChangedService, useValue: formChangedServiceMock }
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

  it('should set not logged in message when token is missing', async () => {
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

    expect(component.authMessage).toBe('Unable to log in; authentication server communtication error');
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

  it('should publish clicked button text', () => {
    const event = {
      currentTarget: {
        innerText: 'Save'
      }
    };

    component.dmpButtonClick(event);

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

  it('should subscribe only once to disableSaveBtn$', () => {
    const firstSubscription = component.formChangedSubscription;

    component.saveButtonSubscribe();
    const secondSubscription = component.formChangedSubscription;

    component.saveButtonSubscribe();
    const thirdSubscription = component.formChangedSubscription;

    expect(secondSubscription).toBe(thirdSubscription);
    expect(firstSubscription).toBe(secondSubscription);
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

  it('should subscribe to save button state during ngOnInit', () => {
    fixture.detectChanges(); // triggers ngOnInit

    disableSaveBtnSubject.next(true);
    expect(component.disableSaveBtn).toBe(true);
  });
});