import { Component, OnInit, ViewChild, afterNextRender  } from '@angular/core';
import { ObservedValueOf, Subscription } from "rxjs";
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { BasicInfoComponent } from '../form-components/basic-info/basic-info.component';
import { PersonelComponent } from '../form-components/personel/personel.component';
import { KeywordsComponent } from '../form-components/keywords/keywords.component';
import { StorageNeedsComponent } from '../form-components/technical-requirements/technical-requirements.component';
import { EthicalIssuesComponent } from '../form-components/ethical-issues/ethical-issues.component';
import { SecurityAndPrivacyComponent } from '../form-components/security-and-privacy/security-and-privacy.component';
import { DataDescriptionComponent } from '../form-components/data-description/data-description.component';
import { DataPreservationComponent } from '../form-components/data-preservation/data-preservation.component';
import { DMP_Meta } from '../types/DMP.types';
import { DmpService } from '../shared/dmp.service'
import { SubmitDmpService } from '../shared/submit-dmp.service';//for acknowledging when form button has been 'pressed'
import { UntypedFormControl } from '@angular/forms';


// for Communicating with backend services using HTTP
import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
/**
 * The HttpClient service makes use of observables for all transactions. You must import the RxJS observable and 
 * operator symbols that appear in the example snippets. These ConfigService imports are typical.
 */
// import { Observable, throwError } from 'rxjs';
// import { catchError, retry } from 'rxjs/operators';

import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DmpPdf } from './dmp-pdf';


//  Interface for the DMP interface. This is where we define observed values of
//  different DMP form components
interface DMPForm {
  basicInfo?: ObservedValueOf<BasicInfoComponent["formReady"]>;
  personel?: ObservedValueOf<PersonelComponent["formReady"]>;
  keyWordsAndPhrases?:ObservedValueOf<KeywordsComponent["formReady"]>;
  technicalRequirements?:ObservedValueOf<StorageNeedsComponent["formReady"]>;
  ethicalIssues?: ObservedValueOf<EthicalIssuesComponent["formReady"]>;
  securityAndPrivacy?: ObservedValueOf<SecurityAndPrivacyComponent["formReady"]>;
  dataDescription?: ObservedValueOf<DataDescriptionComponent["formReady"]>;
  dataPreservation?: ObservedValueOf<DataPreservationComponent["formReady"]>;
  
}

// In the example above we have a number of child components: 
// BasicInfoComponent through StorageNeedsComponent, 
// which are combined into the main form group as basicInfo through dataPreservation. 
// We define them all as optional because initially our form group will 
// be empty until the first child component has emitted its formReady event.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-dmp-form',
  templateUrl: './dmp-form.component.html',
  styleUrls: ['./dmp-form.component.scss']
})
@Injectable()
export class DmpFormComponent implements OnInit{
  formButtonSubscription!: Subscription | null;
  formButtonMessage: string = "";

  dmpExportFormatSubscription!: Subscription | null;
  dmpExportFormatType: string = "";
  // get access to methods in DataDescriptionComponent child.

  // this is for the purpose of reseting checkboxes.
  @ViewChild(DataDescriptionComponent) dataCategoriesCheckBoxes!:DataDescriptionComponent;
  // For reseting radio buttons to "no" and enabling hiding of text boxes
  @ViewChild(EthicalIssuesComponent) ethicalIssuesRadioBtns!: EthicalIssuesComponent;
  // For clearing the keywords / phrases table
  @ViewChild(KeywordsComponent) keyWordsTable!: KeywordsComponent;
  // For clearing data preservation links
  @ViewChild(DataPreservationComponent) preservationLinksTable!: DataPreservationComponent;
  // For clearing Technical resources table
  @ViewChild(StorageNeedsComponent) technicalRequirementsTable!: StorageNeedsComponent;
  // For clearing Contributors resources table
  @ViewChild(PersonelComponent) personnelForm!: PersonelComponent;
 
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
  dmpFormGrp = this.fb.group({
    // Form is empty for now -> child form groups will be added dynamically

  });

  markdown:Array<string> = [];

  name = new UntypedFormControl('');
  nameDisabled = false;
  nameClass:string = "mnemonicNameNew";

  DMP_PDF?:DmpPdf;

