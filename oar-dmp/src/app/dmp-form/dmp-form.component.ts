import { Component, OnInit } from '@angular/core';
import { ObservedValueOf } from "rxjs";
import { FormBuilder, Validators } from '@angular/forms';
import { BasicInfoComponent } from '../form-components/basic-info/basic-info.component';
import { EthicalIssuesComponent } from '../form-components/ethical-issues/ethical-issues.component';
import { DataDescriptionComponent } from '../form-components/data-description/data-description.component';
import { DMP_Meta } from 'src/app/types/DMP.types';
import { DmpService } from 'src/app/shared/dmp.service'

interface DMPForm {
  basicInfo?: ObservedValueOf<BasicInfoComponent["formReady"]>;
  ethicalIssues?: ObservedValueOf<EthicalIssuesComponent["formReady"]>;
  dataDescription?: ObservedValueOf<DataDescriptionComponent["formReady"]>;
  
}
// In the example above we have a number of child components: 
// BasicInfoComponent through ContactSubformComponent, 
// which are combined into the main form group as basicInfo through contact. 
// We define name and contact as optional because initially our form group will 
// be empty until the first child component has emitted its formReady event.

@Component({
  selector: 'app-dmp-form',
  templateUrl: './dmp-form.component.html',
  styleUrls: ['./dmp-form.component.scss']
})
export class DmpFormComponent implements OnInit {
 
  // We want to load the initial data via service and provide it to the child components. 
  // Assuming that we have a DMP object I call that property initialDMP:
  /**
   * The initial data received from the backend.
   * Remove this if you don't have any initial form data.
   */
  initialDMP?: DMP_Meta;

  /**
   * The current form data, provided by the child forms.
   * This will be sent to the backend when submitting the form.
   */
  dmp?: DMP_Meta;

   // We create our form group using the DMPForm interface that's been defined above
  form = this.fb.group({
    // Form is empty for now -> child form groups will be added dynamically

  });

  constructor(private fb: FormBuilder, private dmp_Service: DmpService) {}

  ngOnInit(): void {
    // Fetch initial data from the (fake) backend
    this.dmp_Service.fetchDMP().subscribe((dmp) => {
      this.initialDMP = dmp;
      this.dmp = dmp;
    });
  }

  // We need a method to register the child form groups. The method accepts a name 
  // (here "basicInfo" through "technical-requirements") and the form group. 
  // Thanks to TypeScript this is fully typed - the name and the group must match 
  // the form interface. Providing an invalid name or a form group that doesn't match 
  // the name would result in an error.
  addChildForm<K extends keyof DMPForm>(
    name: K,
    group: Exclude<DMPForm[K], undefined>
  ) {
    // And in our template we can render all child components and register the formReady event.
    this.form.setControl(name, group);
  }

  patchDMP(patch: Partial<DMP_Meta>) {
    if (!this.dmp) throw new Error("Missing DMP in patch");
    this.dmp = { ...this.dmp, ...patch };
  }
  onSubmit() {
    if (!this.dmp) throw new Error("Missing DMP in submit");
    this.dmp_Service.updateDMP(this.dmp).subscribe((aDMP) => {
      this.dmp = aDMP;
      alert('DMP updated!');
    });
  }

  resetDmp(){
    console.log ("reset DMP");
    this.form.controls['basicInfo'].reset();
    //this.form.controls['basicInfo'].s
    
    
    //   title:                    '',
    //   startDate:                '',
    //   endDate:                  '',
    //   dmpSearchable:            '',
    //   funding:                  '',
    //   fundingNumber:            '',
    //   projectDescription:       '',
      
    //   // Ethical Issues Meta data
    //   ethicalIssue:             '', 
    //   ethicalIssueDescription:  '', 
    //   ethicalReport:            '', 
    //   ethicalPII:               '',

    //   // Data Description Meta data
    //   dataDescription:          '',
    //   dataCategories:           []

    // });
  }

}
