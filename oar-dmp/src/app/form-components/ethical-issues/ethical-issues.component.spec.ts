import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { firstValueFrom, take, toArray } from 'rxjs';

import { EthicalIssuesComponent } from './ethical-issues.component';
import { DMP_Meta } from '../../types/DMP.types';

describe('EthicalIssuesComponent', () => {
  let component: EthicalIssuesComponent;
  let fixture: ComponentFixture<EthicalIssuesComponent>;

  const mockDmp: Partial<DMP_Meta> = {
    ethical_issues: {
      irb_number: 'IRB-123',
      ethical_issues_exist: 'yes',
      ethical_issues_report: 'Report text',
      ethical_issues_description: 'Description text'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthicalIssuesComponent],
      imports: [ReactiveFormsModule],
      providers: [FormBuilder]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EthicalIssuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ethicalIssuesForm defaults', () => {
    it('should initialize with expected default control values', () => {
      expect(component.ethicalIssuesForm.value).toEqual({
        IRBNumber: '',
        ethicalIssue: '',
        ethicalIssueDescription: '',
        ethicalReport: ''
      });
    });

    it('should be invalid initially due to the required ethicalIssue control', () => {
      expect(component.ethicalIssuesForm.valid).toBe(false);
    });

    it('should become valid once ethicalIssue is set', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'no' });
      expect(component.ethicalIssuesForm.valid).toBe(true);
    });
  });

  describe('initialDMP_Meta input setter', () => {
    it('should patch form values from the provided ethical_issues object', () => {
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.ethicalIssuesForm.value).toEqual({
        IRBNumber: 'IRB-123',
        ethicalIssue: 'yes',
        ethicalIssueDescription: 'Description text',
        ethicalReport: 'Report text'
      });
    });

    it('should overwrite previously entered form values when a new DMP_Meta is set', () => {
      component.ethicalIssuesForm.patchValue({ IRBNumber: 'Old-IRB' });
      component.initialDMP_Meta = mockDmp as DMP_Meta;
      expect(component.ethicalIssuesForm.get('IRBNumber')?.value).toBe('IRB-123');
    });
  });

  describe('ngOnInit — clearing dependent fields when answer is "no"', () => {
    beforeEach(() => {
      component.ethicalIssuesForm.patchValue({
        ethicalIssue: 'yes',
        ethicalReport: 'Some report',
        ethicalIssueDescription: 'Some description'
      });
    });

    it('should clear ethicalReport and ethicalIssueDescription when ethicalIssue changes to "no"', () => {
      component.ethicalIssuesForm.controls['ethicalIssue'].setValue('no');
      expect(component.ethicalIssuesForm.value.ethicalReport).toBe('');
      expect(component.ethicalIssuesForm.value.ethicalIssueDescription).toBe('');
    });

    it('should NOT clear report/description when ethicalIssue changes to a value other than "no"', () => {
      component.ethicalIssuesForm.controls['ethicalIssue'].setValue('yes');
      expect(component.ethicalIssuesForm.value.ethicalReport).toBe('Some report');
      expect(component.ethicalIssuesForm.value.ethicalIssueDescription).toBe('Some description');
    });

    it('should stop reacting to ethicalIssue changes after ngOnDestroy', () => {
      component.ngOnDestroy();
      component.ethicalIssuesForm.controls['ethicalIssue'].setValue('no');
      expect(component.ethicalIssuesForm.value.ethicalReport).toBe('Some report');
      expect(component.ethicalIssuesForm.value.ethicalIssueDescription).toBe('Some description');
    });
  });

  describe('selEthicalIssues', () => {
    it('should return true when the ethicalIssue control matches the given name', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'yes' });
      expect(component.selEthicalIssues('yes')).toBe(true);
    });

    it('should return false when the ethicalIssue control does not match the given name', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'no' });
      expect(component.selEthicalIssues('yes')).toBe(false);
    });

    it('should reflect the current value even after multiple changes', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'yes' });
      expect(component.selEthicalIssues('yes')).toBe(true);
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'no' });
      expect(component.selEthicalIssues('yes')).toBe(false);
      expect(component.selEthicalIssues('no')).toBe(true);
    });
  });

  describe('DOM visibility of description/report textareas', () => {
    it('should hide the description and report textareas by default', () => {
      const description = fixture.debugElement.query(By.css('#ethicalIssueDescription'));
      const report = fixture.debugElement.query(By.css('#ethicalIssuesReport'));
      expect(description).toBeNull();
      expect(report).toBeNull();
    });

    it('should show the description and report textareas when ethicalIssue is "yes"', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'yes' });
      fixture.detectChanges();

      const description = fixture.debugElement.query(By.css('#ethicalIssueDescription'));
      const report = fixture.debugElement.query(By.css('#ethicalIssuesReport'));
      expect(description).not.toBeNull();
      expect(report).not.toBeNull();
    });

    it('should hide the description and report textareas when ethicalIssue is "no"', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'yes' });
      fixture.detectChanges();
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'no' });
      fixture.detectChanges();

      const description = fixture.debugElement.query(By.css('#ethicalIssueDescription'));
      const report = fixture.debugElement.query(By.css('#ethicalIssuesReport'));
      expect(description).toBeNull();
      expect(report).toBeNull();
    });

    it('should reflect entered description text in the DOM when visible', () => {
      component.ethicalIssuesForm.patchValue({
        ethicalIssue: 'yes',
        ethicalIssueDescription: 'Human subjects involved'
      });
      fixture.detectChanges();

      const description: HTMLTextAreaElement = fixture.nativeElement.querySelector('#ethicalIssueDescription');
      expect(description.value).toBe('Human subjects involved');
    });

    it('should reflect entered report text in the DOM when visible', () => {
      component.ethicalIssuesForm.patchValue({
        ethicalIssue: 'yes',
        ethicalReport: 'See committee minutes'
      });
      fixture.detectChanges();

      const report: HTMLTextAreaElement = fixture.nativeElement.querySelector('#ethicalIssuesReport');
      expect(report.value).toBe('See committee minutes');
    });
  });

  describe('DOM radio button binding', () => {
    it('should check the "Yes" radio when ethicalIssue is "yes"', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'yes' });
      fixture.detectChanges();

      const yesRadio: HTMLInputElement = fixture.nativeElement.querySelector('#ethicalIssuesY');
      const noRadio: HTMLInputElement = fixture.nativeElement.querySelector('#ethicalIssuesN');
      expect(yesRadio.checked).toBe(true);
      expect(noRadio.checked).toBe(false);
    });

    it('should check the "No" radio when ethicalIssue is "no"', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'no' });
      fixture.detectChanges();

      const yesRadio: HTMLInputElement = fixture.nativeElement.querySelector('#ethicalIssuesY');
      const noRadio: HTMLInputElement = fixture.nativeElement.querySelector('#ethicalIssuesN');
      expect(yesRadio.checked).toBe(false);
      expect(noRadio.checked).toBe(true);
    });

    it('should update the ethicalIssue control when the "No" radio is clicked in the DOM', () => {
      component.ethicalIssuesForm.patchValue({ ethicalIssue: 'yes' });
      fixture.detectChanges();

      const noRadio: HTMLInputElement = fixture.nativeElement.querySelector('#ethicalIssuesN');
      noRadio.checked = true;
      noRadio.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.ethicalIssuesForm.value.ethicalIssue).toBe('no');
    });

    it('should update the IRBNumber control when typed into the DOM input', () => {
      const irbInput: HTMLInputElement = fixture.nativeElement.querySelector('#IRB_Number');
      irbInput.value = 'IRB-999';
      irbInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.ethicalIssuesForm.value.IRBNumber).toBe('IRB-999');
    });
  });

  describe('valueChange output', () => {
    it('should emit the current form value immediately on subscribe (startWith)', async () => {
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted).toEqual({
        ethical_issues: {
          irb_number: '',
          ethical_issues_exist: '',
          ethical_issues_description: '',
          ethical_issues_report: ''
        }
      });
    });

    it('should emit an updated partial DMP_Meta whenever the form changes', async () => {
      const emissions$ = component.valueChange.pipe(take(2), toArray());
      const emissionsPromise = firstValueFrom(emissions$);

      component.ethicalIssuesForm.patchValue({ IRBNumber: 'IRB-999' });

      const emissions = await emissionsPromise;
      expect(emissions[0].ethical_issues?.irb_number).toBe('');
      expect(emissions[1].ethical_issues?.irb_number).toBe('IRB-999');
    });

    it('should map flat form controls back into a nested ethical_issues object', async () => {
      component.ethicalIssuesForm.patchValue({
        IRBNumber: 'IRB-1',
        ethicalIssue: 'yes',
        ethicalIssueDescription: 'Desc',
        ethicalReport: 'Report'
      });
      const emitted = await firstValueFrom(component.valueChange);
      expect(emitted.ethical_issues).toEqual({
        irb_number: 'IRB-1',
        ethical_issues_exist: 'yes',
        ethical_issues_description: 'Desc',
        ethical_issues_report: 'Report'
      });
    });

    it('should re-emit the latest value (not a stale one) for each new subscriber, due to defer()', async () => {
      component.ethicalIssuesForm.patchValue({ IRBNumber: 'First' });
      const firstEmission = await firstValueFrom(component.valueChange);
      expect(firstEmission.ethical_issues?.irb_number).toBe('First');

      component.ethicalIssuesForm.patchValue({ IRBNumber: 'Second' });
      const secondEmission = await firstValueFrom(component.valueChange);
      expect(secondEmission.ethical_issues?.irb_number).toBe('Second');
    });
  });

  describe('formReady output', () => {
    it('should emit the ethicalIssuesForm instance', async () => {
      const emittedForm = await firstValueFrom(component.formReady);
      expect(emittedForm).toBe(component.ethicalIssuesForm);
    });
  });
});