  constructor(
    private fb: UntypedFormBuilder, 
    private dmp_Service: DmpService, 
    private route: ActivatedRoute,
    private router: Router,
    private form_buttons:SubmitDmpService
    
    ) {  
      // console.log("constructor");
      afterNextRender(() => {
        // used for one-time initialisation: 
        // subscribe to track if the form has been changed by performing
        // changes to any inputs on the form
        this.dmpFormGrp.valueChanges.subscribe(value => {   
          // check if we're loading data from the backend database
          // and if the form is in the initial state - meaning just
          // freshly pulled out of the database and un-edited
          if (this.getFromDB && this.initialFormState){
            
            // here we set save button to initial state, thus ignoring
            // changes made to the form when initializing the form
            // and when updating the form with the data that initially 
            // comes from the back end
            this.changeElementClass("btnSave", "btn_draft", "btn_update"); // add btn_draft class, remove btn_update class
            this.formSaved = true;
            
            // set initial form to false to indicate that any edits to the form
            // need to be tracked
            this.initialFormState = false;

            // set to false because we're done getting data from the backednd database.
            this.getFromDB = false;
          }
          else {
            // make changes to the background color because the form has been changed
            
            this.changeElementClass("btnSave", "btn_update", "btn_draft"); // add btn_update class, remove btn_draft class
            this.formSaved = false;
            
          }
        });
        
      });
    }

  action:string = "";
  id:string | null = null;
  formSaved:boolean = true;
  initialFormState:boolean = false;
  firstLoadCount:number = 0;
  getFromDB:boolean = false;

  ngOnInit(): void {
    console.log("ngOnInit")

    // const elementToObserve = document.getElementById("footer");
    
    //     const resizeObserver = new ResizeObserver(entries => {
    //       for (let entry of entries) {
    //         const element = entry.target;
    //         const newWidth = entry.contentRect.width;
    //         const newHeight = entry.contentRect.height;
        
    //         // Do something with the new dimensions
    //         // console.log('Element resized:', element, newWidth, newHeight);
    //       }
    //     });
    
    //     resizeObserver.observe(<Element>elementToObserve);
    
    this.formButtonSubscribe();
    this.formExportFormatSubscribe();
    this.id = this.route.snapshot.paramMap.get('id')
    this.route.data.subscribe(data  => {
      this.action = data["action"] ;
      if (this.action === "edit"){
        this.nameClass = "mnemonicNameDisabled"
        this.nameDisabled = true;
      }
      else{
        this.nameClass = "mnemonicNameNew"
        this.nameDisabled = false;
      }
    });

    // Fetch initial data from the backend
    this.dmp_Service.fetchDMP(this.action, this.id).subscribe(
      {
        next: data => {
          if (this.id !==null){
            this.initialDMP = data.data;
            this.dmp = data.data;
            this.name.setValue(data.name);
            // this.name.value = data.name
            this.getFromDB = true;
          }
          else{
            this.initialDMP = data;
            this.dmp = data;
            // this.name.value = '';
          }
        },
        error: error => {
          console.log(error.message);
          this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
            
        }
      }
    );
    
  }


  //subscribe to button subjects
  formButtonSubscribe(){
    if (!this.formButtonSubscription) {
      //subscribe if not already subscribed
      this.formButtonSubscription = this.form_buttons.buttonSubject$.subscribe({
        next: (message) => {
          // the message is not relevant here. it is just a trigger to reset the form
          this.formButtonMessage = message;
          if (this.formButtonMessage === "Reset"){
            this.resetDmp();
          }
          else if (this.formButtonMessage === "Save Draft"){
            this.saveDraft();
          }
          else if (this.formButtonMessage === "Export As:"){
            if (this.dmpExportFormatType === ""){
              alert("Please select DMP export type from the drop down menu.");
            }
            else {
              if (this.formSaved){
                this.exportDMP(this.dmpExportFormatType);
              }
              else{
                alert("Please save changes to your DMP form before exporting.");
              }
              
            }
          }
        }
      });
    }

  }

  private changeElementClass (elID:string, add:string, remove:string){
    var saveButton = document.getElementById(elID);
    saveButton?.classList.remove(add);
    saveButton?.classList.remove(remove);

    saveButton?.classList.add(add);

  }

