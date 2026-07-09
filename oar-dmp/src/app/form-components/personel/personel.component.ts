import { Component, OnDestroy, Input, Output } from '@angular/core';
import { confirmDialog } from 'src/app/shared/dmp.service';
import { ROLES } from '../../types/contributor-roles';
import { Contributor } from '../../types/contributor.type';
import { DropDownSelectService } from '../../shared/drop-down-select.service';

import { UntypedFormBuilder } from '@angular/forms';
import { Observable, defer, of, startWith, from, forkJoin, Subject } from 'rxjs';
import { concatMap, map, switchMap, catchError, tap, takeUntil } from 'rxjs/operators';
import { DMP_Meta } from '../../types/DMP.types';
// import { ORGANIZATIONS } from '../../types/mock-organizations';
import { NistOrganization } from 'src/app/types/nist-organization';
import { Person } from 'src/app/types/person.type';
import { ResponsibleOrganizations } from 'src/app/types/responsible-organizations.type';


import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';
import { UpdateNistContributorService } from 'src/app/shared/update-nist-contributor.service';

import * as _ from 'lodash';

// The RAW shape coming back from StaffDirectoryService.getRecord().
// It's a Person, except the service can return null for orcid/email.
type PeopleServiceRecord = Omit<Person, 'orcid' | 'emailAddress'> & {
  orcid: string | null;
  emailAddress: string | null;
  peopleID: number;   // present on raw record
};

// used for dropdown menu containing values "Yes" and "No" to indicate
// wheter a NIST DMP contributor is a primary contact
interface primaryContactValues {
  id: number;
  value: string;
}

interface DataContributor extends Contributor{
  id: number;
  isEdit: boolean;
}

/** The object threaded through the autoupdate pipeline for each contributor. */
interface ContribReconcileResult {
  dmpContributor: DataContributor;
  psRec?: PeopleServiceRecord;
  changed: boolean;
}

interface externalContributor{
  firstName: string;
  lastName:string;
  orcid:string;
  institution:string;
  emailAddress:string;
  role:string;
}

/**
 * A single field change applied automatically from the People Service.
 * Held in component view-state only — never logged or persisted, since it
 * carries contributor PII.
 */
interface AutoUpdateChange {
  contributorName: string;
  field: string;        // human-readable label, e.g. "OU", "Group", "ORCID"
  from: string;         // empty string when we don't show the old value
  to: string;
  showTransition: boolean;  // true => render "from → to"; false => render "to" only
}

// Schema for Contributors data table
const CONTRIB_COL_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
  {
    key: 'firstName',
    type: 'text',
    label: 'Name',
  },
  {
    key: 'lastName',
    type: 'text',
    label: 'Surname',
  },
  {
    key: 'primary_contact',
    type: 'text',
    label: 'Primary Contact',
  },
  {
    key: 'institution',
    type: 'text',
    label: 'Institution',
  },
  {
    key: 'groupNumber',
    type: 'text',
    label: 'ORG ID',
  },  
  {
    key: 'role',
    type: 'text',
    label: 'Role',
  },
  {
    key: 'emailAddress',
    type: 'text',
    label: 'e-mail',
  },
  {
    key: 'orcid',
    type: 'text',
    label: 'ORCID',
  },
  
  
]

interface dmpOrganizations {
  groupName: string,
  groupNumber: string,
  groupOrgID: number,
  
  divisionName: string,
  divisionNumber: string,
  divisionOrgID: number,
  divisionAcronym: string,

  ouName: string,
  ouNumber: string,
  ouOrgID: number,
  ouAcronym: string,

  id: number;
  isEdit: boolean;
}

const ORG_COL_SCHEMA = [
  {
    key: 'isSelected',
    type: 'isSelected',
    label: '',
  },
  {
    key: 'groupName',
    type: 'text',
    label: 'Group Name',
  },
  {
    key: 'divisionName',
    type: 'text',
    label: 'Division Name',
  },
  {
    key: 'ouName',
    type: 'text',
    label: 'OU Name',
  },
  // Edit button column
  {
    key: 'isEdit',
    type: 'isEdit',
    label: '',
  },
]

/** The persisted/compared primary-contact values. These strings are stored
 *  on the DMP record and exported, so changing them is a data-format change. 
 *  The enum values must stay exactly 'Yes' / 'No' (not be "cleaned up" to lowercase or booleans), 
 *  or you'll break comparisons against records already saved in the database. 
 * */
const enum PrimaryContact {
  Yes = 'Yes',
  No = 'No',
}

// Anchored: the WHOLE value must be a plausible name.
// Letters (incl. accented), spaces, hyphen, apostrophe, period, comma.
// Rejects <, >, /, digits, and other control/markup characters.
const name_regex = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-.,' ]*$/;
// email regex taken from https://emailregex.com/index.html
const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const log_icon_style = 'color: #868686; font-weight: bold;';
const log_ou_style = 'color: #b60808; font-weight: bold;';
const log_normal_style = 'color: #000000;';
const log_normal_bold_style = 'color: #000000; font-weight: bold;';
const log_old_val_style = 'color: #555555; font-weight: bold;';
const log_new_val_style = 'color: #005eda; font-weight: bold;';


