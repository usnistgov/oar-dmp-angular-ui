import { Component, OnInit, OnDestroy, ViewChild, afterNextRender } from '@angular/core';
import { ObservedValueOf, Subject, merge, forkJoin, switchMap, EMPTY } from "rxjs";
import { UntypedFormBuilder } from '@angular/forms';
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
import { FormChangedService } from '../shared/form-changed.service';
import { UpdateNistContributorService } from '../shared/update-nist-contributor.service';
import { UntypedFormControl } from '@angular/forms';
import { UpdateIndicator } from '../types/update-indicator.type';

import { takeUntil, filter, debounceTime } from 'rxjs/operators';

import { Router, ActivatedRoute } from '@angular/router';
import { DmpPdf } from './dmp-pdf';
import _ from 'lodash';   // or: import * as _ from 'lodash';


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
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-dmp-form',
  templateUrl: './dmp-form.component.html',
  styleUrls: ['./dmp-form.component.scss']
})

export class DmpFormComponent implements OnInit, OnDestroy {
  // --- Teardown ------------------------------------------------------------
  /** Fires once on destroy; every long-lived subscription pipes takeUntil(this). */
  private destroy$ = new Subject<void>();

  // --- Existing fields ------------------------------------------------------
  formButtonMessage: string = "";
  dmpExportFormatType: string = "";

  // Guard so the merged autosave stream is wired only once, even though
  // patchDMP() — its trigger — fires on every patch.
  private autoSaveWired = false;
  /** True while a save was triggered by autosave (suppresses the success alert). */
  private autoSaveInProgress = false;

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

  canWrite:boolean  = false;
  isAdmin:boolean   = false;
  canDelete:boolean = false;

  // --- Robust init-state detection -----------------------------------------
  /**
   * The child forms we expect to register via addChildForm(). Initial-form-state
   * detection waits until ALL of these have reported in, instead of counting to
   * a magic number and sniffing for a specific property name. Add/remove/reorder
   * children here only.
   */
  private readonly expectedForms: (keyof DMPForm)[] = [
    'basicInfo',
    'personel',
    'keyWordsAndPhrases',
    'technicalRequirements',
    'ethicalIssues',
    'securityAndPrivacy',
    'dataDescription',
    'dataPreservation',
  ];
  /** Which child forms have registered so far. */
  private readyForms = new Set<keyof DMPForm>();

  private get allFormsReady(): boolean {
    return this.expectedForms.every(f => this.readyForms.has(f));
  }

  action: string = "";
  id: string | null = null;
  formSaved: boolean = true;


  
  // ============================================================================
  // CONCEPT
  // ----------------------------------------------------------------------------
  // The forms emit their initial values in TWO passes during load (startWith on
  // each child's valueChange output, then again when the @Input setter patches
  // the loaded data). A time-based "load window" can't reliably span both passes.
  //
  // Instead: keep a deep-cloned snapshot of the loaded record (`loadedSnapshot`).
  // On every valueChanges, the button is enabled ONLY if the current dmp differs
  // from that snapshot. Re-emitting the same loaded values -> deep-equal -> stays
  // disabled. A genuine user edit -> differs -> enabled. Timing-independent.
  //
  // Requires lodash (already used across this project):
  //   import _ from 'lodash';   // or: import * as _ from 'lodash';
  // ============================================================================