  formExportFormatSubscribe(){
    if (!this.dmpExportFormatSubscription) {
      //subscribe if not already subscribed
      this.dmpExportFormatSubscription = this.form_buttons.exportFormatSubject$.subscribe({
        next: (message) => {
          this.dmpExportFormatType = message;          
        }
      });
    }

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
    this.dmpFormGrp.setControl(name, group);
  }

  // Our parent component should listen to any value changes in the child components. 
  // For that we create another dmp property (dmp?: DMP_Meta;) that will contain the 
  // latest value and add a patchDMP() method to update the dmp.
  patchDMP(patch: Partial<DMP_Meta>) {
    // patch contains value changes in the child components
    if (!this.dmp) throw new Error("Missing DMP in patch");

    // ========================================
    // NOTE:
    // ========================================
    // Currently we have 8 components within the form and they appear in this order on the GUI
    //      1) Basic Information
    //      2) Researchers
    //      3) Keywords
    //      4) Technical Requirements
    //      5) Ethical Concerns
    //      6) Security and Privacy
    //      7) Data Description
    //      8) Data Preservation and Accessibility
    // On form init, those components send initialization patch to the main form component
    // consequently the last component that sends init patch is Data Preservation and Accessibility.    
    // This component has property 'preservationDescription' so checking for that property as
    // Initially the forms patch empty values of the form to the parent so we need to ignore these
    // first 8 inital patch events.
    const frmComponentNum: number = 8 // change this number if more form components are added in the future
    this.firstLoadCount +=1;

    if(this.getFromDB && this.firstLoadCount > frmComponentNum ){
      // Once the initial empty patch values have been ignored,
      // check for the last form patch that currently comes from 
      // Data Preservation and Accessibility component
      if (patch.preservationDescription){
        // set the flag that indicates that we have loaded the 
        // initial form state that came from back end database
        this.initialFormState = true;
        // console.log("last one");
      }

    }
    
    // Example of spread operatior (...)
    // let arr1 = [0, 1, 2];
    // const arr2 = [3, 4, 5];
    // arr1 = [...arr1, ...arr2];
    // arr1 is now [0, 1, 2, 3, 4, 5]        
    this.dmp = { ...this.dmp, ...patch };
  }

  onSubmit() {
    // For demo purposes make onSumit identical to saving a draft
    // later new logic will have to be implemented for proper proceduere
    // of submitting a DMP record for publishing
    this.saveDraft();

    
    // if (!this.dmp){
    //   alert("Cannot save DMP. Missing DMP in submit")
    //   throw new Error("Missing DMP in submit");
    // }
    // if (this.name.value === '') {
    //   alert("Cannot save DMP. Record name is empty.")
    //   throw new Error("Record name is empty");
    // }
    // this.dmp_Service.createDMP(this.dmp, this.name.value).subscribe(
    //   {
    //     next: data => {
    //         this.router.navigate(['success']);
    //     },
    //     error: error => {
    //       console.log(error.message);
    //       this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
    //     }
    //   }
    // );
  }

  saveDraft(){
    if (!this.dmp){
      alert("Cannot save DMP. Record name is empty. Missing DMP in submit")
      throw new Error("Missing DMP in submit");
    } 
    if (this.name.value === '') {
      alert("Cannot save DMP. Record name is empty.")
      throw new Error("Record name is empty");
    }
    // if (this.dmp.title === '') {
    //   alert("Cannot save DMP. Title is empty.")
    //   throw new Error("DMP title is empty");
    // }
    // if (this.dmp.projectDescription === '') {
    //   alert("Cannot save DMP. Project description is empty.")
    //   throw new Error("DMP project description is empty");
    // }
    // if (this.dmp.primary_NIST_contact.firstName === '' ) {
    //   alert("Cannot save DMP. Primary contact first name is empty.")
    //   throw new Error("DMP primary contact first name description is empty");
    // }
    // if (this.dmp.primary_NIST_contact.lastName === '' ) {
    //   alert("Cannot save DMP. Primary contact last name is empty.")
    //   throw new Error("DMP primary contact last name description is empty");
    // }
    
    if (this.id !==null){
      // If id is not null then update dmp with the current id
      this.dmp_Service.updateDMP(this.dmp, this.id).subscribe(
        {
          next: data => {
            //try to reload the page to read the saved dmp from mongodb
            this.router.navigate(['edit', this.id]);
            this.changeElementClass("btnSave", "btn_draft", "btn_update");
            this.formSaved = true;
            alert("Successfuly saved draft of the data");
          },
          error: error => {
            console.log(error.message);
            this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
          }
          
        }
      );
    }
    else {
      //create a new DMP
      this.dmp_Service.createDMP(this.dmp, this.name.value).subscribe(
        {
          next: data => {
            this.router.navigate(['edit', data.id]);
            this.changeElementClass("btnSave", "btn_draft", "btn_update");
            this.formSaved = true;
          },
          error: error => {
            console.log(error.message);
            this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
          }
        }
      );
    }
    
  }

