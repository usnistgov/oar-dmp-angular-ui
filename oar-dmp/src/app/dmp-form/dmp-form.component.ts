import { Component, OnInit, OnDestroy, ViewChild, afterNextRender } from '@angular/core';
import { ObservedValueOf, Subject, merge, forkJoin, switchMap, EMPTY } from "rxjs";
import { UntypedFormBuilder } from '@angular/forms';
import { BasicInfoComponent } from '../form-components/basic-info/basic-info.component';
import { PersonnelComponent } from '../form-components/personnel/personnel.component';
import { KeywordsComponent } from '../form-components/keywords/keywords.component';
import { TechnicalRequirementsComponent } from '../form-components/technical-requirements/technical-requirements.component';
import { EthicalIssuesComponent } from '../form-components/ethical-issues/ethical-issues.component';
import { SecurityAndPrivacyComponent } from '../form-components/security-and-privacy/security-and-privacy.component';
import { DataDescriptionComponent } from '../form-components/data-description/data-description.component';
import { DataPreservationComponent } from '../form-components/data-preservation/data-preservation.component';
import { DMP_Meta } from '../types/DMP.types';
import { DmpService } from '../shared/dmp.service'
import { SubmitDmpService } from '../shared/submit-dmp.service';//for acknowledging when form button has been 'pressed'
import { FormChangedService } from '../shared/form-changed.service';
import { UpdateNistContributorService } from '../shared/update-nist-contributor.service';
import { DmpExportService } from '../shared/dmp-export.service';
import { UntypedFormControl } from '@angular/forms';
import { UpdateIndicator } from '../types/update-indicator.type';

import { takeUntil, filter, debounceTime } from 'rxjs/operators';

import { Router, ActivatedRoute } from '@angular/router';

import _ from 'lodash';   // or: import * as _ from 'lodash';


//  Interface for the DMP interface. This is where we define observed values of
//  different DMP form components
interface DMPForm {
  basicInfo?: ObservedValueOf<BasicInfoComponent["formReady"]>;
  personnel?: ObservedValueOf<PersonnelComponent["formReady"]>;
  keyWordsAndPhrases?:ObservedValueOf<KeywordsComponent["formReady"]>;
  technicalRequirements?:ObservedValueOf<TechnicalRequirementsComponent["formReady"]>;
  ethicalIssues?: ObservedValueOf<EthicalIssuesComponent["formReady"]>;
  securityAndPrivacy?: ObservedValueOf<SecurityAndPrivacyComponent["formReady"]>;
  dataDescription?: ObservedValueOf<DataDescriptionComponent["formReady"]>;
  dataPreservation?: ObservedValueOf<DataPreservationComponent["formReady"]>;
  
}

// In the example above we have a number of child components: 
// BasicInfoComponent through TechnicalRequirementsComponent, 
// which are combined into the main form group as basicInfo through dataPreservation. 
// We define them all as optional because initially our form group will 
// be empty until the first child component has emitted its formReady event.


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
  @ViewChild(TechnicalRequirementsComponent) technicalRequirementsTable!: TechnicalRequirementsComponent;
  // For clearing Contributors resources table
  @ViewChild(PersonnelComponent) personnelForm!: PersonnelComponent;
 
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

  name = new UntypedFormControl('');
  nameDisabled = false;
  nameClass:string = "mnemonicNameNew";

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
    'personnel',
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
    private peopleUpdates: UpdateNistContributorService,
    private exportService: DmpExportService
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

  /** Reacts to the  / Save / Download buttons in the control bar. */
  private formButtonSubscribe(): void {
    this.form_buttons.buttonSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.formButtonMessage = message; // the message itself is the trigger
          if (this.formButtonMessage === "Save") {
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
    // Prevent exporting twice when creating a fresh record.
    if (this.action !== "new") {
      this.exportService.export(this.dmp, this.dmpExportFormatType as any);
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
   * Autosave triggered by the people-service reconciliation in the personnel
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

  enableSaveButton() {
    this.formChanged.disableSaveBtn$.next(false);
    this.formChanged.hasUnsavedChanges$.next(true);
  }

  disableSaveButton() {
    this.formChanged.disableSaveBtn$.next(true);
    this.formChanged.hasUnsavedChanges$.next(false);
  }

  onSubmit() {
    // For demo purposes make onSumit identical to saving a draft
    // later new logic will have to be implemented for proper proceduere
    // of submitting a DMP record for publishing
    this.saveDraft();

  }

  saveDraft(){
    // Guard: form data must be loaded. (A missing dmp is a load problem, not
    // an empty name — the old message conflated the two.) Early-return instead
    // of throwing: the user already saw the alert, and an uncaught throw here
    // just produces a dead console error.
    if (!this.dmp) {
      alert("Cannot save DMP: form data is not loaded.");
      return;
    }
    if (this.name.value === '') {
      alert("Cannot save DMP. Record name is empty.");
      return;
    }
    
    if (this.id !== null) {
      // If id is not null then update dmp with the current id
      if (this.action !== "new") {
        this.dmp_Service.updateDMP(this.dmp, this.id).subscribe({
          next: data => {
            // try to reload the page to read the saved dmp from mongodb
            this.router.navigate(['edit', this.id]);
            this.disableSaveButton();
            this.formSaved = true;

            if (this.autoSaveInProgress) {
              // Autosave from people-service reconciliation: stay silent,
              // the personnel panel already shows what changed.
              this.autoSaveInProgress = false;
            } else {
              // Normal user-initiated save confirmation.
              alert("Successfully saved DMP record");
            }
          },
          error: error => {
            console.error(error.message);
            this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
          }
        });
      }
    } else {
      // create a new DMP
      this.dmp_Service.createDMP(this.dmp, this.name.value).subscribe({
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
      });
    }
    
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

  
}
