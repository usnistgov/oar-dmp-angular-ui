import { Component, Input, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-security-and-privacy',
  templateUrl: './security-and-privacy.component.html',
  styleUrls: ['./security-and-privacy.component.scss', '../form-layout.scss']
})
export class SecurityAndPrivacyComponent {

  readonly sensitivityLevels = ['Low', 'Medium', 'High'];
  readonly cuiTypes = ['BII', 'PII', 'Export Controlled (EAR)', 'ITAR', 'Proprietary'];

  securityAndPrivacyForm = this.fb.group({
    dataSensitivity: [[] as string[]],
    dataCUI: [[] as string[]]
  });

  constructor(private fb: UntypedFormBuilder) {}

  @Input()
  set initialDMP_Meta(securityAndPrivacy: DMP_Meta) {
    // Parent always supplies a fully-shaped object; guard defensively anyway.
    const sp = securityAndPrivacy.security_and_privacy;
    this.securityAndPrivacyForm.patchValue({
      dataSensitivity: sp.data_sensitivity ?? [],
      dataCUI: sp.cui ?? [],
    });
  }

  @Output()
  valueChange = defer(() =>
    this.securityAndPrivacyForm.valueChanges.pipe(
      startWith(this.securityAndPrivacyForm.value),
      map((formValue): Partial<DMP_Meta> => ({
        security_and_privacy: {
          data_sensitivity: formValue.dataSensitivity ?? [],
          cui: formValue.dataCUI ?? []
        }
      }))
    )
  );

  @Output()
  formReady = of(this.securityAndPrivacyForm);

  // --- Derived checkbox state (control is the single source of truth) ---

  isSensitivitySelected(level: string): boolean {
    return (this.securityAndPrivacyForm.value['dataSensitivity'] as string[] ?? []).includes(level);
  }

  isCuiSelected(type: string): boolean {
    return (this.securityAndPrivacyForm.value['dataCUI'] as string[] ?? []).includes(type);
  }

  get showCUI_chk(): boolean {
    return this.isSensitivitySelected('Medium') || this.isSensitivitySelected('High');
  }

  toggleSensitivity(level: string, checked: boolean): void {
    const current = this.securityAndPrivacyForm.value['dataSensitivity'] as string[] ?? [];
    const next = checked ? [...current, level] : current.filter(v => v !== level);
    this.securityAndPrivacyForm.patchValue({ dataSensitivity: next });

    // If CUI section just became hidden, its selections should not linger.
    if (!this.showCUI_chk) {
      this.securityAndPrivacyForm.patchValue({ dataCUI: [] });
    }
  }

  toggleCui(type: string, checked: boolean): void {
    const current = this.securityAndPrivacyForm.value['dataCUI'] as string[] ?? [];
    const next = checked ? [...current, type] : current.filter(v => v !== type);
    this.securityAndPrivacyForm.patchValue({ dataCUI: next });
  }

  /** Safely reads the checked state from a checkbox change event. */
  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}