  resetDmp(){
    this.dmpFormGrp.controls['basicInfo'].reset();
    this.dmpFormGrp.controls['basicInfo'].patchValue({
      organizations:[]
  })
    this.dmpFormGrp.controls['ethicalIssues'].reset();
    this.dmpFormGrp.controls['ethicalIssues'].patchValue({
        ethicalIssue:"no",
        ethicalPII:"no"
    })

    this.personnelForm.resetPersonnelForm();
    this.keyWordsTable.clearKeywordsTable();

    // this.dmpFormGrp.controls['technicalRequirements'].reset();
    this.technicalRequirementsTable.resetTechnicalRequirements();
    
    this.ethicalIssuesRadioBtns.resetRadioButtons();
    this.dmpFormGrp.controls['dataDescription'].reset();
    // We have to set this one separately because it is an array
    // so once form reset is done to it, new data can't be appended
    // so we have to set it back to an empty array.
    this.dmpFormGrp.controls['dataDescription'].patchValue({
      dataCategories: []
    })
    // This sends signal to DataDescriptionComponent to reset checkboxes
    this.dataCategoriesCheckBoxes.resetCheckboxes();

    // Reset Data Preservation component of the form
    this.dmpFormGrp.controls['dataPreservation'].patchValue({
      preservationDescription:"",
      dataAccess:"",
      pathsURLs: []
    })

    this.preservationLinksTable.clearTable();
  }

  buildErrorMessage(error:any){

    let errorMessage = " ";
    if (error.status){
      errorMessage += error.status + " ";
    }
    if (error.statusText){
      errorMessage += error.statusText + " ";
    }
    return errorMessage;

  }

  screenshotPDF(){
    //capture full screenshot of the DMP form

    let DATA: any = document.getElementById('dmp_panel');
    let PDF = new jsPDF('p', 'mm', 'a4');
    html2canvas(DATA).then((canvas) => {
      var imgData = canvas.toDataURL('image/png');

      /*
      Here are the numbers (paper width and height) that I found to work. 
      It still creates a little overlap part between the pages, but good enough for me.
      if you can find an official number from jsPDF, use them.
      */
      var imgWidth = 210; 
      var pageHeight = 295;  
      var imgHeight = canvas.height * imgWidth / canvas.width;
      var heightLeft = imgHeight;

      var doc = new jsPDF('p', 'mm');
      var position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      doc.save('angular-demo.pdf');
    });

  }