@Component({
  selector: 'app-personel',
  templateUrl: './personel.component.html',
  styleUrls: ['./personel.component.scss', '../form-layout.scss', '../form-table.scss']
})
export class PersonnelComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  /** Cancels any in-flight NIST autoupdate run when the input rebinds. */
  private autoUpdateCancel$ = new Subject<void>();

  /** Changes applied during the most recent autoupdate run, shown to the user
  *  in a dismissible panel. Cleared on dismiss and at the start of each run. */
  autoUpdateChanges: AutoUpdateChange[] = [];

  /** Contributors the People Service could not match during the last autoupdate
   *  run. Surfaced to the editor so they can remove people no longer at NIST.
   *  Carries the table row `id` so the panel can remove them in place.
   *  View-state only, rebuilt each run, cleared on dismiss. */
  unmatchedContributors: { id: number; contributorName: string; peopleID: number }[] = [];

  // ================================
  // used for organizations table
  // ================================
  org_disableAdd:boolean = true;
  org_disableClear:boolean = true;
  org_disableRemove:boolean = true;
  org_errorMessage: string = '';
  dmpOrganizations: dmpOrganizations[] = []
  org_displayedColumns: string[] = ORG_COL_SCHEMA.map((col) => col.key);
  org_columnsSchema: any = ORG_COL_SCHEMA;
  fltr_NIST_Org!: Observable<SDSuggestion[]>;

  // ================================  
  /** 
   * Organizations hierarchy:
   * based on  orG_LVL_ID number
   * level 3 = group
   * level 2 = division
   * level 1 = lab
   * occasionally theyre are leves less than 3 such as orG_LVL_ID = 5 being NIST Headquarters
   * those are top level orgs so they are level 1
   */
  // ================================  
  orgGroupOrgID!:number;
  orgGroupNumber!:string;
  orgGroupName!:string;

  orgDivisionOrgID!:number;
  orgDivisionNumber!:string;
  orgDivisionName!:string;
  orgDivisionAcronym!:string;

  orgOuOrgID!:number;
  orgOuNumber!:string;
  orgOuName!:string;
  orgOuAcronym!:string;

  disableAdd:boolean = true;
  disableClear:boolean = true;
  disableRemove:boolean = true;

  contrib_dispCols: string[] = CONTRIB_COL_SCHEMA.map((col) => col.key);
  contrib_colSchema: any = CONTRIB_COL_SCHEMA;
  dmpContributors: DataContributor[] = []

  /** Staging buffer for the contributor currently being assembled before "Add". */
  crntContrib: Contributor = this.emptyContributor();

  nistContribRole: string = "";

  extContribRole: string = "";

  primaryContact: string = "";
  primaryContactSelection: string = "";
  
  primaryContactOptions: Array<primaryContactValues> = [
    { id: 0, value: PrimaryContact.Yes },
    { id: 1, value: PrimaryContact.No },
  ];
  
  contributorRoles = ROLES; // sets hardcoded roles values
  
  fltr_NIST_Contributor!: Observable<SDSuggestion[]>;

  // Default values of external contributor
  externalContributor: Contributor = this.emptyContributor();

  contribOrcidWarn: string = ""; //contributor orcid warning message
  errorMessage: string = ""; // contributor error message
  static ORCID_ERROR = "Invalid ORCID format. The correct ORCID format is of the form xxxx-xxxx-xxxx-xxxx where first three groups are numeric and final fourth group is numeric with optional letter 'X' at the end";
  static ORCID_WARNING = "Warning: Missing contributor ORCID information. While this is not a mandatory field for a DMP it will be required if this DMP results in a publication.";
  
  // =====================
  //  for people service
  // =====================

  minPromptLength = 2;                  // don't do any searching of people service unless we have 2 chars
  // for people search
  sd_index: SDSIndex|null = null;       // the index we will download after the first minPromptLength (2) characters are typed
  suggestions: SDSuggestion[] = []      // the current list of suggested completions matching what has been typed so far.

  //for organizations search
  org_index: SDSIndex|null = null;      // the index we will download after the first minPromptLength (2) characters are typed
  orgSuggestions: SDSuggestion[] = []   // the current list of suggested completions matching what has been typed so far.

  NISTPersonMetaChanged: boolean = false; // use to indicate that a dmp contributor from NIST had change in metadata since the last load of the record (such as change of OU or ORCID)
  PrimContribOUChanged:boolean = false // use to indicate that OU of a primary contact associated with the DMP record has changed
  PrimContribNewOU:number = 0;

  contribsUpdated: number = 0;  // used to count how many contributors had metadata updated when reading an exsisting DMP record
  OUsUpdated: number = 0;  // used to count how many primary contributors had changed OUs when reading an exsisting DMP record
   
  constructor(
    private dropDownService: DropDownSelectService,
    private fb: UntypedFormBuilder,
    private sdsvc: StaffDirectoryService,
    private peopleUpdates: UpdateNistContributorService
  ) {
    this.getNistContactsFromAPI();
    this.getNistOrganizations();
    this.peopleUpdates.updateNISTContrib$.next({ numUpdates: this.contribsUpdated, isUpdated: false });
    this.peopleUpdates.updateOUs$.next({ numUpdates: this.OUsUpdated, isUpdated: false });
  }

  personelForm = this.fb.group(
    {
      dmp_contributor:            [''],
      contributors:               [[]],
      nistOrganization:           [],
      organizations:              [[]]
    }
  );

  // We want to receive the initial data from the parent component and initialize 
  // the form values. For that we create an input property with a setter that updates 
  // the form. Here you could do any data transformation you need.
  @Input()
  set initialDMP_Meta(personel: DMP_Meta) {
    // Cancel any autoupdate from a previous bind before we replace the data.
    this.autoUpdateCancel$.next();

    // Reset the arrays at the top of the setter to prevent duplicated rows if the setter ever fires twice
    this.dmpContributors = [];
    this.dmpOrganizations = [];

    if (Object.keys(personel).length < 1){
      this.personelForm.patchValue({
        contributors:               [],
        organizations:              []
      });
      return;
    }

    // loop over organizations array sent from the server and populate local copy of 
    // organizations aray in order to populate the table of organizations in the GUI interface
    personel.organizations.forEach( 
      (org, index) => {        
        this.dmpOrganizations.push(
          {
            id:index,
            groupName:org.groupName,
            groupNumber: org.groupNumber,
            groupOrgID: org.groupOrgID,
            
            divisionName:org.divisionName,
            divisionNumber: org.divisionNumber,
            divisionOrgID: org.divisionOrgID,
            divisionAcronym: org.divisionAcronym,

            ouName: org.ouName,
            ouNumber: org.ouNumber,
            ouOrgID: org.ouOrgID,
            ouAcronym: org.ouAcronym,            
            
            isEdit:false
          }
        );
        this.org_disableClear=false;
        this.org_disableRemove=false;
      }
    );

    // loop over contributors array sent from the server and populate local copy
    this.contribOrcidWarn = '';
    personel.contributors.forEach(
      (dmpContributor, index) => {
        if (!dmpContributor.orcid){
          this.contribOrcidWarn = PersonnelComponent.ORCID_WARNING;
        }
        this.dmpContributors.push({
          id:           index, 
          isEdit:       false, 

          peopleID:         dmpContributor.peopleID ?? 0,   // <-- default for legacy records
      
          firstName:        dmpContributor.firstName,
          lastName:         dmpContributor.lastName,
          orcid:            dmpContributor.orcid,
          emailAddress:     dmpContributor.emailAddress,

          groupOrgID:       dmpContributor.groupOrgID,
          groupNumber:      dmpContributor.groupNumber,
          groupName:        dmpContributor.groupName,

          divisionOrgID:    dmpContributor.divisionOrgID,
          divisionNumber:   dmpContributor.divisionNumber,
          divisionName:     dmpContributor.divisionName,

          ouOrgID:          dmpContributor.ouOrgID,
          ouNumber:         dmpContributor.ouNumber,
          ouName:           dmpContributor.ouName,
      
          primary_contact:  dmpContributor.primary_contact,
          role:             dmpContributor.role,
          institution:      dmpContributor.institution
        });
        this.disableClear=false;
        this.disableRemove=false;
      }
    );

    this.syncContributorsToForm();
    this.syncOrganizationsToForm();

    // Now that contributors are actually loaded, run the People Service autoupdate.
    this.runNistAutoUpdate();
  }

  // Because RxJS observables are compatible with Angular EventEmitters we can create an 
  // observable with of() that emits the created form group and use it as an output.
  @Output()
  formReady = of(this.personelForm);

  // We need to extract the form values and provide them to the parent component whenever 
  // a value changes. And again we can provide an observable as @Output() instead of creating 
  // an event emitter:
  @Output()
  valueChange = defer(() =>
    this.personelForm.valueChanges.pipe(
      startWith(this.personelForm.value),
      map(
        (formValue): Partial<DMP_Meta> =>(
          {
            contributors:           formValue.contributors,
            organizations:          formValue.organizations
          }
        )
      )
    )
  );

  /**
   * Reconciles loaded NIST contributors against the People Service and
   * auto-applies any metadata changes. Triggered from the input setter once
   * contributor data has actually been populated (NOT from ngOnInit, which
   * would snapshot an empty array before the async data arrives).
   */
  private runNistAutoUpdate(): void {
    // Nothing to reconcile for an empty list; avoids an empty subscribe whose
    // complete() would reset the flags prematurely.
    if (this.dmpContributors.length === 0) {
      return;
    }

    // Reset counters/flags so a rebind doesn't carry stale state into this run.
    this.contribsUpdated = 0;
    this.OUsUpdated = 0;
    this.NISTPersonMetaChanged = false;
    this.PrimContribOUChanged = false;
    this.autoUpdateChanges = [];   // <-- reset the summary for this run

    this.unmatchedContributors = [];

    // 1. Use dmpContributors as your source array and create the observable
    // 'from' emits each array element one by one
    const dmpContribObs = from(this.dmpContributors);

    // 2. Process contributors one by one to prevent race conditions
    const processedObservable = dmpContribObs.pipe(
      // Iterate through contributors, check if a contributor is from NIST
      // If it is a NIST contributor call people service to check if any
      // information about the person has been changed (change of OU, ORCID etc.)
      // If there is a change update metadata and set NISTPersonMetaChanged to true to
      // indicate that this data needs to be automatically saved without any user interaction
      concatMap((dmpContributor: DataContributor) => {

        if (!dmpContributor.institution || dmpContributor.institution.toUpperCase() !== 'NIST') {
          // don't perform autoupdate for external contributors
          // Note the of<ContribReconcileResult>(...) — annotating the of here helps TypeScript infer the branch type consistently with the other branches, which matters for the union the concatMap produces.
         return of<ContribReconcileResult>({ dmpContributor, changed: false });
        }
        const usrLastName = dmpContributor.lastName;

        // Call people service for the index
        return this.sdsvc.getPeopleIndexFor(usrLastName).pipe(
          switchMap((idx: SDSIndex | null) => {
            if (!idx) {
              console.warn(`${dmpContributor.firstName} ${dmpContributor.lastName} not found.`);
              // this branch warns but does not call recordUnmatchedContributor. 
              // That's because a null index can be seen as ambiguous — it could mean "no such last name" or a transient service hiccup.
              return of<ContribReconcileResult | null>(null);
            }

            // query people service on last name
            const suggestions = idx.getSuggestions(usrLastName);
            if (suggestions.length === 0) {
              console.warn(`People Service returned no suggestions for last name "${usrLastName}" ...`);
              this.recordUnmatchedContributor(dmpContributor);
              return of<ContribReconcileResult | null>(null);
            }

            //Convert the array of Promises into an array of Observables
            const suggestionObservables = suggestions.map((aPerson: any) => 
              from(aPerson.getRecord() as Promise<PeopleServiceRecord>) // Wraps the async getRecord() Promise into an Observable
            );

            // 3. Process suggestions in parallel, wait for all to finish 
            // Use the "Object" syntax for forkJoin to keep it clean and modern
            return forkJoin({
              records: forkJoin(suggestionObservables) // Wait for all records to resolve
            }).pipe(
              // The : ContribReconcileResult return annotation forces both returns to that shape — the changed:true branch supplies psRec, the changed:false branch omits it (legal because psRec? is optional).
              map((result): ContribReconcileResult => {
                // 'result.records' is now PeopleServiceRecord[] thanks to the cast above
                const records = result.records;
                // 4. Find the matching record by peopleID
                // Match the loaded contributor to a People Service record by peopleID.
                // Every NIST contributor now carries a real (positive) peopleID, so this is
                // authoritative — no more email-based matching, which broke when a directory
                // email changed (the very drift this autoupdate exists to catch).
                const psRec = records.find((rec) => rec.peopleID === dmpContributor.peopleID);

                if (psRec && this.NISTContributorHasChanged(dmpContributor, psRec)) {
                  this.updateContributorData(dmpContributor, psRec);
                  return { dmpContributor, psRec, changed: true };
                }
                else if (!psRec) {
                  // Search returned people, but none matched this contributor's peopleID.
                  // Leave the contributor untouched and record the miss for diagnosis.
                  // console.warn(`No People Service match for ${dmpContributor.firstName} ...`);
                  // console.warn(records);
                  this.recordUnmatchedContributor(dmpContributor);
                }
                return { dmpContributor, changed: false };
              })
            );
          }),
          // 5. Handle OU changes if necessary 
          switchMap((result: ContribReconcileResult | null) => {
            if (result?.changed && this.PrimContribOUChanged) {
              return this.sdsvc.getParentOrgs(this.PrimContribNewOU, true).pipe(
                tap((recs) => {
                  this.setResponsibleOrgs(recs as NistOrganization[]);
                  this.org_addRow();
                  this.peopleUpdates.updateOUs$.next({ numUpdates: ++this.OUsUpdated, isUpdated: true });
                }),
                map(() => result)
              );
            }
            return of(result);
          }),
          catchError(err => {
            console.error('Error processing contributor', err);
            return of(null);
          })
        );
      })
    );

    // 6. Final Subscription 
    processedObservable
      .pipe(
        takeUntil(this.autoUpdateCancel$),  // cancel on rebind
        takeUntil(this.destroy$)            // cancel on destroy
      )
      .subscribe({
        next: (result: ContribReconcileResult | null) => {
          if (result?.changed) {
            this.applyFinalUpdates();
          }
        },
        complete: () => {
          // Reset top-level flags 
          this.NISTPersonMetaChanged = false;
          this.PrimContribOUChanged = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.autoUpdateCancel$.next();
    this.autoUpdateCancel$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Rebuilds the form's contributors array from the dmpContributors table.
   * The table is the single source of truth; the form mirrors it.
   */
  private syncContributorsToForm(): void {
    const contributors: Contributor[] = this.dmpContributors.map((el) => ({
      peopleID:        el.peopleID,
      
      firstName:      el.firstName,
      lastName:       el.lastName,
      orcid:          el.orcid,
      emailAddress:   el.emailAddress,

      groupOrgID:     el.groupOrgID,
      groupNumber:    el.groupNumber,
      groupName:      el.groupName,

      divisionOrgID:  el.divisionOrgID,
      divisionNumber: el.divisionNumber,
      divisionName:   el.divisionName,

      ouOrgID:        el.ouOrgID,
      ouNumber:       el.ouNumber,
      ouName:         el.ouName,

      primary_contact: el.primary_contact,
      institution:     el.institution,
      role:            el.role,
    }));

    this.personelForm.patchValue({ contributors });
  }

  /**
   * Recomputes the sticky ORCID warning from the full table in one place.
   */
  private refreshOrcidWarning(): void {
    const anyMissing = this.dmpContributors.some(
      (c) => !c.orcid || c.orcid.length === 0
    );
    this.contribOrcidWarn = anyMissing ? PersonnelComponent.ORCID_WARNING : "";
  }

  /**
   * Applies changed fields from the People Service record onto the local
   * contributor in place. Operates on the RAW record (PeopleServiceRecord)
   * because the null-vs-value distinction on orcid is significant here.
   */
  private updateContributorData(dmpContributor: DataContributor, psRec: PeopleServiceRecord) {
    this.NISTPersonMetaChanged = true;
    this.contribsUpdated += 1;

    // Fields to check for changes. Typed as keys shared by both DataContributor
    // and PeopleServiceRecord so the indexing below is checked, not `any`.
    const fieldsToUpdate: (keyof Person)[] = [
      'divisionName', 'divisionNumber', 'divisionOrgID',
      'firstName', 'lastName', 'groupName', 'groupNumber',
      'groupOrgID', 'orcid', 'ouName', 'ouNumber', 'ouOrgID'
    ];

    // Subset we surface to the user (the rest are internal id/number fields)
    const fieldsToReport: (keyof Person)[] = [
      'divisionName', 'firstName', 'lastName', 'groupName', 'orcid', 'ouName'
    ];

    const contributorName = `${dmpContributor.firstName} ${dmpContributor.lastName}`;


    fieldsToUpdate.forEach((field) => {
      const oldValue = dmpContributor[field];
      const newValue = psRec[field];

      // 1. Only act if the value actually changed
      // 2. Never overwrite a valid orcid with null
      if (oldValue !== newValue && !(field === 'orcid' && newValue === null)) {

        // Capture Primary Contact OU changes while we still have the old value
        if (field === 'groupOrgID' && dmpContributor.primary_contact === PrimaryContact.Yes) {
          this.PrimContribOUChanged = true;
          this.PrimContribNewOU = newValue as number;
        }

        // Apply the change
        (dmpContributor as any)[field] = newValue;

        // Record a user-facing summary entry for the reportable fields
        if (fieldsToReport.includes(field)) {
          const transition = this.showsTransition(field);
          this.autoUpdateChanges.push({
            contributorName,
            field: this.fieldLabel(field),
            from: transition ? String(oldValue ?? "") : "",
            to: String(newValue ?? ""),
            showTransition: transition,
          });
        }
      }
    });

    console.groupEnd();
  }

  /**
   * Helper for UI and Form updates 
   */
  private applyFinalUpdates() {
    this.syncContributorsToForm();
    this.refreshOrcidWarning();

    // set updateNISTContrib to true to "send message" to dmp-form.component to execute autosave 
    this.peopleUpdates.updateNISTContrib$.next({
      numUpdates: this.contribsUpdated,
      isUpdated: true
    });
  }

  /**
   * Returns true if the People Service record differs from the local
   * contributor in any tracked field. Operates on the RAW record because
   * the orcid === null case is handled specially (the service "losing" an
   * ORCID must not count as a change).
   */
  private NISTContributorHasChanged(dmpContrib: DataContributor, current: PeopleServiceRecord): boolean {
    if (current.orcid === null && dmpContrib.orcid !== current.orcid) {
      // Warn about the People Service reporting a null ORCID for someone who
      // previously had one — this change is intentionally ignored.
      console.warn(`People service is indicating a new %cORCID  %cvalue of 'null' for %c${dmpContrib.firstName} ${dmpContrib.lastName} %cwith previously entered %cORCID %cvalue of: ${dmpContrib.orcid}. %cThis change will be ignored.`,
        log_normal_bold_style,
        log_normal_style,
        log_normal_bold_style,
        log_normal_style,
        log_normal_bold_style,
        log_normal_style,
        log_normal_bold_style
      );
    }
    if (
      (dmpContrib.divisionName !== current.divisionName) ||
      (dmpContrib.divisionNumber !== current.divisionNumber) ||
      (dmpContrib.divisionOrgID !== current.divisionOrgID) ||
      (dmpContrib.firstName !== current.firstName) ||
      (dmpContrib.groupName !== current.groupName) ||
      (dmpContrib.groupNumber !== current.groupNumber) ||
      (dmpContrib.groupOrgID !== current.groupOrgID) ||
      (dmpContrib.lastName !== current.lastName) ||
      (dmpContrib.ouName !== current.ouName) ||
      (dmpContrib.ouNumber !== current.ouNumber) ||
      (dmpContrib.ouOrgID !== current.ouOrgID) ||
      // Only count orcid as changed if the service provided a value AND it differs
      (current.orcid !== null && dmpContrib.orcid !== current.orcid)
    ) {
      return true;
    }
    return false;
  }

  //List of contributors that will be added to the DMP
  contributors: Contributor[]=[];

  //List of all nist contacts from NIST directory
  nistContacts: any = null;

  personID: number = 0;

  getNistContactsFromAPI(){
    // ---------------------------------------------------------------------------------------------
    //                              NIST CONTRIBUTOR
    // ---------------------------------------------------------------------------------------------
    this.fltr_NIST_Contributor = this.personelForm.controls['dmp_contributor'].valueChanges.pipe(
      switchMap(usrInput => {        
        // clear values until the user has picked a selection. 
        // This forces the form to accept only values that were selected from the dropdown menu
        // Reset NIST employee / associate fields
        this.crntContrib = this.emptyContributor();        

        const val = typeof usrInput === 'string'; //checks the type of input value
        if (!val){ 
          // if value is not string that means the user has picked a selection from dropdown suggestion box
          // so return an empty array to clear the dropdown suggestion box and set form values accordingly

          // returning result made to an async call
          this.personID = usrInput.id;
          return usrInput.getRecord().pipe(
            map((rec: PeopleServiceRecord) => {
              const person = this.normalizePeopleRecord(rec);   // null -> ""

              this.crntContrib.peopleID = person.peopleID;
              
              this.crntContrib.firstName = person.firstName;
              this.crntContrib.lastName = person.lastName;
              this.crntContrib.orcid = person.orcid;            // always a string now
              this.crntContrib.emailAddress = person.emailAddress;

              this.crntContrib.groupOrgID = person.groupOrgID;
              this.crntContrib.groupNumber = person.groupNumber;
              this.crntContrib.groupName = person.groupName;

              this.crntContrib.divisionOrgID = person.divisionOrgID;
              this.crntContrib.divisionNumber = person.divisionNumber;
              this.crntContrib.divisionName = person.divisionName;

              this.crntContrib.ouOrgID = person.ouOrgID;
              this.crntContrib.ouNumber = person.ouNumber;
              this.crntContrib.ouName = person.ouName;

              // clear search suggestions since the user has selected an option from drop down menu
              this.sd_index = null;
              this.suggestions = [];
              // enable adding of contact to contributors list
              this.disableAdd=false;
              // returns an empty array to the next function in the pipe -> in this case a map function
              return this.suggestions;
            }),
            catchError( err => {
              console.error('Failed to pull people record'+err)
              return []
            })
          )
        }

        if (usrInput.trim().length >= this.minPromptLength){
          // this is where initial querying of people service occurs if user has typed more than two characters

          if (! this.sd_index) {
              // if initial query was not performed yet, query people service based on first two letters
              // and return array of suggestions that will be passed to the next function in the pipe

              // returning result from an async call
              return this.sdsvc.getPeopleIndexFor(usrInput).pipe(
                map( idx => {
                  this.sd_index = idx;
                  if (this.sd_index != null) {
                      // pull out the matching suggestions
                      this.suggestions = (this.sd_index as SDSIndex).getSuggestions(usrInput);
                  }
                  return this.suggestions;
                }),
                catchError( err => {
                  console.error('Failed to pull people index for "'+usrInput+'"'+err)
                  return [];
                })
                
              )
          }
          
        }
        // pass user input as a string array to the next function in the pipe -> in this case the map function
        return [usrInput];
      }),     
      map (pipedValue => {
          // Data that comes here is piped in from the previous function in the pipeline in this case switchMap function

          const val = typeof pipedValue === 'string'; //checks the type of value passed down by the switchMap function

          if (!val){ 
            // if value is not string that means that one of two things have happened:
            // 1) we need to display initial drop down suggestions based on initial people query results
            // 2) the user has selected an option from the drop down menu in which case the suggestions array is empty so we return it
            return this.suggestions;
          }
          else if (typeof pipedValue === 'string' && pipedValue.trim().length >= 2 && this.sd_index){
            // we already have a downloaded index; just pull out the matching suggestions
            // and return the array of suggestions for the dropdown menu 
            this.suggestions = (this.sd_index as SDSIndex).getSuggestions(pipedValue);
            return this.suggestions;
          }
          else if (typeof pipedValue === 'string' && pipedValue.trim().length < 2 && this.sd_index){
            // if the input was cleared, clear out our index and suggestions
            this.sd_index = null;
            this.suggestions = [];
            return this.suggestions;
          }

          // if number of characters entered are less than two return an empty array
          return [];
        }
      )
    );

  }


  displaySelectedSDSuggestion(name:SDSuggestion):string{
    var res = name && name.display ? name.display : '';
    return res;
  }

  selectedContributor(name: string): boolean{
    if (!this.contributorOption) {
      return false;  
    }  
    return (this.contributorOption === name);
  }  

  private contributorOption: string="false";
  setContributor(e:string):void{
    this.contributorOption = e;
    
    if (e === 'NIST'){
      this.setPrimContact(this.defaultPrimaryContactId());
      this.disableAdd=true;
    }
    else{
      this.disableAdd=false;
    }
  }  

  private setPrimContact(val: string){
    this.primaryContact = val;
    this.selPrimaryContact();
  }
  
  selContributorRole(){
    const sel = this.dropDownService.getDropDownSelection(this.nistContribRole, this.contributorRoles);
    this.crntContrib.role = sel.length ? sel[0].value : "";
  }

  selExtContributorRole(){
    const sel = this.dropDownService.getDropDownSelection(this.extContribRole, this.contributorRoles);
    this.crntContrib.role = sel.length ? sel[0].value : "";
  }

  selPrimaryContact(){
    const sel = this.dropDownService.getDropDownSelection(this.primaryContact, this.primaryContactOptions);
    this.primaryContactSelection = sel.length ? sel[0].value : "";
  } 
  
  private contributorRadioSel: string="";

  /**
   * Resets form fields for Contributor personnel
   */
  private resetContributorFields(){
    this.setPrimContact(this.defaultPrimaryContactId());
    this.errorMessage = "";

    // Reset NIST employee / associate fields
    this.crntContrib = this.emptyContributor();

    this.nistContribRole = "";
    this.extContribRole = "";

    this.personelForm.controls['dmp_contributor'].setValue("");

    this.externalContributor = this.emptyContributor();
  }

  onContributorChange(value:any){    
    this.contributorRadioSel=value.id;
    this.resetContributorFields();
    this.resetWarningAndErrorMessages();
  }
  
  removeSelectedRows() {
    const result = confirmDialog(
      "Are you sure you want to delete the selected contributor(s) for this DMP?"
    );
    if (!result) return;

    this.dmpContributors = this.dmpContributors.filter((u: any) => !u.isSelected);
    this.syncContributorsToForm();
    this.refreshOrcidWarning();

    if (this.dmpContributors.length === 0) {
      this.disableClear = true;
      this.disableRemove = true;
    }
  }

  clearTable(){
    const result = confirmDialog("Are you sure you want to delete all contributors for this DMP?");

    if (result) {
      this.dmpContributors = [];
      this.resetWarningAndErrorMessages();
      this.personelForm.patchValue({ contributors: [] })
      this.disableClear=true;
      this.disableRemove=true;
    }
  }

  private isORCID(val:string):boolean{
    const reORCID = /^(\d{4}-){3}\d{3}(\d|X)$/;
    return reORCID.test(val);
  }

  onDoneClick(e: any) {
    // Validate when finishing an inline edit of an external contributor
    this.contribOrcidWarn = "";
    const externalContrib: externalContributor = {
      firstName:    e.firstName,
      lastName:     e.lastName,
      orcid:        e.orcid,
      institution:  e.institution,
      emailAddress: e.emailAddress,
      role:         this.crntContrib.role,
    };

    if (!this.validateExternalContributorInput(externalContrib)) {
      return;
    }
    this.crntContrib.orcid = e.orcid;
    this.errorMessage = "";

    // Find the row being edited and apply changes to it directly
    const row = this.dmpContributors.find((c) => c.id === e.id);
    if (row) {
      row.isEdit = false;

      // A divisionOrgID of 0 indicates an external contributor: enforce the
      // institutional defaults so manual edits can't promote them to NIST or
      // assign them as a primary contact.
      if (row.divisionOrgID === 0) {
        row.groupOrgID = 0;
        row.groupNumber = "";
        row.groupName = "";

        row.divisionOrgID = 0;
        row.divisionNumber = "";
        row.divisionName = "";

        row.ouOrgID = 0;
        row.ouNumber = "";
        row.ouName = "";

        row.primary_contact = PrimaryContact.No;

        // Ensure role is one of the accepted values
        const validRole = _.filter(this.contributorRoles, { value: String(row.role) });
        if (validRole.length === 0) {
          row.role = "";
        }
      }
    }

    // Rebuild the form from the table, recompute warning, refresh button state
    this.syncContributorsToForm();
    this.refreshOrcidWarning();

    this.disableClear = false;
    this.disableRemove = false;
  }

  /**
   * Determines whether an existing table row represents the same person
   * as the contributor currently staged for adding.
   * Uses email when available (authoritative), otherwise a composite key,
   * since NIST records can legitimately have a null/empty email.
   */
  private sameContributor(member: any): boolean {
  // Prefer peopleID when both sides have a real (non-zero) one.
    if (this.crntContrib.peopleID && member.peopleID &&
        this.crntContrib.peopleID !== 0 && member.peopleID !== 0) {
      return member.peopleID === this.crntContrib.peopleID;
    }

    // Fall back to email, then composite identity (existing logic).
    const stagedEmail = (this.crntContrib.emailAddress || "").trim().toLowerCase();
    const memberEmail = (member.emailAddress || "").trim().toLowerCase();
    if (stagedEmail && memberEmail) {
      return stagedEmail === memberEmail;
    }
    return (
      member.firstName === this.crntContrib.firstName &&
      member.lastName === this.crntContrib.lastName &&
      member.groupNumber === this.crntContrib.groupNumber
    );
  }

  addRow() {
    // ---- Validate the staged contributor ----
    if (this.contributorRadioSel === "contributorExternal") {
      const externalContrib: externalContributor = {
        firstName:    this.externalContributor.firstName,
        lastName:     this.externalContributor.lastName,
        orcid:        this.externalContributor.orcid,
        institution:  this.externalContributor.institution,
        emailAddress: this.externalContributor.emailAddress,
        role:         this.crntContrib.role,
      };

      if (!this.validateExternalContributorInput(externalContrib)) {
        return;
      }
      this.crntContrib.orcid = this.externalContributor.orcid;
    } else {
      // check ORCID NIST contributor — orcid already bound into crntContrib by the template
      const isORCID = this.isORCID(this.crntContrib.orcid);

      if (!isORCID && this.crntContrib.orcid.length > 0) {
        this.errorMessage = PersonnelComponent.ORCID_ERROR;
        return;
      }
    }

    // ---- Duplicate detection ----
    const isDuplicate = this.dmpContributors.some((member: any) =>
      this.sameContributor(member)
    );

    if (isDuplicate) {
      this.errorMessage =
        "Contributor " + this.crntContrib.firstName + " " + this.crntContrib.lastName +
        " is already in the list of contributors";
      this.disableAdd = false;
      this.disableClear = false;
      this.disableRemove = false;
      return;
    }

    // ---- Build the new row ----
    const newRow: DataContributor = {
      ...this.crntContrib,

      primary_contact: this.primaryContactSelection,
      institution:     "",

      id: Date.now(),
      isEdit: false,
    };

    if (this.contributorOption === "NIST") {
      newRow.institution = this.contributorOption;

      // If this NIST contributor is a primary contact, resolve their OU
      if (this.primaryContactSelection === PrimaryContact.Yes) {
        this.sdsvc.getOrgsFor(this.personID)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (recs) => {
              this.setResponsibleOrgs(recs as NistOrganization[]);
              this.org_index = null;
              this.orgSuggestions = [];
              this.org_addRow();
            },
            error: (err: any) => {
              console.error('Failed to pull orgs for index "' + this.personID + '"' + err);
            },
        });
      }
    } else {
      newRow.institution = this.externalContributor.institution;
      // generate a personID for external contributor
      newRow.peopleID = this.generateExternalPeopleID();
    }

    // ---- Commit: prepend to table, sync once ----
    this.dmpContributors = [newRow, ...this.dmpContributors];
    this.syncContributorsToForm();
    this.refreshOrcidWarning();

    this.errorMessage = "";
    this.disableClear = false;
    this.disableRemove = false;

    this.resetContributorFields();
  }

  private validateExternalContributorInput(extContrib: externalContributor): boolean {
    const firstName = (extContrib.firstName || "").trim();
    const lastName = (extContrib.lastName || "").trim();
    const institution = (extContrib.institution || "").trim();
    const email = (extContrib.emailAddress || "").trim();
    const orcid = (extContrib.orcid || "").trim();

    // First name
    if (name_regex.test(firstName)) {
      this.crntContrib.firstName = firstName;
    } else {
      this.errorMessage = "Missing or invalid contributor First Name";
      return false;
    }

    // Last name
    if (name_regex.test(lastName)) {
      this.crntContrib.lastName = lastName;
    } else {
      this.errorMessage = "Missing or invalid contributor Last Name";
      return false;
    }

    // Institution
    if (!name_regex.test(institution)) {
      this.errorMessage = "Missing or invalid contributor Institution / Affiliation";
      return false;
    }

    // Email
    if (email_regex.test(email)) {
      this.crntContrib.emailAddress = email;
    } else {
      this.errorMessage = "Missing or invalid contributor e-mail";
      return false;
    }

    // ORCID (optional, but must be valid if present)
    if (orcid.length > 0 && !this.isORCID(orcid)) {
      this.errorMessage = PersonnelComponent.ORCID_ERROR;
      return false;
    }
    if (orcid.length === 0) {
      this.contribOrcidWarn = PersonnelComponent.ORCID_WARNING;
    }

    return true;
  }

  private resetWarningAndErrorMessages(){
    this.contribOrcidWarn = "";
    this.errorMessage = "";
  }

  private setResponsibleOrgs(orgs:NistOrganization[]){
    if (!orgs || orgs.length === 0) {
      return;
    }
    
    let index = 0;

    // Safely read the org at the current index; returns null if out of range.
    const orgAt = (i: number): NistOrganization | null => (i >= 0 && i < orgs.length ? orgs[i] : null);

    while (index < orgs.length) {
      const anOrganization = orgs[index];
      /**
       * Case 1: User selected a group (orG_LVL_ID = 3)
       */
      if (anOrganization.orG_LVL_ID === 3) {
        this.orgGroupNumber = anOrganization.orG_CD;
        this.orgGroupOrgID = anOrganization.orG_ID;
        this.orgGroupName = anOrganization.orG_Name;

        const divisionData = orgAt(++index);
        if (divisionData) {
          this.orgDivisionNumber = divisionData.orG_CD;
          this.orgDivisionOrgID = divisionData.orG_ID;
          this.orgDivisionName = divisionData.orG_Name;
          this.orgDivisionAcronym = divisionData.orG_ACRNM;
        }

        const OUData = orgAt(++index);
        if (OUData) {
          this.orgOuNumber = OUData.orG_CD;
          this.orgOuOrgID = OUData.orG_ID;
          this.orgOuName = OUData.orG_Name;
          this.orgOuAcronym = OUData.orG_ACRNM;
        }
        break;
      }
      /**
       * Case 2: User selected a division (orG_LVL_ID = 2 or 4)
       */               
      else if (anOrganization.orG_LVL_ID === 2 || anOrganization.orG_LVL_ID === 4) {
        this.orgGroupNumber = "";
        this.orgGroupOrgID = 0;
        this.orgGroupName = "";

        this.orgDivisionNumber = anOrganization.orG_CD;
        this.orgDivisionOrgID = anOrganization.orG_ID;
        this.orgDivisionName = anOrganization.orG_Name;
        this.orgDivisionAcronym = anOrganization.orG_ACRNM;

        const OUData = orgAt(++index);
        if (OUData) {
          this.orgOuNumber = OUData.orG_CD;
          this.orgOuOrgID = OUData.orG_ID;
          this.orgOuName = OUData.orG_Name;
          this.orgOuAcronym = OUData.orG_ACRNM;
        }
        break;
      }
      else{
        /**
         * Case 3: User selected a top level organization (parenT_ORG_CD is null)
         */
        this.orgGroupNumber = "";
        this.orgGroupOrgID = 0;
        this.orgGroupName = "";

        this.orgDivisionNumber = "";
        this.orgDivisionOrgID = 0;
        this.orgDivisionName = "";
        this.orgDivisionAcronym = "";

        this.orgOuNumber = anOrganization.orG_CD;
        this.orgOuOrgID = anOrganization.orG_ID;
        this.orgOuName = anOrganization.orG_Name;
        this.orgOuAcronym = anOrganization.orG_ACRNM;
        break;
      }
    }
  }

  removeRow(id:any) {
    const result = confirmDialog("Are you sure you want to delete selected contributor(s) for this DMP?");

    if (!result) return;

    // Remove from the display table
    this.dmpContributors = this.dmpContributors.filter((u) => u.id !== id);

    // Keep the unmatched-notice panel in sync: if this contributor was listed
    // there, drop it so the warning doesn't linger after the row is gone.
    this.unmatchedContributors = this.unmatchedContributors.filter((u) => u.id !== id);

    // Rebuild the form from the table (single source of truth)
    this.syncContributorsToForm();

    this.refreshOrcidWarning();
    this.errorMessage = "";

    if (this.dmpContributors.length === 0) {
      this.disableClear = true;
      this.disableRemove = true;
    }
  }

  resetPersonnelForm(){
    this.nistContribRole = "";
    this.externalContributor.firstName = "";
    this.externalContributor.lastName = "";
    this.externalContributor.orcid = "";
    this.externalContributor.institution = "";
    this.externalContributor.emailAddress = "";
    this.contributorRadioSel = "";
    this.clearTable();
    this.org_clearTable();
  }


  /**
   * This function gets all NIST organizations by querying people service
   */
  getNistOrganizations(){ 
    this.fltr_NIST_Org = this.personelForm.controls['nistOrganization'].valueChanges.pipe(
      switchMap(usrInput => {
        const val = typeof usrInput === 'string';
        if (!val){
          // Make async call to get parent organizations of the organization selected by the user
          return this.sdsvc.getParentOrgs(usrInput.id, true).pipe(
            map((recs) => {
              this.setResponsibleOrgs(recs as NistOrganization[]);
              this.org_disableAdd = false;
              this.org_index = null;
              this.orgSuggestions = [];
              return [];
            }),
            catchError(err => {
              console.error('Failed to pull orgs for index "' + usrInput.id + '"' + err);
              return [];
            })
          )
        }
        if (usrInput.trim().length >= 2){
          if (! this.org_index) {
            return this.sdsvc.getOrgsIndexFor(usrInput).pipe(
              map(pi => {
                this.org_index = pi;
                if (this.org_index != null) {
                  this.orgSuggestions = (this.org_index as SDSIndex).getSuggestions(usrInput);
                }
                return this.orgSuggestions;
              }),
              catchError( err => {
                console.error('Failed to pull orgs index for "'+usrInput+'": '+err)
                return [];
              })
            );
          }
        }
        return [usrInput];
      }),
      map(pipedValue => {
        const val = typeof pipedValue ==='string';

        if (!val){ 
          return this.orgSuggestions;
        }
        else if (typeof pipedValue === 'string' && pipedValue.trim().length >= 2 && this.org_index){
          this.orgSuggestions = (this.org_index as SDSIndex).getSuggestions(pipedValue);
          return this.orgSuggestions;
        }
        else if (typeof pipedValue === 'string' && pipedValue.trim().length < 2 && this.org_index){
          this.org_index = null;
          this.orgSuggestions = [];
          return this.orgSuggestions;
        }

        return [];
      }),
      catchError( err => {
        console.error('Failed to pull orgs index'+err)
        return [];
      })
    );
  }

  org_removeSelectedRows() {
    const result = confirmDialog(
      "Are you sure you want to delete the selected organization(s) for this DMP?"
    );
    if (!result) return;

    this.dmpOrganizations = this.dmpOrganizations.filter((u: any) => !u.isSelected);
    this.syncOrganizationsToForm();

    if (this.dmpOrganizations.length === 0) {
      this.org_disableClear = true;
      this.org_disableRemove = true;
    }
  }

  org_clearTable(){
    const result = confirmDialog("Are you sure you want to delete all organizations for this DMP?");

    if (result) {
      this.dmpOrganizations = [];
      this.personelForm.patchValue({organizations:[]});      
      this.org_disableAdd=true;
      this.org_disableClear=true;
      this.org_disableRemove=true;
    }
  }

  org_addRow() {
    const newRow = {
      id: Date.now(),
      isEdit: false,
      groupName:    this.orgGroupName,
      groupNumber:  this.orgGroupNumber,
      groupOrgID:   this.orgGroupOrgID,

      divisionName:    this.orgDivisionName,
      divisionNumber:  this.orgDivisionNumber,
      divisionOrgID:   this.orgDivisionOrgID,
      divisionAcronym: this.orgDivisionAcronym,

      ouName:    this.orgOuName,
      ouNumber:  this.orgOuNumber,
      ouOrgID:   this.orgOuOrgID,
      ouAcronym: this.orgOuAcronym,
    };

    // Composite identity: group + division + OU together are unique per row
    const duplicate = this.dmpOrganizations.some(
      (u) =>
        u.groupName === newRow.groupName &&
        u.divisionName === newRow.divisionName &&
        u.ouName === newRow.ouName
    );
    if (duplicate) {
      this.org_errorMessage = "The selected Organization is already associated with this DMP.";
      return;
    }

    // Prepend to table, sync once
    this.dmpOrganizations = [newRow, ...this.dmpOrganizations];
    this.syncOrganizationsToForm();

    this.org_errorMessage = "";
    this.org_disableAdd = true;
    this.org_disableClear = false;
    this.org_disableRemove = false;

    // Reset the field so it's clear multiple orgs can be added
    this.personelForm.controls['nistOrganization'].setValue("");
  }

  org_removeRow(id: any) {
    const result = confirmDialog(
      "Are you sure you want to delete the selected organization for this DMP?"
    );
    if (!result) return;

    // Remove from the display table
    this.dmpOrganizations = this.dmpOrganizations.filter((u) => u.id !== id);

    // Rebuild the form from the table
    this.syncOrganizationsToForm();

    if (this.dmpOrganizations.length === 0) {
      this.org_disableClear = true;
      this.org_disableRemove = true;
    }
  }

  /**
   * Rebuilds the form's organizations array from the dmpOrganizations table.
   * The table is the single source of truth; the form mirrors it.
   */
  private syncOrganizationsToForm(): void {
    const organizations: ResponsibleOrganizations[] = this.dmpOrganizations.map((org) => ({
      groupName:       org.groupName,
      groupNumber:     org.groupNumber,
      groupOrgID:      org.groupOrgID,

      divisionName:    org.divisionName,
      divisionNumber:  org.divisionNumber,
      divisionOrgID:   org.divisionOrgID,
      divisionAcronym: org.divisionAcronym,

      ouName:          org.ouName,
      ouNumber:        org.ouNumber,
      ouOrgID:         org.ouOrgID,
      ouAcronym:       org.ouAcronym,
    }));

    this.personelForm.patchValue({ organizations });
  }

  /** Returns a blank contributor used as the "currently being added" staging buffer. */
  private emptyContributor(): Contributor {
    return {
      firstName: "", lastName: "", orcid: "", emailAddress: "",
      groupOrgID: 0, groupNumber: "", groupName: "",
      divisionOrgID: 0, divisionNumber: "", divisionName: "",
      ouOrgID: 0, ouNumber: "", ouName: "",
      primary_contact: "", role: "", institution: "",
      peopleID: 0,   // <-- placeholder; real value assigned on selection/add
    };
  }

  /**
   * Normalizes a raw People Service record into a Person, coalescing the
   * nullable orcid/emailAddress fields to empty strings so downstream code
   * never has to null-check them.
   */
  private normalizePeopleRecord(rec: PeopleServiceRecord): Person {
    return {
      firstName:      rec.firstName,
      lastName:       rec.lastName,
      orcid:          rec.orcid ?? "",
      emailAddress:   rec.emailAddress ?? "",

      groupOrgID:     rec.groupOrgID,
      groupNumber:    rec.groupNumber,
      groupName:      rec.groupName,

      divisionOrgID:  rec.divisionOrgID,
      divisionNumber: rec.divisionNumber,
      divisionName:   rec.divisionName,

      ouOrgID:        rec.ouOrgID,
      ouNumber:       rec.ouNumber,
      ouName:         rec.ouName,

      peopleID:       rec.peopleID,   // <-- carry through
    };
  }  

  private defaultPrimaryContactId(): string {
    const noOption = this.primaryContactOptions.find(o => o.value === PrimaryContact.No);
    return noOption ? String(noOption.id) : "";
  }

  /** Maps a raw People Service field key to a user-facing label. */
  private fieldLabel(field: keyof Person): string {
    const labels: Partial<Record<keyof Person, string>> = {
      firstName:    'First name',
      lastName:     'Last name',
      groupName:    'Group',
      divisionName: 'Division',
      ouName:       'OU',
      orcid:        'ORCID',
    };
    return labels[field] ?? String(field);
  }

  /** Whether to reveal the old→new transition for a field, or just state the
   *  new value. Identifier fields (ORCID) expose less by hiding the old value. */
  private showsTransition(field: keyof Person): boolean {
    return field !== 'orcid';
  }

  dismissAutoUpdateNotice(): void {
    this.autoUpdateChanges = [];
  }

  dismissUnmatchedNotice(): void {
    this.unmatchedContributors = [];
  }

  /**
   * External contributors have no People Service record, so they get a
   * negative pseudo-id. Real People Service ids are positive, so the sign
   * alone distinguishes the two populations and prevents collisions.
   */
  private generateExternalPeopleID(): number {
    // Large negative range keeps accidental collisions astronomically unlikely.
    return -(Math.floor(Math.random() * 2_000_000_000) + 1);
  }

  private recordUnmatchedContributor(c: DataContributor): void {
    this.unmatchedContributors.push({
      id: c.id,
      contributorName: `${c.firstName} ${c.lastName}`,
      peopleID: c.peopleID,
    });
  }

  /** Remove a contributor straight from the unmatched-notice panel.
   *  Delegates to removeRow, which handles the confirm dialog, table + form
   *  sync, button state, AND pruning this notice — so there's nothing left to
   *  do here. A cancelled confirm leaves both the row and this entry in place. */
  removeUnmatchedContributor(entry: { id: number }): void {
    this.removeRow(entry.id);
  }
}