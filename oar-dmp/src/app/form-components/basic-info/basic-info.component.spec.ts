import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { firstValueFrom, take, toArray } from 'rxjs';

import { BasicInfoComponent } from './basic-info.component';
import { DMP_Meta } from '../../types/DMP.types';

describe('BasicInfoComponent', () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;

  const mockDmp: DMP_Meta = {
    title: 'My Research Project',
    startDate: '2026-01-01',
    dmpSearchable: 'yes',
    funding: { grant_source: 'NSF', grant_id: 'GRANT-123' },
    projectDescription: 'A study of things.'
  } as DMP_Meta;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BasicInfoComponent],
      providers: [FormBuilder]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('basicInfoForm defaults', () => {
    it('should initialize with expected default control values', () => {
      expect(component.basicInfoForm.value).toEqual({
        title: '',
        startDate: '',
        dmpSearchable: '',
        grant_source: 'Grant Number',
        grant_id: '',
        projectDescription: ''
      });
    });

    it('should be invalid initially due to required validators', () => {
      expect(component.basicInfoForm.valid).toBe(false);
    });

    it('should become valid once all required fields are filled', () => {
      component.basicInfoForm.setValue({
        title: 'Title',
        startDate: '2026-01-01',
        dmpSearchable: 'yes',
        grant_source: 'NSF',
        grant_id: 'ABC-123',
        projectDescription: 'Description'
      });
      expect(component.basicInfoForm.valid).toBe(true);
    });

    it('should mark title as invalid when empty', () => {
      const titleControl = component.basicInfoForm.get('title');
      expect(titleControl?.hasError('required')).toBe(true);
    });

    it('should mark startDate as invalid when empty', () => {
      const startDateControl = component.basicInfoForm.get('startDate');
      expect(startDateControl?.hasError('required')).toBe(true);
    });

    it('should mark grant_id as invalid when empty', () => {
      const grantIdControl = component.basicInfoForm.get('grant_id');
      expect(grantIdControl?.hasError('required')).toBe(true);
    });
  });

  describe('initialDMP_Meta input setter', () => {
    it('should patch form values from the provided DMP_Meta object', () => {
      component.initialDMP_Meta = mockDmp;

      expect(component.basicInfoForm.value).toEqual({
        title: 'My Research Project',
        startDate: '2026-01-01',
        dmpSearchable: 'yes',
        grant_source: 'NSF',
        grant_id: 'GRANT-123',
        projectDescription: 'A study of things.'
      });
    });

    it('should overwrite previously entered form values when a new DMP_Meta is set', () => {
      component.basicInfoForm.patchValue({ title: 'Old Title' });
      component.initialDMP_Meta = mockDmp;
      expect(component.basicInfoForm.get('title')?.value).toBe('My Research Project');
    });

    it('should correctly unpack nested funding fields into flat grant_source/grant_id controls', () => {
      component.initialDMP_Meta = mockDmp;
      expect(component.basicInfoForm.get('grant_source')?.value).toBe('NSF');
      expect(component.basicInfoForm.get('grant_id')?.value).toBe('GRANT-123');
    });

    it('should result in a valid form when a fully populated DMP_Meta is provided', () => {
      component.initialDMP_Meta = mockDmp;
      expect(component.basicInfoForm.valid).toBe(true);
    });
  });

  describe('valueChange output', () => {
    it('should emit the current form value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({
        title: '',
        startDate: '',
        dmpSearchable: '',
        funding: { grant_source: 'Grant Number', grant_id: '' },
        projectDescription: ''
      });
    });

    it('should emit an updated partial DMP_Meta whenever the form changes', async () => {
      const emissions$ = component.valueChange.pipe(take(2), toArray());
      const emissionsPromise = firstValueFrom(emissions$);

      component.basicInfoForm.patchValue({ title: 'New Title' });

      const emissions = await emissionsPromise;
      expect(emissions[0].title).toBe('');
      expect(emissions[1].title).toBe('New Title');
    });

    it('should map flat grant_source/grant_id controls back into a nested funding object', async () => {
      component.basicInfoForm.patchValue({ grant_source: 'DOE', grant_id: 'XYZ-999' });
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.funding).toEqual({ grant_source: 'DOE', grant_id: 'XYZ-999' });
    });

    it('should re-emit the latest value (not a stale one) for each new subscriber, due to defer()', async () => {
      component.basicInfoForm.patchValue({ title: 'First Update' });
      const firstEmission = await firstValueFrom(component.valueChange);
      expect(firstEmission.title).toBe('First Update');

      component.basicInfoForm.patchValue({ title: 'Second Update' });
      const secondEmission = await firstValueFrom(component.valueChange);
      expect(secondEmission.title).toBe('Second Update');
    });

    it('should reflect values patched in from initialDMP_Meta', async () => {
      component.initialDMP_Meta = mockDmp;
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({
        title: 'My Research Project',
        startDate: '2026-01-01',
        dmpSearchable: 'yes',
        funding: { grant_source: 'NSF', grant_id: 'GRANT-123' },
        projectDescription: 'A study of things.'
      });
    });
  });

  describe('formReady output', () => {
    it('should emit the basicInfoForm instance', async () => {
      const emittedForm = await firstValueFrom(component.formReady);
      expect(emittedForm).toBe(component.basicInfoForm);
    });
  });
});