  exportDMP(dmpFormat:string) {
    // Create A4 size PDF document 
    // A4 measures 8.27 x 11.69 inches    
    const pdf = new jsPDF('p', 'in', 'a4');
    const ppi = 72; // pixels per inch resolution
    const pageWidth = 8.27;
    const pageHeight = 11.69
    const margin = 0.5;
    let verticalOffset = 0.5;
    let lineFontSize = 35;
    this.DMP_PDF = new DmpPdf(pdf, margin);
    this.markdown = [];

    if (dmpFormat === "PDF"){      
      this.DMP_PDF.printHeader("Data Management Plan", 0.1, "#707b7c");
    }
    else if (dmpFormat === "Markdown"){
      this.markdown.push("# Data Management Plan  \n");
    }

    this.PrintSectionHeading("Basic Information", "#1A52BC", dmpFormat, this.DMP_PDF);
    

    // Title
    if (this.dmp?.title !== undefined && this.dmp?.title !== null){
      if (dmpFormat === "PDF") 
        this.DMP_PDF.printTextField("Title", this.dmp?.title);
      if (dmpFormat === "Markdown") 
        this.markdown.push("**Title:** " + this.dmp?.title + "  \n");
    }

    // Start Date
    if (this.dmp?.startDate !== undefined && this.dmp?.startDate !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Start Date", this.dmp?.startDate);
      if (dmpFormat === "Markdown") 
        this.markdown.push("**Start Date:** " + this.dmp?.startDate + "  \n");
    }

    // End Date
    /*
    if (this.dmp?.endDate !== undefined && this.dmp?.endDate !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("End Date", this.dmp?.endDate);
      if (dmpFormat === "Markdown") 
        this.markdown.push("**End Date:** " + this.dmp?.endDate + "  \n");
    }
    */

    // Make DMP searchable
    if (this.dmp?.dmpSearchable !== undefined && this.dmp?.dmpSearchable !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Make DMP Searchable", this.dmp?.dmpSearchable);
      if (dmpFormat === "Markdown")
        this.markdown.push("**Make DMP Searchable:** " + this.dmp?.dmpSearchable + "  \n");
    }

    //Funding
    if (this.dmp?.funding !== undefined){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("Funding", ["Grant Source","Grant ID"], [[this.dmp.funding.grant_source, this.dmp.funding.grant_id]]);
      if (dmpFormat === "Markdown")
        this.markdownTable("Funding", ["Grant Source","Grant ID"], [[this.dmp.funding.grant_source, this.dmp.funding.grant_id]]);
    }

    // Project Description
    if (this.dmp?.projectDescription !== undefined && this.dmp?.projectDescription !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Project Description", this.dmp?.projectDescription);
      if (dmpFormat === "Markdown")
        this.markdown.push("**Project Description:** " + this.dmp?.projectDescription + "  \n");
    }

    

    // ========================== Researchers ============================

    this.PrintSectionHeading("Researchers", "#1A52BC", dmpFormat, this.DMP_PDF);

    // Contributors
    if (this.dmp?.contributors !== undefined){
      let tblHeaders = ["Name", "Surname", "Primary\nContact", "Institution", "ORG ID", /*"Role",*/ "e-mail", "ORCID" ];
      let tblData:Array<Array<string>>=[];

      for ( let i=0; i < this.dmp.contributors.length; i++){
        let currRow: Array<string> = [];
        currRow.push(this.dmp.contributors[i].firstName);
        currRow.push(this.dmp.contributors[i].lastName);
        currRow.push(this.dmp.contributors[i].primary_contact);
        currRow.push(this.dmp.contributors[i].institution);
        currRow.push(this.dmp.contributors[i].groupNumber);
        // currRow.push(this.dmp.contributors[i].role);
        currRow.push(this.dmp.contributors[i].emailAddress);
        currRow.push(this.dmp.contributors[i].orcid);        
        tblData.push(currRow);
      }
      
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("Contributors", tblHeaders, tblData);
      if (dmpFormat === "Markdown"){
        // change primary contact to be one line because Markdown does not allow new lines in a table cell
        tblHeaders[3] = "Primary Contact"; 
        this.markdownTable("Contributors", tblHeaders, tblData);
      }
        

    } 

    //Organization(s) Associated With This DMP
    if(this.dmp?.organizations !== undefined){
      let tblHeaders = ["Group Name", "Division Name", "OU Name"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.organizations.length; i++){
        tblData.push([this.dmp.organizations[i].groupName, this.dmp.organizations[i].divisionName, this.dmp.organizations[i].ouName])
      }

      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("Organization(s) Associated With This DMP", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("Organization(s) Associated With This DMP", tblHeaders, tblData);
    }   

    // ========================== Keywords / Phrases ============================

    this.PrintSectionHeading("Keywords / Phrases", "#1A52BC", dmpFormat, this.DMP_PDF);

    //Keywords / Phrases
    if(this.dmp?.keywords !== undefined){
      let tblHeaders = ["Keywords / Phrases"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.keywords.length; i++){
        tblData.push([this.dmp.keywords[i]])
      }
      
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("", tblHeaders, tblData);
    }

    // =========================== Technical Requirements =========================

    this.PrintSectionHeading("Technical Requirements", "#1A52BC", dmpFormat, this.DMP_PDF);

    //Estimated Data Size
    if(this.dmp?.dataSize !== undefined && this.dmp?.dataSize !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Estimated Data Size", this.dmp?.dataSize + this.dmp.sizeUnit);
      if (dmpFormat === "Markdown")
        this.markdown.push("**Estimated Data Size:** " + this.dmp?.dataSize + this.dmp.sizeUnit + "  \n");
    }

    //Software Development
    if(this.dmp?.softwareDevelopment !== undefined && this.dmp?.softwareDevelopment !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Software Development", this.dmp?.softwareDevelopment.development);
      if (dmpFormat === "Markdown")
        this.markdown.push("**Software Development:** " + this.dmp?.softwareDevelopment.development + "  \n");

      //Software developed for this project will be for
      if(this.dmp?.softwareDevelopment.softwareUse !== ""){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Software developed for this project will be for", this.dmp?.softwareDevelopment.softwareUse);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Software developed for this project will be for:** " + this.dmp?.softwareDevelopment.softwareUse + "  \n");
      }

      //Does the software development require a database?
      if(this.dmp?.softwareDevelopment.softwareDatabase !== ""){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Does the software development require a database?", this.dmp?.softwareDevelopment.softwareDatabase);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Does the software development require a database?:** " + this.dmp?.softwareDevelopment.softwareDatabase + "  \n");
      }

      //Will the software development produce a website interface?
      if(this.dmp?.softwareDevelopment.softwareWebsite !== ""){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Will the software development produce a website interface?", this.dmp?.softwareDevelopment.softwareWebsite);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Will the software development produce a website interface?:** " + this.dmp?.softwareDevelopment.softwareWebsite + "  \n");
      }
    }

    // Technical resources equipment needed/used
    if(this.dmp?.technicalResources !== undefined){
      let tblHeaders = ["Technical resources equipment needed/used"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.technicalResources.length; i++){
        tblData.push([this.dmp.technicalResources[i]])
      }
      
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("", tblHeaders, tblData);
    }

    // Instruments needed/used
    if(this.dmp?.instruments !== undefined){
      let tblHeaders = ["Instrument Name", "Description / URL Landing Page"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.instruments.length; i++){
        let currRow: Array<string> = [];        
        currRow.push(this.dmp.instruments[i].name);
        currRow.push(this.dmp.instruments[i].description_url);
        tblData.push(currRow);
      }
      
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("Instruments needed/used", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("Instruments needed/used", tblHeaders, tblData);
    }

    // ========================================= Ethical Issues ===========================

    this.PrintSectionHeading("Ethical Concerns", "#1A52BC", dmpFormat, this.DMP_PDF);

    if (this.dmp?.ethical_issues.irb_number !== undefined && this.dmp?.ethical_issues.irb_number !== null){
      if (dmpFormat === "PDF") 
        this.DMP_PDF.printTextField("IRB number", this.dmp?.ethical_issues.irb_number);
      if (dmpFormat === "Markdown") 
        this.markdown.push("**IRB number:** " + this.dmp?.ethical_issues.irb_number + "  \n");
    }

    if(this.dmp?.ethical_issues !== undefined){
      //Are there any ethical issues related to the data that this DMP describes?
      if(this.dmp?.ethical_issues.ethical_issues_exist !== ""){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Are there any ethical issues related to the data that this DMP describes?", 
                                    this.dmp?.ethical_issues.ethical_issues_exist);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Are there any ethical issues related to the data that this DMP describes?:** " + this.dmp?.ethical_issues.ethical_issues_exist + "  \n");
      }

      //Describe any ethical issues raised in this project (human subjects etc)
      if(this.dmp?.ethical_issues.ethical_issues_description !== ""){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Describe any ethical issues raised in this project (human subjects etc)", 
                                    this.dmp?.ethical_issues.ethical_issues_description);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Describe any ethical issues raised in this project (human subjects etc):** " + this.dmp?.ethical_issues.ethical_issues_description + "  \n");
                          
      }

      //Ethical issues report
      if(this.dmp?.ethical_issues.ethical_issues_report !== ""){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Ethical issues report", 
                                    this.dmp?.ethical_issues.ethical_issues_report);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Ethical issues report:** " + this.dmp?.ethical_issues.ethical_issues_report + "  \n");
          
      }

    }

    // ========================================= Security and Privacy =======================

    this.PrintSectionHeading("Security and Privacy", "#1A52BC", dmpFormat, this.DMP_PDF);
    
    if(this.dmp?.security_and_privacy.data_sensitivity !== undefined){
      let tblHeaders = ["Data Sensitivity Level(s)"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.security_and_privacy.data_sensitivity.length; i++){
        tblData.push([this.dmp.security_and_privacy.data_sensitivity[i]])
      }
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("", tblHeaders, tblData);

      // if data sensitivyt levels have been selected check if there is extra metadata on CUI
      if(this.dmp?.security_and_privacy.cui !== undefined){
        tblHeaders = ["Controlled Unclassified Information (CUI)"];
        tblData = [];
        for ( let i=0; i < this.dmp.security_and_privacy.cui.length; i++){
          tblData.push([this.dmp.security_and_privacy.cui[i]])
        }
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTable("", tblHeaders, tblData);
        if (dmpFormat === "Markdown")
          this.markdownTable("", tblHeaders, tblData);
      }
    }



    // ========================================= Data Description ===========================

    this.PrintSectionHeading("Data Description", "#1A52BC", dmpFormat, this.DMP_PDF);

    if(this.dmp?.dataDescription !== undefined && this.dmp?.dataDescription !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("",this.dmp?.dataDescription);
      if (dmpFormat === "Markdown")
        this.markdown.push(this.dmp?.dataDescription + "  \n");
   
    }

    // Select categories of the data that will be generated
    if(this.dmp?.dataCategories !== undefined){
      let tblHeaders = ["Categories of the data that will be generated"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.dataCategories.length; i++){
        tblData.push([this.dmp.dataCategories[i]])
      }
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("", tblHeaders, tblData);
    }

    // ======================== Data Preservation and Accessibility ==========================

    this.PrintSectionHeading("Data Preservation and Accessibility", "#1A52BC", dmpFormat, this.DMP_PDF);

    // Preservation Description
    if (this.dmp?.preservationDescription !== undefined && this.dmp?.preservationDescription !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Preservation Description", this.dmp?.preservationDescription);
      if (dmpFormat === "Markdown")
        this.markdown.push("**Preservation Description**:" + this.dmp?.preservationDescription + "  \n");
    }

    // Describe your plans for making the data discoverable (findable) and accessible
    if (this.dmp?.dataAccess !== undefined && this.dmp?.dataAccess !== null){
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTextField("Data discoverablity and accessiblity plan", this.dmp?.dataAccess);
      if (dmpFormat === "Markdown")
        this.markdown.push("**Data discoverablity and accessiblity plan**:" + this.dmp?.dataAccess + "  \n");
    }    

    // file path(s) / URL(s) for where data will be saved

    if(this.dmp?.pathsURLs !== undefined){
      let tblHeaders = ["File path(s) / URL(s) for where data will be saved"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.pathsURLs.length; i++){
        tblData.push([this.dmp.pathsURLs[i]])
      }
      
      if (dmpFormat === "PDF")
        this.DMP_PDF.printTable("", tblHeaders, tblData);
      if (dmpFormat === "Markdown")
        this.markdownTable("", tblHeaders, tblData);
    }

    // ================================ Export DMP ================================
    
    if (dmpFormat === "PDF")
      this.DMP_PDF.exportAsPDF();
    else if (dmpFormat === "Markdown"){
      const blob = new Blob(this.markdown, {type: "text/plain;charset=utf-8"});
      saveAs(blob, "DMP.md");
    }
  }  

  private markdownTable(fieldName:string, tblHead:Array<string>, tblBody:Array<Array<string>>,){
    if (fieldName !== ""){
      this.markdown.push("  \n");
      this.markdown.push("**" + fieldName +":**  \n");
      
    }
    this.markdown.push("  \n");

    let headerText = "|" + tblHead.join("|") + "|  \n";
    this.markdown.push(headerText);
    
    let headerSeparator = "|"
    for (let i = 0; i < tblHead.length; i ++){
      headerSeparator += " --- |"
    }
    headerSeparator += "  \n"
    this.markdown.push(headerSeparator);

    
    for (let i = 0; i < tblBody.length; i ++){
      let tblRowContent = "|" + tblBody[i].join("|") + "|  \n";
      this.markdown.push(tblRowContent);
    }
    this.markdown.push("  \n");
  }

  private PrintSectionHeading(sectionTitle:string, color: string, dmpFormat:string, pdf:DmpPdf){
    if (dmpFormat === "PDF")
      pdf.printHeader(sectionTitle, 0.05, color, 20);
    if (dmpFormat === "Markdown"){
      this.markdown.push("---  \n");
      this.markdown.push("## " + sectionTitle + "  \n");
      this.markdown.push("---  \n");
    }

  }
}
