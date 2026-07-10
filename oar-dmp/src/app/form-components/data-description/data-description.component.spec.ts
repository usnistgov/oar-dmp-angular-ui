import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Subject, firstValueFrom, take, toArray } from 'rxjs';

import { DataDescriptionComponent } from './data-description.component';
import { ResourcesService } from '../../shared/resources.service';
import { DMP_Meta } from '../../types/DMP.types';

describe('DataDescriptionComponent', () => {
  let component: DataDescriptionComponent;
  let fixture: ComponentFixture<DataDescriptionComponent>;
  let resourcesServiceMock: any;

  const mockDmp: Partial<DMP_Meta> = {
    dataDescription: 'Some description of the data.',
    dataCategories: ['Publishable', 'Working']
  };

  beforeEach(async () => {
    resourcesServiceMock = {
      setStorageMessage: jest.fn(),
      storageSubject$: new Subject<string>(),
      setDataCategories: jest.fn(),
      dataCategories$: new Subject<boolean>()
    };

    await TestBed.configureTestingModule({
      declarations: [DataDescriptionComponent],
      providers: [
        FormBuilder,
        { provide: ResourcesService, useValue: resourcesServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('availableCategories', () => {
    it('should have exactly 4 categories in the fixed positional order the template depends on', () => {
      expect(component.availableCategories).toEqual([
        { id: 0, name: 'Published Results and SRD' },
        { id: 2, name: 'Publishable' },
        { id: 3, name: 'Working' },
        { id: 4, name: 'Derived' }
      ]);
    });
  });

  describe('dataDescriptionForm defaults', () => {
    it('should initialize with empty description and no selected categories', () => {
      expect(component.dataDescriptionForm.value).toEqual({
        dataDescription: '',
        dataCategories: []
      });
    });
  });

  describe('initialDMP_Meta input setter', () => {
    it('should patch the form with the provided description and categories', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.dataDescriptionForm.value).toEqual({
        dataDescription: 'Some description of the data.',
        dataCategories: ['Publishable', 'Working']
      });
    });

    it('should store the provided categories as initialCategories', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.initialCategories).toEqual(['Publishable', 'Working']);
    });

    it('should default dataCategories to an empty array when none are provided', () => {
      component.initialDMP_Meta = { dataDescription: 'No categories' } as DMP_Meta;
      expect(component.dataDescriptionForm.value.dataCategories).toEqual([]);
      expect(component.initialCategories).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should call setStorageTier for each initial category to check boxes and notify the resource panel', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      const spy = jest.spyOn(component, 'setStorageTier');
      component.ngOnInit();

      expect(spy).toHaveBeenCalledWith('Publishable', true);
      expect(spy).toHaveBeenCalledWith('Working', true);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should do nothing when there are no initial categories', () => {
      const spy = jest.spyOn(component, 'setStorageTier');
      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('setStorageTier', () => {
    it('should add a category to the form control when checked is true', () => {
      component.setStorageTier('Working', true);
      expect(component.dataDescriptionForm.value.dataCategories).toContain('Working');
    });

    it('should not duplicate a category already present when checked again', () => {
      component.setStorageTier('Working', true);
      component.setStorageTier('Working', true);
      const categories = component.dataDescriptionForm.value.dataCategories as string[];
      expect(categories.filter(c => c === 'Working').length).toBe(1);
    });

    it('should remove a category from the form control when checked is false', () => {
      component.setStorageTier('Working', true);
      component.setStorageTier('Working', false);
      expect(component.dataDescriptionForm.value.dataCategories).not.toContain('Working');
    });

    it('should compute and send "top" tier when "Published Results and SRD" is selected', () => {
      component.setStorageTier('Published Results and SRD', true);
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenCalledWith('top');
    });

    it('should compute and send "mid" tier when "Publishable" is selected', () => {
      component.setStorageTier('Publishable', true);
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenCalledWith('mid');
    });

    it('should compute and send "low" tier when "Working" or "Derived" is selected', () => {
      component.setStorageTier('Derived', true);
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenCalledWith('low');
    });

    it('should prioritize "top" over "mid" and "low" when multiple categories are selected', () => {
      component.setStorageTier('Working', true);
      component.setStorageTier('Published Results and SRD', true);
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenLastCalledWith('top');
    });

    it('should send an empty string tier when no categories remain selected', () => {
      component.setStorageTier('Working', true);
      component.setStorageTier('Working', false);
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenLastCalledWith('');
    });

    it('should push the computed tier onto storageSubject$', () => {
      const emitted: string[] = [];
      resourcesServiceMock.storageSubject$.subscribe((v: string) => emitted.push(v));
      component.setStorageTier('Publishable', true);
      expect(emitted).toContain('mid');
    });

    it('should notify setDataCategories(true) and dataCategories$ when a category is selected', () => {
      const emitted: boolean[] = [];
      resourcesServiceMock.dataCategories$.subscribe((v: boolean) => emitted.push(v));
      component.setStorageTier('Working', true);
      expect(resourcesServiceMock.setDataCategories).toHaveBeenLastCalledWith(true);
      expect(emitted).toContain(true);
    });

    it('should notify setDataCategories(false) and dataCategories$ when the last category is deselected', () => {
      const emitted: boolean[] = [];
      component.setStorageTier('Working', true);
      resourcesServiceMock.dataCategories$.subscribe((v: boolean) => emitted.push(v));
      component.setStorageTier('Working', false);
      expect(resourcesServiceMock.setDataCategories).toHaveBeenLastCalledWith(false);
      expect(emitted).toContain(false);
    });
  });

  describe('resetCheckboxes', () => {
    it('should clear all categories from the form control', () => {
      component.setStorageTier('Working', true);
      component.setStorageTier('Publishable', true);
      component.resetCheckboxes();
      expect(component.dataDescriptionForm.value.dataCategories).toEqual([]);
    });

    it('should send an empty tier and setDataCategories(false) after resetting', () => {
      component.setStorageTier('Publishable', true);
      component.resetCheckboxes();
      expect(resourcesServiceMock.setStorageMessage).toHaveBeenLastCalledWith('');
      expect(resourcesServiceMock.setDataCategories).toHaveBeenLastCalledWith(false);
    });
  });

  describe('isCategorySelected', () => {
    it('should return true for a category present in the form control', () => {
      component.setStorageTier('Derived', true);
      expect(component.isCategorySelected('Derived')).toBe(true);
    });

    it('should return false for a category not present in the form control', () => {
      expect(component.isCategorySelected('Derived')).toBe(false);
    });
  });

  describe('dataCategoryChange', () => {
    it('should call setStorageTier with the checkbox value and checked state on check', () => {
      const spy = jest.spyOn(component, 'setStorageTier');
      const event = { target: { defaultValue: 'Working', checked: true } };
      component.dataCategoryChange(event);
      expect(spy).toHaveBeenCalledWith('Working', true);
    });

    it('should call setStorageTier with checked false on uncheck', () => {
      const spy = jest.spyOn(component, 'setStorageTier');
      const event = { target: { defaultValue: 'Working', checked: false } };
      component.dataCategoryChange(event);
      expect(spy).toHaveBeenCalledWith('Working', false);
    });
  });

  describe('valueChange output', () => {
    it('should emit the current form value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({ dataDescription: '', dataCategories: [] });
    });

    it('should emit updated values whenever the form changes', async () => {
      const emissions$ = component.valueChange.pipe(take(2), toArray());
      const emissionsPromise = firstValueFrom(emissions$);

      component.dataDescriptionForm.patchValue({ dataDescription: 'Updated text' });

      const emissions = await emissionsPromise;
      expect(emissions[0].dataDescription).toBe('');
      expect(emissions[1].dataDescription).toBe('Updated text');
    });

    it('should default dataCategories to an empty array in emitted values if unset', async () => {
      component.dataDescriptionForm.patchValue({ dataCategories: undefined as any });
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.dataCategories).toEqual([]);
    });
  });

  describe('formReady output', () => {
    it('should emit the dataDescriptionForm instance', async () => {
      const emittedForm = await firstValueFrom(component.formReady);
      expect(emittedForm).toBe(component.dataDescriptionForm);
    });
  });
});