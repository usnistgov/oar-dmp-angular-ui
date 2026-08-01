import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, take, toArray } from 'rxjs';

import { SecurityAndPrivacyComponent } from './security-and-privacy.component';
import { DMP_Meta } from '../../types/DMP.types';

describe('SecurityAndPrivacyComponent', () => {
  let component: SecurityAndPrivacyComponent;
  let fixture: ComponentFixture<SecurityAndPrivacyComponent>;

  // A fully-shaped DMP_Meta; tests override only security_and_privacy.
  const makeDmp = (sp: Partial<DMP_Meta['security_and_privacy']> = {}): DMP_Meta => ({
    title: '', startDate: '', dmpSearchable: 'yes',
    funding: { grant_source: 'Grant Number', grant_id: '' },
    projectDescription: '', organizations: [], contributors: [], keywords: [],
    dataSize: null, sizeUnit: 'GB', dataSizeDescription: '',
    softwareDevelopment: { development: 'no', softwareUse: 'both', softwareDatabase: 'no', softwareWebsite: 'no' },
    technicalResources: [], instruments: [],
    ethical_issues: { irb_number: '', ethical_issues_exist: 'no', ethical_issues_description: '', ethical_issues_report: '' },
    security_and_privacy: { data_sensitivity: [], cui: [], ...sp },
    dataDescription: '', dataCategories: [],
    preservationDescription: '', dataAccess: '', pathsURLs: [],
  } as DMP_Meta);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityAndPrivacyComponent],
      imports: [ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityAndPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Static option lists
  // -------------------------------------------------------------------------
  describe('option lists', () => {
    it('exposes the expected sensitivity levels', () => {
      expect(component.sensitivityLevels).toEqual(['Low', 'Medium', 'High']);
    });

    it('exposes the expected CUI types', () => {
      expect(component.cuiTypes).toEqual([
        'BII', 'PII', 'Export Controlled (EAR)', 'ITAR', 'Proprietary',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Form defaults
  // -------------------------------------------------------------------------
  describe('securityAndPrivacyForm defaults', () => {
    it('initializes with empty sensitivity and CUI arrays', () => {
      expect(component.securityAndPrivacyForm.value).toEqual({
        dataSensitivity: [],
        dataCUI: [],
      });
    });
  });

  // -------------------------------------------------------------------------
  // initialDMP_Meta input setter
  // -------------------------------------------------------------------------
  describe('initialDMP_Meta input setter', () => {
    it('patches sensitivity and CUI from the provided record', () => {
      component.initialDMP_Meta = makeDmp({
        data_sensitivity: ['Medium', 'High'],
        cui: ['PII', 'ITAR'],
      });
      expect(component.securityAndPrivacyForm.value).toEqual({
        dataSensitivity: ['Medium', 'High'],
        dataCUI: ['PII', 'ITAR'],
      });
    });

    it('defaults to empty arrays when fields are null/undefined', () => {
      component.initialDMP_Meta = makeDmp({
        data_sensitivity: undefined as any,
        cui: undefined as any,
      });
      expect(component.securityAndPrivacyForm.value).toEqual({
        dataSensitivity: [],
        dataCUI: [],
      });
    });
  });

  // -------------------------------------------------------------------------
  // toggleSensitivity
  // -------------------------------------------------------------------------
  describe('toggleSensitivity', () => {
    it('adds a level when checked', () => {
      component.toggleSensitivity('Low', true);
      expect(component.securityAndPrivacyForm.value.dataSensitivity).toEqual(['Low']);
    });

    it('removes a level when unchecked', () => {
      component.toggleSensitivity('Low', true);
      component.toggleSensitivity('Low', false);
      expect(component.securityAndPrivacyForm.value.dataSensitivity).toEqual([]);
    });

    it('accumulates multiple selected levels', () => {
      component.toggleSensitivity('Low', true);
      component.toggleSensitivity('High', true);
      expect(component.securityAndPrivacyForm.value.dataSensitivity).toEqual(['Low', 'High']);
    });

    it('clears CUI selections when the section becomes hidden (only Low left)', () => {
      // Reveal CUI, pick a value, then drop back to Low-only.
      component.toggleSensitivity('High', true);
      component.toggleCui('PII', true);
      expect(component.securityAndPrivacyForm.value.dataCUI).toEqual(['PII']);

      component.toggleSensitivity('High', false);
      // Nothing sensitive enough remains -> CUI must be wiped.
      expect(component.securityAndPrivacyForm.value.dataCUI).toEqual([]);
    });

    it('does NOT clear CUI while a Medium/High level is still selected', () => {
      component.toggleSensitivity('Medium', true);
      component.toggleSensitivity('High', true);
      component.toggleCui('PII', true);

      // Removing High still leaves Medium, so CUI stays.
      component.toggleSensitivity('High', false);
      expect(component.securityAndPrivacyForm.value.dataCUI).toEqual(['PII']);
    });
  });

  // -------------------------------------------------------------------------
  // toggleCui
  // -------------------------------------------------------------------------
  describe('toggleCui', () => {
    it('adds a CUI type when checked', () => {
      component.toggleCui('BII', true);
      expect(component.securityAndPrivacyForm.value.dataCUI).toEqual(['BII']);
    });

    it('removes a CUI type when unchecked', () => {
      component.toggleCui('BII', true);
      component.toggleCui('BII', false);
      expect(component.securityAndPrivacyForm.value.dataCUI).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Derived state helpers
  // -------------------------------------------------------------------------
  describe('derived checkbox state', () => {
    it('isSensitivitySelected reflects the control', () => {
      expect(component.isSensitivitySelected('Low')).toBe(false);
      component.toggleSensitivity('Low', true);
      expect(component.isSensitivitySelected('Low')).toBe(true);
    });

    it('isCuiSelected reflects the control', () => {
      component.toggleSensitivity('High', true);
      expect(component.isCuiSelected('PII')).toBe(false);
      component.toggleCui('PII', true);
      expect(component.isCuiSelected('PII')).toBe(true);
    });

    it('showCUI_chk is false when only Low is selected', () => {
      component.toggleSensitivity('Low', true);
      expect(component.showCUI_chk).toBe(false);
    });

    it('showCUI_chk is true when Medium is selected', () => {
      component.toggleSensitivity('Medium', true);
      expect(component.showCUI_chk).toBe(true);
    });

    it('showCUI_chk is true when High is selected', () => {
      component.toggleSensitivity('High', true);
      expect(component.showCUI_chk).toBe(true);
    });

    it('showCUI_chk is false with no selection', () => {
      expect(component.showCUI_chk).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // valueChange output
  // -------------------------------------------------------------------------
  describe('valueChange output', () => {
    it('emits the current value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({
        security_and_privacy: { data_sensitivity: [], cui: [] },
      });
    });

    it('maps flat controls into the nested security_and_privacy object', async () => {
      component.toggleSensitivity('High', true);
      component.toggleCui('ITAR', true);
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.security_and_privacy).toEqual({
        data_sensitivity: ['High'],
        cui: ['ITAR'],
      });
    });

    it('emits an updated value whenever the form changes', async () => {
      const emissions$ = component.valueChange.pipe(take(2), toArray());
      const emissionsPromise = firstValueFrom(emissions$);

      component.toggleSensitivity('Medium', true);

      const emissions = await emissionsPromise;
      expect(emissions[0].security_and_privacy?.data_sensitivity).toEqual([]);
      expect(emissions[1].security_and_privacy?.data_sensitivity).toEqual(['Medium']);
    });
  });

  // -------------------------------------------------------------------------
  // formReady output
  // -------------------------------------------------------------------------
  describe('formReady output', () => {
    it('emits the securityAndPrivacyForm instance', async () => {
      const form = await firstValueFrom(component.formReady);
      expect(form).toBe(component.securityAndPrivacyForm);
    });
  });
});