import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { firstValueFrom, take, toArray } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';

import { KeywordsComponent } from './keywords.component';
import { ChipsSplitterService } from 'src/app/shared/chips-splitter.service';
import { DMP_Meta } from '../../types/DMP.types';

describe('KeywordsComponent', () => {
  let component: KeywordsComponent;
  let fixture: ComponentFixture<KeywordsComponent>;
  let chipsSplitter: ChipsSplitterService;

  const mockDmp: Partial<DMP_Meta> = {
    keywords: ['genomics', 'proteomics']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeywordsComponent],
      providers: [FormBuilder, ChipsSplitterService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeywordsComponent);
    component = fixture.componentInstance;
    chipsSplitter = TestBed.inject(ChipsSplitterService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('keyWordsForm defaults', () => {
    it('should initialize with an empty keywords array', () => {
      expect(component.keyWordsForm.value).toEqual({ keywords: [] });
    });

    it('should initialize reactiveKeywords signal with a single empty string', () => {
      expect(component.reactiveKeywords()).toEqual(['']);
    });
  });

  describe('initialDMP_Meta input setter', () => {
    it('should patch the form with the provided keywords', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.keyWordsForm.value).toEqual({ keywords: ['genomics', 'proteomics'] });
    });

    it('should update the reactiveKeywords signal with the provided keywords', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.reactiveKeywords()).toEqual(['genomics', 'proteomics']);
    });
  });

  describe('addReactiveKeyword', () => {
    it('should split chips on commas using the real ChipsSplitterService', () => {
      const event = { value: 'genomics,proteomics', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(['', 'genomics', 'proteomics']);
    });

    it('should split chips on semicolons using the real ChipsSplitterService', () => {
      const event = { value: 'genomics;proteomics', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(['', 'genomics', 'proteomics']);
    });

    it('should trim whitespace from each chip after splitting on separators', () => {
      const event = { value: 'genomics, proteomics', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(['', 'genomics', 'proteomics']);
    });

    it('should trim whitespace-only chips down to empty strings and filter them out', () => {
      const event = { value: 'genomics,   ,proteomics', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(['', 'genomics', 'proteomics']);
    });

    it('should update the form control keywords to match the signal', () => {
      const event = { value: 'genomics', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.keyWordsForm.value.keywords).toEqual(['', 'genomics']);
    });

    it('should dedupe values already present in reactiveKeywords', () => {
      component.reactiveKeywords.set(['genomics']);
      const event = { value: 'genomics,ecology', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(['genomics', 'ecology']);
    });

    it('should filter out chips that are empty or whitespace-only after a separator', () => {
      const event = { value: 'genomics,,;  ', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(['', 'genomics']);
    });

    it('should not modify state when the trimmed input produces no usable chips', () => {
      const initial = component.reactiveKeywords();
      const event = { value: '   ', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(component.reactiveKeywords()).toEqual(initial);
    });

    it('should call chipInput.clear() after adding chips', () => {
      const clearSpy = jest.fn();
      const event = { value: 'genomics', chipInput: { clear: clearSpy } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should call splitChips with the trimmed raw event value', () => {
      const spy = jest.spyOn(chipsSplitter, 'splitChips');
      const event = { value: '  genomics  ', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      expect(spy).toHaveBeenCalledWith('genomics');
    });
  });

  describe('removeReactiveKeyword', () => {
    beforeEach(() => {
      component.reactiveKeywords.set(['genomics', 'proteomics']);
      component.keyWordsForm.patchValue({ keywords: ['genomics', 'proteomics'] });
    });

    it('should remove the specified keyword from the signal', () => {
      component.removeReactiveKeyword('genomics');
      expect(component.reactiveKeywords()).toEqual(['proteomics']);
    });

    it('should sync the form control after removal', () => {
      component.removeReactiveKeyword('genomics');
      expect(component.keyWordsForm.value.keywords).toEqual(['proteomics']);
    });

    it('should leave state unchanged when the keyword is not found', () => {
      component.removeReactiveKeyword('not-present');
      expect(component.reactiveKeywords()).toEqual(['genomics', 'proteomics']);
    });
  });

  describe('resetKeyWordsForm / clearKeywordsTable', () => {
    beforeEach(() => {
      component.keyWordsForm.setValue({ keywords: ['genomics'] });
    });

    it('should reset keywords to an empty array', () => {
      component.resetKeyWordsForm();
      expect(component.keyWordsForm.value).toEqual({ keywords: [] });
    });

    it('clearKeywordsTable should delegate to resetKeyWordsForm', () => {
      const spy = jest.spyOn(component, 'resetKeyWordsForm');
      component.clearKeywordsTable();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onInputChange / onBlur / triggerAddChip', () => {
    it('should update keywordsInputVal on input change', () => {
      component.onInputChange('genomics');
      expect(component.keywordsInputVal).toBe('genomics');
    });

    it('should trigger addReactiveKeyword on blur when input is non-empty', () => {
      component.chipInputEl = { nativeElement: {} } as any;
      component.chipInputDirective = { clear: jest.fn() } as any;
      const spy = jest.spyOn(component, 'triggerAddChip');
      component.keywordsInputVal = 'genomics';
      component.onBlur(new FocusEvent('blur'));
      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger addReactiveKeyword on blur when input is empty', () => {
      const spy = jest.spyOn(component, 'triggerAddChip');
      component.keywordsInputVal = '';
      component.onBlur(new FocusEvent('blur'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('triggerAddChip should build a mock event and call addReactiveKeyword, then clear keywordsInputVal', () => {
      const addSpy = jest.spyOn(component, 'addReactiveKeyword');
      component.chipInputEl = { nativeElement: {} } as any;
      component.chipInputDirective = { clear: jest.fn() } as any;
      component.keywordsInputVal = '  genomics  ';

      component.triggerAddChip();

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'genomics' })
      );
      expect(component.keywordsInputVal).toBe('');
    });
  });

  describe('valueChange output', () => {
    it('should emit the current form value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({ keywords: [] });
    });

    it('should emit updated values whenever the form changes', async () => {
      const emissions$ = component.valueChange.pipe(take(2), toArray());
      const emissionsPromise = firstValueFrom(emissions$);

      component.keyWordsForm.patchValue({ keywords: ['ecology'] });

      const emissions = await emissionsPromise;
      expect(emissions[0].keywords).toEqual([]);
      expect(emissions[1].keywords).toEqual(['ecology']);
    });

    it('should reflect keywords changes made via addReactiveKeyword', async () => {
      const event = { value: 'astronomy', chipInput: { clear: jest.fn() } } as unknown as MatChipInputEvent;
      component.addReactiveKeyword(event);
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.keywords).toEqual(['', 'astronomy']);
    });
  });

  describe('formReady output', () => {
    it('should emit the keyWordsForm instance', async () => {
      const emittedForm = await firstValueFrom(component.formReady);
      expect(emittedForm).toBe(component.keyWordsForm);
    });
  });
});