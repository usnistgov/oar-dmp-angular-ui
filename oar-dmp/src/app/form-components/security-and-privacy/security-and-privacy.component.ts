import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators} from '@angular/forms';

@Component({
  selector: 'app-security-and-privacy',
  templateUrl: './security-and-privacy.component.html',
  styleUrls: ['./security-and-privacy.component.scss', '../form-layout.scss']
})
export class SecurityAndPrivacyComponent {

  constructor(private fb: UntypedFormBuilder) {
    
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

  dataSensitivityChange(e:any){
    this.dataSensitivityMap.set(e.target.defaultValue,e.target.checked)

    this.showCUI();

    // pass by reference
    let data_sensitivity = this.securityAndPrivacyForm.value['dataSensitivity'] as string[];

    if (e.target.checked){      
      data_sensitivity.push(e.target.defaultValue);
    }
    else{
      data_sensitivity.forEach((value,index)=>{
        if(value === e.target.defaultValue) 
          data_sensitivity.splice(index,1)
        });
    }
  }

  cuiChange(e:any){
    this.cuiMap.set(e.target.defaultValue,e.target.checked)

    // pass by reference
    let CUI = this.securityAndPrivacyForm.value['dataCUI'] as string[];

    if (e.target.checked){      
      CUI.push(e.target.defaultValue);
    }
    else{
      CUI.forEach((value,index)=>{
        if(value === e.target.defaultValue) 
          CUI.splice(index,1)
        });
    }
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
