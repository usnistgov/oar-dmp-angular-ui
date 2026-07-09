import { Component, Input, Output } from '@angular/core';
import { UntypedFormBuilder, Validators} from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';

@Component({
  selector: 'app-security-and-privacy',
  templateUrl: './security-and-privacy.component.html',
  styleUrls: ['./security-and-privacy.component.scss', '../form-layout.scss']
})
export class SecurityAndPrivacyComponent {

  constructor(private fb: UntypedFormBuilder) {
    // console.log("Security and Privacy Component");
  }

  dataSensitivityMap = new Map([
    ['Low', false],
    ['Medium', false],
    ['High', false]
  ]);

  cuiMap = new Map([
    ['BII', false],
    ['PII', false],
    ['Export Controlled (EAR)', false],
    ['ITAR', false],
    ['Proprietary', false]
  ]);

  showCUI_chk: boolean = false;

  // Let's start with a child component that is responsible for a part of the form. 
  // The component injects the FormBuilder and creates a new form group with their 
  // form controls, validators and any other configuration
  securityAndPrivacyForm = this.fb.group({
    dataSensitivity: [[]],
    dataCUI:[[]]
  });

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(securityAndPrivacy: DMP_Meta) {
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and children aren't created until initialDMP is set
    // (*ngIf="initialDMP" on the parent form). So security_and_privacy is present.
    if (securityAndPrivacy.security_and_privacy.data_sensitivity !== undefined) {
      securityAndPrivacy.security_and_privacy.data_sensitivity.forEach((value) => {
        // populate map for displaying check marks on the GUI form
        this.dataSensitivityMap.set(value, true);
        this.showCUI();
      });
    } else {
      // initialize array if it doesn't exist in an old DMP record
      securityAndPrivacy.security_and_privacy.data_sensitivity = [];
    }

    if (securityAndPrivacy.security_and_privacy.cui !== undefined) {
      securityAndPrivacy.security_and_privacy.cui.forEach((value) => {
        // populate map for displaying check marks on the GUI form
        this.cuiMap.set(value, true);
      });
    } else {
      // initialize array if it doesn't exist in an old DMP record
      securityAndPrivacy.security_and_privacy.cui = [];
    }

    this.securityAndPrivacyForm.patchValue({
      dataSensitivity: securityAndPrivacy.security_and_privacy.data_sensitivity,
      dataCUI: securityAndPrivacy.security_and_privacy.cui,
    });
  }

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    // There are a few important things to note here: form.valueChanges will only emit when 
    // the form value changes but not initially. That's why we use startWith to provide the 
    // initial value. And we use defer() to use the latest form value for startWith() 
    // whenever someone subscribes.
    this.securityAndPrivacyForm.valueChanges.pipe(
      startWith(this.securityAndPrivacyForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({           
          // The observable emits a partial DMP_Meta object that only contains the properties related 
          // to this part of the form 
          security_and_privacy: {
            data_sensitivity:               formValue.dataSensitivity,
            cui:                            formValue.dataCUI
          }               
          
        })
      )
    )
  );
  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.securityAndPrivacyForm);

  dataSensitivityChange(e: any) {
    this.dataSensitivityMap.set(e.target.defaultValue, e.target.checked);

    this.showCUI();

    const current = (this.securityAndPrivacyForm.value['dataSensitivity'] as string[]) ?? [];
    const next = e.target.checked
      ? [...current, e.target.defaultValue]
      : current.filter(v => v !== e.target.defaultValue);

    this.securityAndPrivacyForm.patchValue({ dataSensitivity: next });
  }

  cuiChange(e: any) {
    this.cuiMap.set(e.target.defaultValue, e.target.checked);

    const current = (this.securityAndPrivacyForm.value['dataCUI'] as string[]) ?? [];
    const next = e.target.checked
      ? [...current, e.target.defaultValue]
      : current.filter(v => v !== e.target.defaultValue);

    this.securityAndPrivacyForm.patchValue({ dataCUI: next });
  }

  private showCUI(){
    // set flag whether to show CUI check marks on the GUI form
    if (this.dataSensitivityMap.get('Medium') || this.dataSensitivityMap.get('High')){
      this.showCUI_chk = true;
    }
    else{
      this.showCUI_chk = false;
    }
  }

}
