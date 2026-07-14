import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';

import { TechnicalRequirementsComponent } from './technical-requirements.component';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
import { ResourcesService } from '../../shared/resources.service';
import { ChipsSplitterService } from 'src/app/shared/chips-splitter.service';
import { DMP_Meta } from '../../types/DMP.types';
import * as dmpService from 'src/app/shared/dmp.service';

describe('TechnicalRequirementsComponent', () => {
  let component: TechnicalRequirementsComponent;
  let fixture: ComponentFixture<TechnicalRequirementsComponent>;
  let resourcesServiceMock: any;

  // A fully-shaped DMP_Meta (parent always supplies getBlankDmp() overlaid with
  // loaded data). Individual tests override the fields they care about.
  const makeDmp = (overrides: Partial<DMP_Meta> = {}): DMP_Meta => ({
    title: '', startDate: '', dmpSearchable: 'yes',
    funding: { grant_source: 'Grant Number', grant_id: '' },
    projectDescription: '', organizations: [], contributors: [], keywords: [],
    dataSize: null, sizeUnit: 'GB', dataSizeDescription: '',
    softwareDevelopment: { development: 'no', softwareUse: 'both', softwareDatabase: 'no', softwareWebsite: 'no' },
    technicalResources: [], instruments: [],
    ethical_issues: { irb_number: '', ethical_issues_exist: 'no', ethical_issues_description: '', ethical_issues_report: '' },
    security_and_privacy: { data_sensitivity: [], cui: [] },
    dataDescription: '', dataCategories: [],
    preservationDescription: '', dataAccess: '', pathsURLs: [],
    ...overrides,
  } as DMP_Meta);

  beforeEach(async () => {
    resourcesServiceMock = {
      setStorageMessage: jest.fn(),
      storageSubject$: new Subject<string>(),
      softwareSubject$: new Subject<string>(),
      dataCategories$: new Subject<boolean>(),
      setDataCategories: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [TechnicalRequirementsComponent],
      providers: [
        FormBuilder,
        DropDownSelectService,
        ChipsSplitterService,
        { provide: ResourcesService, useValue: resourcesServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    // Many code paths call alert() on invalid data-size input; silence it.
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    fixture = TestBed.createComponent(TechnicalRequirementsComponent);
    component = fixture.componentInstance;
    // NOTE: no detectChanges() here — ngOnInit reads sizeUnit and calls
    // selDataSize(), which throws if the unit isn't resolvable. Tests that
    // need ngOnInit set a valid sizeUnit first (see the ngOnInit block).
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Form defaults
  // -------------------------------------------------------------------------
  describe('technicalRequirementsForm defaults', () => {
    it('initializes with empty controls', () => {
      expect(component.technicalRequirementsForm.value).toEqual({
        dataSize: '', sizeUnit: '', dataSizeDescription: '',
        development: '', softwareUse: '', softwareDatabase: '',
        softwareWebsite: '', technicalResources: [], instruments: [],
      });
    });

    it('is invalid initially due to required dataSize/sizeUnit/development', () => {
      expect(component.technicalRequirementsForm.valid).toBe(false);
    });

    it('rejects a non-numeric dataSize via the pattern validator', () => {
      component.technicalRequirementsForm.patchValue({ dataSize: 'abc' });
      expect(component.technicalRequirementsForm.get('dataSize')?.valid).toBe(false);
    });

    it('accepts a decimal numeric dataSize', () => {
      component.technicalRequirementsForm.patchValue({ dataSize: '12.5' });
      expect(component.technicalRequirementsForm.get('dataSize')?.valid).toBe(true);
    });

    it('initializes reactiveInstruments signal with a single empty string', () => {
      expect(component.reactiveInstruments()).toEqual(['']);
    });
  });

  // -------------------------------------------------------------------------
  // initialDMP_Meta input setter
  // -------------------------------------------------------------------------
  describe('initialDMP_Meta input setter', () => {
    it('populates the instruments table and technicalResources signal', () => {
      component.initialDMP_Meta = makeDmp({
        instruments: [
          { name: 'Microscope', description_url: 'http://x/scope' },
          { name: 'Spectrometer', description_url: 'http://x/spec' },
        ],
        technicalResources: ['HPC cluster', 'GPU node'],
      });

      expect(component.dmpInstrumentsTbl.length).toBe(2);
      expect(component.dmpInstrumentsTbl[0].name).toBe('Microscope');
      expect(component.dmpInstrumentsTbl[0].isEdit).toBe(false);
      expect(component.reactiveInstruments()).toEqual(['HPC cluster', 'GPU node']);
    });

    it('patches all software sub-fields when development is "yes"', () => {
      component.initialDMP_Meta = makeDmp({
        dataSize: '10', sizeUnit: 'TB', dataSizeDescription: 'Total',
        softwareDevelopment: { development: 'yes', softwareUse: 'internal', softwareDatabase: 'yes', softwareWebsite: 'no' },
      });

      const v = component.technicalRequirementsForm.value;
      expect(v.development).toBe('yes');
      expect(v.softwareUse).toBe('internal');
      expect(v.softwareDatabase).toBe('yes');
      expect(v.softwareWebsite).toBe('no');
    });

    it('blanks software sub-fields when development is "no" (forces re-selection)', () => {
      component.initialDMP_Meta = makeDmp({
        softwareDevelopment: { development: 'no', softwareUse: 'both', softwareDatabase: 'yes', softwareWebsite: 'yes' },
      });

      const v = component.technicalRequirementsForm.value;
      expect(v.development).toBe('no');
      expect(v.softwareUse).toBe('');
      expect(v.softwareDatabase).toBe('');
      expect(v.softwareWebsite).toBe('');
    });

    it('enables Clear/Remove buttons when instruments are loaded', () => {
      component.initialDMP_Meta = makeDmp({
        instruments: [{ name: 'A', description_url: 'u' }],
      });
      expect(component.disableClear).toBe(false);
      expect(component.disableRemove).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // ngOnInit
  // -------------------------------------------------------------------------
  describe('ngOnInit', () => {
    it('resolves the dataSize dropdown id from the loaded sizeUnit', () => {
      component.initialDMP_Meta = makeDmp({ dataSize: '5', sizeUnit: 'TB', softwareDevelopment: { development: 'no', softwareUse: '', softwareDatabase: '', softwareWebsite: '' } });
      fixture.detectChanges(); // triggers ngOnInit
      // 'TB' maps to id "3" in dataUnits
      expect(component.dataSize).toBe('3');
    });

    it('subscribes to dataCategories$ and toggles dataCategoryIsSet', () => {
      component.initialDMP_Meta = makeDmp({ sizeUnit: 'GB' });
      fixture.detectChanges();

      resourcesServiceMock.dataCategories$.next(true);
      expect(component.dataCategoryIsSet).toBe(true);

      resourcesServiceMock.dataCategories$.next(false);
      expect(component.dataCategoryIsSet).toBe(false);
    });

    it('wires the dataCategory stream at most once', () => {
      component.initialDMP_Meta = makeDmp({ sizeUnit: 'GB' });
      const spy = jest.spyOn(resourcesServiceMock.dataCategories$, 'subscribe');
      fixture.detectChanges();
      // ngOnInit calls dataCategorySubscribe once; calling again is a no-op.
      component.dataCategorySubscribe();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Software development radio cascades
  // -------------------------------------------------------------------------
  describe('software development toggles', () => {
    it('setSoftwareDev("no") clears the dependent software controls', () => {
      component.technicalRequirementsForm.patchValue({
        softwareUse: 'internal', softwareDatabase: 'yes', softwareWebsite: 'yes',
      });
      component.setSoftwareDev('no');
      const v = component.technicalRequirementsForm.value;
      expect(v.softwareUse).toBe('');
      expect(v.softwareDatabase).toBe('');
      expect(v.softwareWebsite).toBe('');
    });

    it('selSoftwareDev returns false when nothing is selected', () => {
      expect(component.selSoftwareDev('yes')).toBe(false);
    });

    it('selSoftwareDev reflects the current selection', () => {
      component.setSoftwareDev('yes');
      expect(component.selSoftwareDev('yes')).toBe(true);
      expect(component.selSoftwareDev('no')).toBe(false);
    });

    it('setSoftwareUse pushes the selection onto softwareSubject$', () => {
      const emitted: string[] = [];
      resourcesServiceMock.softwareSubject$.subscribe((v: string) => emitted.push(v));
      component.setSoftwareUse('external');
      expect(component.sftDev.softwareUse).toBe('external');
      expect(emitted).toContain('external');
    });
  });

  // -------------------------------------------------------------------------
  // Data size messaging
  // -------------------------------------------------------------------------
  describe('data size handling', () => {
    it('setDataSize alerts on non-numeric input and sends empty storage message', () => {
      component.technicalRequirementsForm.patchValue({ dataSize: 'notanumber' });
      component.setDataSize({});
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('numerical value greater than zero')
      );
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenLastCalledWith('');
    });

    it('setDataSize sends the tier when input is a positive number and no category is set', () => {
      component.dataSetSize = 'GB';
      component.dataCategoryIsSet = false;
      component.technicalRequirementsForm.patchValue({ dataSize: '100' });
      component.setDataSize({});
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenLastCalledWith('GB');
    });

    it('setDataSize does NOT message storage when a data category is already set', () => {
      component.dataSetSize = 'GB';
      component.dataCategoryIsSet = true;
      component.technicalRequirementsForm.patchValue({ dataSize: '100' });
      component.setDataSize({});
      expect(resourcesServiceMock.setStorageMessage).not.toHaveBeenCalled();
    });

    it('setDataSizeDescription patches the control', () => {
      component.setDataSizeDescription('Annual');
      expect(component.technicalRequirementsForm.value.dataSizeDescription).toBe('Annual');
    });
  });

  // -------------------------------------------------------------------------
  // Instrument table CRUD
  // -------------------------------------------------------------------------
  describe('instrument table operations', () => {
    let dateNowSpy: jest.SpyInstance;

    beforeEach(() => {
      // addRow ids come from Date.now(); force uniqueness across rapid calls.
      let counter = 1000;
      dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('addRow adds an instrument and mirrors it into the form', () => {
      component.dmpInstrument = { name: 'Laser', description_url: 'http://x/laser' };
      component.addRow();

      expect(component.dmpInstrumentsTbl.length).toBe(1);
      expect(component.dmpInstrumentsTbl[0].name).toBe('Laser');
      const formInstruments = component.technicalRequirementsForm.value.instruments as any[];
      expect(formInstruments.length).toBe(1);
      expect(formInstruments[0]).toEqual({ name: 'Laser', description_url: 'http://x/laser' });
      // table-only fields must not leak into the form
      expect(formInstruments[0].id).toBeUndefined();
      expect(formInstruments[0].isEdit).toBeUndefined();
    });

    it('addRow resets the staging fields afterward', () => {
      component.dmpInstrument = { name: 'Laser', description_url: 'http://x/laser' };
      component.addRow();
      expect(component.dmpInstrument).toEqual({ name: '', description_url: '' });
    });

    it('onDoneClick rejects an empty instrument name', () => {
      component.onDoneClick({ id: 1, name: '', description_url: 'u' });
      expect(component.errorMessage).toContain("name can't be empty");
    });

    it('onDoneClick rejects an empty description/URL', () => {
      component.onDoneClick({ id: 1, name: 'n', description_url: '' });
      expect(component.errorMessage).toContain("Description / URL can't be empty");
    });

    it('removeRow deletes the matching instrument when confirmed', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      component.dmpInstrument = { name: 'A', description_url: 'ua' };
      component.addRow();
      component.dmpInstrument = { name: 'B', description_url: 'ub' };
      component.addRow();

      const idToRemove = component.dmpInstrumentsTbl.find(r => r.name === 'A')!.id;
      component.removeRow(idToRemove);

      expect(component.dmpInstrumentsTbl.length).toBe(1);
      expect(component.dmpInstrumentsTbl[0].name).toBe('B');
    });

    it('removeRow does nothing when the confirm is cancelled', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(false);
      component.dmpInstrument = { name: 'A', description_url: 'ua' };
      component.addRow();
      component.removeRow(component.dmpInstrumentsTbl[0].id);
      expect(component.dmpInstrumentsTbl.length).toBe(1);
    });

    it('removeSelectedRows removes only rows flagged isSelected', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      component.dmpInstrument = { name: 'A', description_url: 'ua' };
      component.addRow();
      component.dmpInstrument = { name: 'B', description_url: 'ub' };
      component.addRow();

      const rowA = component.dmpInstrumentsTbl.find(r => r.name === 'A')!;
      (rowA as any).isSelected = true;
      component.removeSelectedRows();

      expect(component.dmpInstrumentsTbl.length).toBe(1);
      expect(component.dmpInstrumentsTbl[0].name).toBe('B');
    });

    it('clearTable empties the instruments table and form when confirmed', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      component.dmpInstrument = { name: 'A', description_url: 'ua' };
      component.addRow();

      component.clearTable();

      expect(component.dmpInstrumentsTbl).toEqual([]);
      expect(component.technicalRequirementsForm.value.instruments).toEqual([]);
      expect(component.disableClear).toBe(true);
      expect(component.disableRemove).toBe(true);
    });

    it('clearTable does nothing when cancelled', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(false);
      component.dmpInstrument = { name: 'A', description_url: 'ua' };
      component.addRow();
      component.clearTable();
      expect(component.dmpInstrumentsTbl.length).toBe(1);
    });

    it('checkInstrData enables Add only when both fields are filled', () => {
      component.dmpInstrument = { name: 'X', description_url: '' };
      component.checkInstrData({});
      expect(component.disableAdd).toBe(true);

      component.dmpInstrument = { name: 'X', description_url: 'Y' };
      component.checkInstrData({});
      expect(component.disableAdd).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Technical resources chips
  // -------------------------------------------------------------------------
  describe('technicalResources chips', () => {
    it('addReactiveInstruments splits on commas and dedupes into the signal + form', () => {
      const event = { value: 'HPC,GPU', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveInstruments(event);
      expect(component.reactiveInstruments()).toEqual(['', 'HPC', 'GPU']);
      expect(component.technicalRequirementsForm.value.technicalResources).toEqual(['', 'HPC', 'GPU']);
    });

    it('addReactiveInstruments splits on semicolons', () => {
      const event = { value: 'HPC;GPU', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveInstruments(event);
      expect(component.reactiveInstruments()).toEqual(['', 'HPC', 'GPU']);
    });

    it('addReactiveInstruments filters out empty/whitespace chips', () => {
      const event = { value: 'HPC,   ,GPU', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveInstruments(event);
      expect(component.reactiveInstruments()).toEqual(['', 'HPC', 'GPU']);
    });

    it('addReactiveInstruments dedupes values already present', () => {
      component.reactiveInstruments.set(['HPC']);
      const event = { value: 'HPC,TPU', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveInstruments(event);
      expect(component.reactiveInstruments()).toEqual(['HPC', 'TPU']);
    });

    it('addReactiveInstruments calls chipInput.clear()', () => {
      const clearSpy = jest.fn();
      const event = { value: 'HPC', chipInput: { clear: clearSpy } } as unknown as MatChipInputEvent;
      component.addReactiveInstruments(event);
      expect(clearSpy).toHaveBeenCalled();
    });

    it('removeReactiveInstruments removes a chip and syncs the form', () => {
      component.reactiveInstruments.set(['HPC', 'GPU']);
      component.technicalRequirementsForm.patchValue({ technicalResources: ['HPC', 'GPU'] });
      component.removeReactiveInstruments('HPC');
      expect(component.reactiveInstruments()).toEqual(['GPU']);
      expect(component.technicalRequirementsForm.value.technicalResources).toEqual(['GPU']);
    });

    it('removeReactiveInstruments leaves state unchanged for an unknown value', () => {
      component.reactiveInstruments.set(['HPC']);
      component.removeReactiveInstruments('nope');
      expect(component.reactiveInstruments()).toEqual(['HPC']);
    });

    it('onInputChange stores the pending input value', () => {
      component.onInputChange('typed');
      expect(component.instrumentsInputVal).toBe('typed');
    });

    it('onBlur triggers a chip add when input is non-empty', () => {
      component.chipInputEl = { nativeElement: {} } as any;
      component.chipInputDirective = { clear: jest.fn() } as any;
      const spy = jest.spyOn(component, 'triggerAddChip');
      component.instrumentsInputVal = 'HPC';
      component.onBlur(new FocusEvent('blur'));
      expect(spy).toHaveBeenCalled();
    });

    it('onBlur does nothing when input is empty', () => {
      const spy = jest.spyOn(component, 'triggerAddChip');
      component.instrumentsInputVal = '';
      component.onBlur(new FocusEvent('blur'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // valueChange / formReady outputs
  // -------------------------------------------------------------------------
  describe('valueChange output', () => {
    it('emits the current value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.softwareDevelopment).toEqual({
        development: '', softwareUse: '', softwareDatabase: '', softwareWebsite: '',
      });
      expect(emitted.instruments).toEqual([]);
      expect(emitted.technicalResources).toEqual([]);
    });

    it('maps flat controls into the nested softwareDevelopment object', async () => {
      component.technicalRequirementsForm.patchValue({
        development: 'yes', softwareUse: 'both', softwareDatabase: 'no', softwareWebsite: 'yes',
      });
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.softwareDevelopment).toEqual({
        development: 'yes', softwareUse: 'both', softwareDatabase: 'no', softwareWebsite: 'yes',
      });
    });
  });

  describe('formReady output', () => {
    it('emits the technicalRequirementsForm instance', async () => {
      const form = await firstValueFrom(component.formReady);
      expect(form).toBe(component.technicalRequirementsForm);
    });
  });

  // -------------------------------------------------------------------------
  // ngOnDestroy
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
  });
});