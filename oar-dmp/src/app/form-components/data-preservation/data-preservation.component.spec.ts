import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { firstValueFrom, take, toArray } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';

import { DataPreservationComponent } from './data-preservation.component';
import { ChipsSplitterService } from 'src/app/shared/chips-splitter.service';
import { DMP_Meta } from '../../types/DMP.types';

describe('DataPreservationComponent', () => {
  let component: DataPreservationComponent;
  let fixture: ComponentFixture<DataPreservationComponent>;
  let chipsSplitter: ChipsSplitterService;

  const mockDmp: Partial<DMP_Meta> = {
    preservationDescription: 'Data will be preserved for 10 years.',
    dataAccess: 'Public',
    pathsURLs: ['https://example.com/data1', 'https://example.com/data2']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataPreservationComponent],
      providers: [FormBuilder, ChipsSplitterService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataPreservationComponent);
    component = fixture.componentInstance;
    chipsSplitter = TestBed.inject(ChipsSplitterService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('preservationForm defaults', () => {
    it('should initialize with empty description, access, and pathsURLs', () => {
      expect(component.preservationForm.value).toEqual({
        preservationDescription: '',
        dataAccess: '',
        pathsURLs: []
      });
    });

    it('should initialize reactivePathsURLs signal with a single empty string', () => {
      expect(component.reactivePathsURLs()).toEqual(['']);
    });
  });

  describe('initialDMP_Meta input setter', () => {
    it('should patch the form with the provided preservation data', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.preservationForm.value).toEqual({
        preservationDescription: 'Data will be preserved for 10 years.',
        dataAccess: 'Public',
        pathsURLs: ['https://example.com/data1', 'https://example.com/data2']
      });
    });

    it('should update the reactivePathsURLs signal with the provided pathsURLs', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.reactivePathsURLs()).toEqual([
        'https://example.com/data1',
        'https://example.com/data2'
      ]);
    });
  });

  describe('addReactivePathsURLs', () => {
    it('should split chips on commas using the real ChipsSplitterService', () => {
      const event = { value: 'https://a.com,https://b.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(['', 'https://a.com', 'https://b.com']);
    });

    it('should split chips on semicolons using the real ChipsSplitterService', () => {
      const event = { value: 'https://a.com;https://b.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(['', 'https://a.com', 'https://b.com']);
    });

    it('should trim whitespace from each chip after splitting on separators', () => {
      const event = { value: 'https://a.com, https://b.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(['', 'https://a.com', 'https://b.com']);
    });

    it('should trim whitespace-only chips down to empty strings and filter them out', () => {
      const event = { value: 'https://a.com,   ,https://b.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(['', 'https://a.com', 'https://b.com']);
    });

    it('should update the form control pathsURLs to match the signal', () => {
      const event = { value: 'https://a.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.preservationForm.value.pathsURLs).toEqual(['', 'https://a.com']);
    });

    it('should dedupe values already present in reactivePathsURLs', () => {
      component.reactivePathsURLs.set(['https://a.com']);
      const event = { value: 'https://a.com,https://c.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(['https://a.com', 'https://c.com']);
    });

    it('should filter out chips that are empty or whitespace-only after a separator', () => {
      const event = { value: 'https://a.com,,;  ', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(['', 'https://a.com']);
    });

    it('should not modify state when the trimmed input produces no usable chips', () => {
      const initial = component.reactivePathsURLs();
      const event = { value: '   ', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(component.reactivePathsURLs()).toEqual(initial);
    });

    it('should call chipInput.clear() after adding chips', () => {
      const clearSpy = jest.fn();
      const event = { value: 'https://a.com', chipInput: { clear: clearSpy } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should call splitChips with the trimmed raw event value', () => {
      const spy = jest.spyOn(chipsSplitter, 'splitChips');
      const event = { value: '  https://a.com  ', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      expect(spy).toHaveBeenCalledWith('https://a.com');
    });
  });

  describe('removeReactivePathsURLs', () => {
    beforeEach(() => {
      component.reactivePathsURLs.set(['https://a.com', 'https://b.com']);
      component.preservationForm.patchValue({ pathsURLs: ['https://a.com', 'https://b.com'] });
    });

    it('should remove the specified keyword from the signal', () => {
      component.removeReactivePathsURLs('https://a.com');
      expect(component.reactivePathsURLs()).toEqual(['https://b.com']);
    });

    it('should sync the form control after removal', () => {
      component.removeReactivePathsURLs('https://a.com');
      expect(component.preservationForm.value.pathsURLs).toEqual(['https://b.com']);
    });

    it('should leave state unchanged when the keyword is not found', () => {
      component.removeReactivePathsURLs('https://not-present.com');
      expect(component.reactivePathsURLs()).toEqual(['https://a.com', 'https://b.com']);
    });
  });

  describe('resetTable / clearTable', () => {
    beforeEach(() => {
      component.preservationForm.setValue({
        preservationDescription: 'Keep this text',
        dataAccess: 'Restricted',
        pathsURLs: ['https://a.com']
      });
    });

    it('should clear pathsURLs while preserving description and dataAccess', () => {
      component.resetTable();
      expect(component.preservationForm.value).toEqual({
        preservationDescription: 'Keep this text',
        dataAccess: 'Restricted',
        pathsURLs: []
      });
    });

    it('clearTable should delegate to resetTable', () => {
      const spy = jest.spyOn(component, 'resetTable');
      component.clearTable();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onInputChange / onBlur / triggerAddChip', () => {
    it('should update pathsInputVal on input change', () => {
      component.onInputChange('https://typed.com');
      expect(component.pathsInputVal).toBe('https://typed.com');
    });

    it('should trigger addReactivePathsURLs on blur when input is non-empty', () => {
      component.chipInputEl = { nativeElement: {} } as any;
      component.chipInputDirective = { clear: jest.fn() } as any;
      const spy = jest.spyOn(component, 'triggerAddChip');
      component.pathsInputVal = 'https://typed.com';
      component.onBlur(new FocusEvent('blur'));
      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger addReactivePathsURLs on blur when input is empty', () => {
      const spy = jest.spyOn(component, 'triggerAddChip');
      component.pathsInputVal = '';
      component.onBlur(new FocusEvent('blur'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('triggerAddChip should build a mock event and call addReactivePathsURLs, then clear pathsInputVal', () => {
      const addSpy = jest.spyOn(component, 'addReactivePathsURLs');
      component.chipInputEl = { nativeElement: {} } as any;
      component.chipInputDirective = { clear: jest.fn() } as any;
      component.pathsInputVal = '  https://typed.com  ';

      component.triggerAddChip();

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'https://typed.com' })
      );
      expect(component.pathsInputVal).toBe('');
    });
  });

  describe('valueChange output', () => {
    it('should emit the current form value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({
        preservationDescription: '',
        dataAccess: '',
        pathsURLs: []
      });
    });

    it('should emit updated values whenever the form changes', async () => {
      const emissions$ = component.valueChange.pipe(take(2), toArray());
      const emissionsPromise = firstValueFrom(emissions$);

      component.preservationForm.patchValue({ dataAccess: 'Private' });

      const emissions = await emissionsPromise;
      expect(emissions[0].dataAccess).toBe('');
      expect(emissions[1].dataAccess).toBe('Private');
    });

    it('should reflect pathsURLs changes made via addReactivePathsURLs', async () => {
      const event = { value: 'https://z.com', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactivePathsURLs(event);
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.pathsURLs).toEqual(['', 'https://z.com']);
    });
  });

  describe('formReady output', () => {
    it('should emit the preservationForm instance', async () => {
      const emittedForm = await firstValueFrom(component.formReady);
      expect(emittedForm).toBe(component.preservationForm);
    });
  });
});