  /** Deep snapshot of the record as loaded/last-saved. The form is considered
   *  "unchanged" (save disabled) whenever the live dmp deep-equals this. */
  private loadedSnapshot: DMP_Meta | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private dmp_Service: DmpService,
    private route: ActivatedRoute,
    private router: Router,
    private form_buttons: SubmitDmpService,
    private formChanged: FormChangedService,
    private peopleUpdates: UpdateNistContributorService
  ) {
    afterNextRender(() => {
      this.dmpFormGrp.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          // console.log( 'allFormsReady =', this.allFormsReady,
          //             '| readyForms =', [...this.readyForms]);
          this.refreshSaveButtonState();
        });
    });
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  ngOnInit(): void {
    this.formButtonSubscribe();
    this.formExportFormatSubscribe();

    this.id = this.route.snapshot.paramMap.get('id');
    this.resolveActionFromRoute();

    if (this.action === "new") {
      this.initNewDmp();
    } else {
      this.initExistingDmp();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================================================
  // Init helpers
  // ==========================================================================

  /** Reads the route's `action` data and sets the name field's enabled state. */
  private resolveActionFromRoute(): void {
    this.route.data
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.action = data["action"];
        if (this.action === "edit") {
          this.nameClass = "mnemonicNameDisabled";
          this.nameDisabled = true;
        } else {
          this.nameClass = "mnemonicNameNew";
          this.nameDisabled = false;
        }
      });
  }

  /**
   * New DMP: no record exists yet, so there is nothing to check ACLs against.
   * The user creating the record is implicitly the writer. We skip all four
   * aclsPermission() calls (which would hit the API with a null record id) and
   * just load a blank record.
   */
  private initNewDmp(): void {
    this.dmp_Service.fetchDMP("new", null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dmpData) => {
          this.initialDMP = dmpData;
          this.dmp = dmpData;

          this.canWrite = true;
          this.isAdmin = false;
          this.canDelete = false;

          this.loadedSnapshot = _.cloneDeep(dmpData);
          this.disableSaveButton();
        },
        error: (error) => this.handleLoadError(error),
      });
  }

  /**
   * Existing DMP: gate on read access first, then fetch the record together
   * with the write/admin/delete permissions in a single forkJoin.
   * open the load window before data arrives
   */
  private initExistingDmp(): void {

    this.dmp_Service.aclsPermission(this.id, 'read').pipe(
      switchMap(hasReadAccess => {
        if (!hasReadAccess) {
          this.router.navigate(
            ['error', { dmpError: "You do not have read privileges for this record." }]
          );
          return EMPTY; // kills the stream so next() never runs
        }
        return forkJoin({
          dmpData:    this.dmp_Service.fetchDMP(this.action, this.id),
          writePerm:  this.dmp_Service.aclsPermission(this.id, 'write'),
          adminPerm:  this.dmp_Service.aclsPermission(this.id, 'admin'),
          deletePerm: this.dmp_Service.aclsPermission(this.id, 'delete'),
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      // ============================================================================
      // ROOT CAUSE
      // ----------------------------------------------------------------------------
      // Problem that is now solved is "Save" button being enabled on DMP record load.
      // The example here shows one field (dataSizeDescription) in DMP record, but 
      // can be extrapolated to any field that is not present in a legacy DMP record.
      //
      // The final diff is a SHAPE mismatch, not a value edit:
      //   dataSizeDescription -> present on live dmp (""), absent on the snapshot.
      //
      // The loaded backend record predates the dataSizeDescription field, so it has
      // no such key. The technical-requirements form binds the field and patches ""
      // into this.dmp. The snapshot (cloned straight from dmpData.data) never had it.
      //
      // Older records can be missing ANY newer field, so hard-coding dataSizeDescription
      // is a losing game. Instead, normalize BOTH the working record and the snapshot
      // to the same canonical shape by layering the loaded data over the default
      // template — the same defaults the forms themselves assume.
      // ============================================================================
      next: ({ dmpData, writePerm, adminPerm, deletePerm }) => {
        // Canonicalize: start from the blank template shape, overlay loaded data.
        // _.merge deep-merges, so nested objects (funding, softwareDevelopment,
        // ethical_issues, security_and_privacy) get their missing keys filled too.
        const shaped: DMP_Meta = _.merge(this.dmp_Service.getBlankDmp(), dmpData.data);

        this.initialDMP = shaped;
        this.dmp = shaped;
        this.name.setValue(dmpData.name);

        // Baseline now has the SAME shape the forms will produce.
        this.loadedSnapshot = _.cloneDeep(shaped);

        this.canWrite = writePerm;
        this.isAdmin = adminPerm;
        this.canDelete = deletePerm;
      },
      error: (error) => {
        this.handleLoadError(error);
      },
    });
  }

  /** Shared error path for both load flows. */
  private handleLoadError(error: any): void {
    console.error(error?.message ?? error);
    this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
  }

  // ==========================================================================
  // Child form registration
  // ==========================================================================

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
    this.readyForms.add(name);
  }

  // ==========================================================================
  // patchDMP — note the changed init-state detection (no magic number)
  // ==========================================================================

  patchDMP(patch: Partial<DMP_Meta>) {
    if (!this.dmp) throw new Error("Missing DMP in patch");

    this.dmp = { ...this.dmp, ...patch };

    this.refreshSaveButtonState();

    if (this.canWrite) {
      this.autoSaveSubscribe();
    }
  }

  /**
   * Enables the save button iff the live form differs from the loaded/last-saved
   * snapshot. Called on every valueChanges and right after the snapshot is taken.
   */
  private refreshSaveButtonState(): void {
    // Before we have a baseline (mid first-load), never show unsaved changes.
    if (!this.loadedSnapshot) {
      this.disableSaveButton();
      this.formSaved = true;
      return;
    }

    const changed = !_.isEqual(this.dmp, this.loadedSnapshot);

    if (changed) {
      const live: any = this.dmp;
      const snap: any = this.loadedSnapshot;
      const keys = new Set([...Object.keys(live), ...Object.keys(snap)]);
      const diffs: any[] = [];
      keys.forEach(k => {
        const inLive = Object.prototype.hasOwnProperty.call(live, k);
        const inSnap = Object.prototype.hasOwnProperty.call(snap, k);
        if (!inLive || !inSnap) {
          diffs.push({ key: k, presentInLive: inLive, presentInSnap: inSnap,
                       liveVal: live[k], snapVal: snap[k] });
        } else if (!_.isEqual(live[k], snap[k])) {
          diffs.push({ key: k, liveType: typeof live[k], snapType: typeof snap[k],
                       liveVal: live[k], snapVal: snap[k] });
        }
      });
      // console.log('[refreshSaveButtonState] CHANGED. Diffs:', JSON.stringify(diffs));
    }

    if (changed) {
      this.enableSaveButton();
      this.formSaved = false;
    } else {
      this.disableSaveButton();
      this.formSaved = true;
    }
  }

  // ==========================================================================
  // Subscriptions — all torn down via takeUntil(this.destroy$)
  // ==========================================================================

  /** Reacts to the Reset / Save / Download buttons in the control bar. */
  private formButtonSubscribe(): void {
    this.form_buttons.buttonSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.formButtonMessage = message; // the message itself is the trigger
          if (this.formButtonMessage === "Reset") {
            this.resetDmp();
          } else if (this.formButtonMessage === "Save") {
            if (this.canWrite) {
              this.saveDraft();
            } else {
              alert("Can not save changes to DMP because you don't have write privileges on this record.");
            }
          } else if (this.formButtonMessage === "Download") {
            this.handleDownloadRequest();
          }
        }
      });
  }

  /** Extracted from the old inline Download branch for readability. */
  private handleDownloadRequest(): void {
    if (this.dmpExportFormatType === "") {
      alert("Please select DMP export format from the drop down menu.");
      return;
    }
    if (!this.formSaved) {
      alert("Please save changes to your DMP form before exporting.");
      return;
    }
    // Prevent the browser from exporting a DMP twice when creating a fresh record.
    if (this.action !== "new") {
      this.exportDMP(this.dmpExportFormatType);
    }
  }

  /** Tracks the export format selected in the control bar's dropdown. */
  private formExportFormatSubscribe(): void {
    this.form_buttons.exportFormatSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.dmpExportFormatType = message;
        }
      });
  }
 
  /**
   * Autosave triggered by the people-service reconciliation in the personel
   * component. Contributor-metadata updates and primary-contact OU updates
   * arrive on two separate subjects, but a single reconciliation pass can emit
   * on BOTH. We merge them and debounce so that one logical pass results in
   * exactly one saveDraft() — instead of two competing saves, each firing its
   * own router.navigate(['edit', id]).
   *
   * Wired at most once; patchDMP() may call this on every patch.
   */
  private autoSaveSubscribe(): void {
    if (this.autoSaveWired) return;
    this.autoSaveWired = true;

    merge(
      this.peopleUpdates.updateNISTContrib$,
      this.peopleUpdates.updateOUs$
    ).pipe(
      filter((indicator: UpdateIndicator) => indicator.isUpdated),
      debounceTime(50),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.autoSaveInProgress = true;
        this.saveDraft();
      }
    });
  }

  private changeElementClass (elID:string, add:string, remove:string){
    var saveButton = document.getElementById(elID);
    saveButton?.classList.remove(add);
    saveButton?.classList.remove(remove);

    saveButton?.classList.add(add);

  }

  enableSaveButton(){
    this.formChanged.disableSaveBtn$.next(false);
    this.changeElementClass("btnSave", "btn_update", "btn_draft"); // add btn_update class, remove btn_draft class
  }

  disableSaveButton(){
    this.formChanged.disableSaveBtn$.next(true);
    this.changeElementClass("btnSave", "btn_draft", "btn_update"); // add btn_draft class, remove btn_update class
  }

  onSubmit() {
    // For demo purposes make onSumit identical to saving a draft
    // later new logic will have to be implemented for proper proceduere
    // of submitting a DMP record for publishing
    this.saveDraft();

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
      if (this.action !=="new"){

        this.dmp_Service.updateDMP(this.dmp, this.id).subscribe(
          {
            next: data => {
              // try to reload the page to read the saved dmp from mongodb
              this.router.navigate(['edit', this.id]);
              this.disableSaveButton();
              this.formSaved = true;

              if (this.autoSaveInProgress) {
                // Autosave from people-service reconciliation: stay silent,
                // the personel panel already shows what changed.
                this.autoSaveInProgress = false;
              } else {
                // Normal user-initiated save confirmation.
                alert("Successfuly saved DMP record");
              }
            },
            error: error => {
              console.log(error);
              console.error(error.message);
              this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
            }
            
          }
        );
      }
      
    }
    else {
      //create a new DMP
      this.dmp_Service.createDMP(this.dmp, this.name.value).subscribe(
        {
          next: data => {
            this.id = data.id;
            this.router.navigate(['edit', data.id]);
            this.disableSaveButton();
            this.formSaved = true;
          },
          error: error => {
            console.error(error.message);
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

  exportDMP(dmpFormat:string) {
    if (dmpFormat === "JSON"){
      let dmp_record : DMP_Meta | undefined = this.dmp;
      const blob = new Blob([JSON.stringify(dmp_record, null, 2)], {type: "text/json"});
      saveAs(blob, "DMP.json");
    }
    else{
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
          this.markdown.push("**Title:** " + this.escapeMarkdownText(this.dmp?.title) + "  \n");
      }

      // Start Date
      if (this.dmp?.startDate !== undefined && this.dmp?.startDate !== null){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Start Date", this.dmp?.startDate);
        if (dmpFormat === "Markdown") 
          this.markdown.push("**Start Date:** " + this.escapeMarkdownText(this.dmp?.startDate) + "  \n");
      }

      // End Date
      /*
      if (this.dmp?.endDate !== undefined && this.dmp?.endDate !== null){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("End Date", this.dmp?.endDate);
        if (dmpFormat === "Markdown") 
          this.markdown.push("**End Date:** " + this.escapeMarkdownText(this.dmp?.endDate) + "  \n");
      }
      */

      // Make DMP searchable
      if (this.dmp?.dmpSearchable !== undefined && this.dmp?.dmpSearchable !== null){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Make DMP Searchable", this.dmp?.dmpSearchable);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Make DMP Searchable:** " + this.escapeMarkdownText(this.dmp?.dmpSearchable) + "  \n");
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
          this.markdown.push("**Project Description:** " + this.escapeMarkdownText(this.dmp?.projectDescription) + "  \n");
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
          tblHeaders[2] = "Primary Contact"; 
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
          this.DMP_PDF.printTextField("Estimated Data Size", this.dmp?.dataSize + this.dmp.sizeUnit + " " + this.dmp?.dataSizeDescription);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Estimated Data Size:** " + this.escapeMarkdownText(this.dmp?.dataSize + this.dmp.sizeUnit + " " + this.dmp?.dataSizeDescription) + "  \n");
      }

      //Software Development
      if(this.dmp?.softwareDevelopment !== undefined && this.dmp?.softwareDevelopment !== null){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Software Development", this.dmp?.softwareDevelopment.development);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Software Development:** " + this.escapeMarkdownText(this.dmp?.softwareDevelopment.development) + "  \n");

        //Software developed for this project will be for
        if(this.dmp?.softwareDevelopment.softwareUse !== ""){
          if (dmpFormat === "PDF")
            this.DMP_PDF.printTextField("Software developed for this project will be for", this.dmp?.softwareDevelopment.softwareUse);
          if (dmpFormat === "Markdown")
            this.markdown.push("**Software developed for this project will be for:** " + this.escapeMarkdownText(this.dmp?.softwareDevelopment.softwareUse) + "  \n");
        }

        //Does the software development require a database?
        if(this.dmp?.softwareDevelopment.softwareDatabase !== ""){
          if (dmpFormat === "PDF")
            this.DMP_PDF.printTextField("Does the software development require a database?", this.dmp?.softwareDevelopment.softwareDatabase);
          if (dmpFormat === "Markdown")
            this.markdown.push("**Does the software development require a database?:** " + this.escapeMarkdownText(this.dmp?.softwareDevelopment.softwareDatabase) + "  \n");
        }

        //Will the software development produce a website interface?
        if(this.dmp?.softwareDevelopment.softwareWebsite !== ""){
          if (dmpFormat === "PDF")
            this.DMP_PDF.printTextField("Will the software development produce a website interface?", this.dmp?.softwareDevelopment.softwareWebsite);
          if (dmpFormat === "Markdown")
            this.markdown.push("**Will the software development produce a website interface?:** " + this.escapeMarkdownText(this.dmp?.softwareDevelopment.softwareWebsite) + "  \n");
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
          this.markdown.push("**IRB number:** " + this.escapeMarkdownText(this.dmp?.ethical_issues.irb_number) + "  \n");
      }

      if(this.dmp?.ethical_issues !== undefined){
        //Are there any ethical issues related to the data that this DMP describes?
        if(this.dmp?.ethical_issues.ethical_issues_exist !== ""){
          if (dmpFormat === "PDF")
            this.DMP_PDF.printTextField("Are there any ethical issues related to the data that this DMP describes?", 
                                      this.dmp?.ethical_issues.ethical_issues_exist);
          if (dmpFormat === "Markdown")
            this.markdown.push("**Are there any ethical issues related to the data that this DMP describes?:** " + this.escapeMarkdownText(this.dmp?.ethical_issues.ethical_issues_exist) + "  \n");
        }

        //Describe any ethical issues raised in this project (human subjects etc)
        if(this.dmp?.ethical_issues.ethical_issues_description !== ""){
          if (dmpFormat === "PDF")
            this.DMP_PDF.printTextField("Describe any ethical issues raised in this project (human subjects etc)", 
                                      this.dmp?.ethical_issues.ethical_issues_description);
          if (dmpFormat === "Markdown")
            this.markdown.push("**Describe any ethical issues raised in this project (human subjects etc):** " + this.escapeMarkdownText(this.dmp?.ethical_issues.ethical_issues_description) + "  \n");
                            
        }

        //Ethical issues report
        if(this.dmp?.ethical_issues.ethical_issues_report !== ""){
          if (dmpFormat === "PDF")
            this.DMP_PDF.printTextField("Ethical issues report", 
                                      this.dmp?.ethical_issues.ethical_issues_report);
          if (dmpFormat === "Markdown")
            this.markdown.push("**Ethical issues report:** " + this.escapeMarkdownText(this.dmp?.ethical_issues.ethical_issues_report) + "  \n");
            
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
          this.markdown.push(this.escapeMarkdownText(this.dmp?.dataDescription) + "  \n");
    
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
          this.markdown.push("**Preservation Description**:" + this.escapeMarkdownText(this.dmp?.preservationDescription) + "  \n");
      }

      // Describe your plans for making the data discoverable (findable) and accessible
      if (this.dmp?.dataAccess !== undefined && this.dmp?.dataAccess !== null){
        if (dmpFormat === "PDF")
          this.DMP_PDF.printTextField("Data discoverablity and accessiblity plan", this.dmp?.dataAccess);
        if (dmpFormat === "Markdown")
          this.markdown.push("**Data discoverablity and accessiblity plan**:" + this.escapeMarkdownText(this.dmp?.dataAccess) + "  \n");
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
  }  

  private markdownTable(fieldName: string, tblHead: Array<string>, tblBody: Array<Array<string>>) {
    if (fieldName !== "") {
      this.markdown.push("  \n");
      this.markdown.push("**" + this.escapeMarkdownText(fieldName) + ":**  \n");
    }
    this.markdown.push("  \n");

    const headerText = "|" + tblHead.map(h => this.escapeMarkdownCell(h)).join("|") + "|  \n";
    this.markdown.push(headerText);

    let headerSeparator = "|";
    for (let i = 0; i < tblHead.length; i++) {
      headerSeparator += " --- |";
    }
    headerSeparator += "  \n";
    this.markdown.push(headerSeparator);

    for (let i = 0; i < tblBody.length; i++) {
      const tblRowContent = "|" + tblBody[i].map(c => this.escapeMarkdownCell(c)).join("|") + "|  \n";
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

  /**
   * Escapes a value for safe inclusion in a Markdown TABLE CELL.
   * Neutralizes pipes (which break table structure), newlines, and the
   * leading block-level markers that could inject headings/quotes/lists.
   * Also defuses inline HTML and link syntax.
   */
  private escapeMarkdownCell(value: any): string {
    if (value === null || value === undefined) return "";
    let s = String(value);

    // Collapse newlines — they break table rows entirely.
    s = s.replace(/\r\n|\r|\n/g, " ");

    // Escape backslash first so our other escapes aren't double-eaten.
    s = s.replace(/\\/g, "\\\\");

    // Pipe is the table delimiter.
    s = s.replace(/\|/g, "\\|");

    // Neutralize inline HTML by escaping angle brackets.
    s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Defuse link / image syntax and inline code.
    s = s.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
    s = s.replace(/`/g, "\\`");

    return s;
  }

  /**
   * Escapes a value for safe inclusion in Markdown PROSE (the **field:** lines),
   * where pipes are harmless but block-level markers and HTML still matter.
   */
  private escapeMarkdownText(value: any): string {
    if (value === null || value === undefined) return "";
    let s = String(value);

    s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    s = s.replace(/`/g, "\\`");

    // Escape leading block markers on each line so a value can't start a
    // heading, blockquote, or list item.
    s = s.replace(/^(\s*)([#>\-*+])/gm, "$1\\$2");

    return s;
  }
}
