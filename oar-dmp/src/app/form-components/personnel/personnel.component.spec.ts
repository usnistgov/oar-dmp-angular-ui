import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { of } from 'rxjs';

import { PersonnelComponent } from './personnel.component';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
import { UpdateNistContributorService } from 'src/app/shared/update-nist-contributor.service';
import { StaffDirectoryService } from 'oarng';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// confirmDialog is a standalone exported function from dmp.service.
// Spied per-test to control the confirm/cancel result.
import * as dmpService from 'src/app/shared/dmp.service';

describe('PersonnelComponent', () => {
  let component: PersonnelComponent;
  let fixture: ComponentFixture<PersonnelComponent>;

  // Minimal fake of StaffDirectoryService — returns empty results so the
  // component's valueChanges pipelines and autoupdate run without network.
  const staffDirectoryStub: Partial<StaffDirectoryService> = {
    getPeopleIndexFor: () => of(null) as any,
    getOrgsIndexFor: () => of(null) as any,
    getParentOrgs: () => of([]) as any,
    getOrgsFor: () => of([]) as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonnelComponent],
      providers: [
        DropDownSelectService,
        FormBuilder,
        UpdateNistContributorService,
        { provide: StaffDirectoryService, useValue: staffDirectoryStub },
      ],
      imports: [
        HttpClientTestingModule,
        MatAutocompleteModule,
        FormsModule,
        ReactiveFormsModule, // <-- supplies NgControl for [formControl]
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonnelComponent);
    component = fixture.componentInstance;
    // no detectChanges() — logic tests don't need the template rendered
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function stageNistContributor(overrides: Partial<any> = {}) {
    component.crntContrib = {
      firstName: 'Ada', lastName: 'Lovelace',
      orcid: '0000-0002-1825-0097', emailAddress: 'ada@nist.gov',
      groupOrgID: 641, groupNumber: '641', groupName: 'Software Group',
      divisionOrgID: 640, divisionNumber: '640', divisionName: 'ITL Division',
      ouOrgID: 600, ouNumber: '600', ouName: 'ITL',
      primary_contact: '', role: 'Project Leader', institution: '',
      peopleID: 12345, // NIST contributors carry a real, positive People Service id
      ...overrides,
    } as any;

    component.setContributor('NIST');
    component['contributorOption'] = 'NIST';
    component.primaryContactSelection = 'No';
  }

  function stageExternalContributor(fields: Partial<any>) {
    component.setContributor('External');
    component['contributorOption'] = 'External';
    component['contributorRadioSel'] = 'contributorExternal';
    component.externalContributor = {
      firstName: '', lastName: '', orcid: '', emailAddress: '', institution: '',
      groupOrgID: 0, groupNumber: '', groupName: '',
      divisionOrgID: 0, divisionNumber: '', divisionName: '',
      ouOrgID: 0, ouNumber: '', ouName: '',
      primary_contact: '', role: '',
      peopleID: 0, // externals get a generated negative id inside addRow
      ...fields,
    } as any;
  }

  function seedLoadedNistContributor(peopleID: number, over: Partial<any> = {}) {
    component.dmpContributors = [{
      id: 1, isEdit: false,
      firstName: 'Ada', lastName: 'Lovelace',
      orcid: '0000-0002-1825-0097', emailAddress: 'ada@nist.gov',
      groupOrgID: 641, groupNumber: '641', groupName: 'Software Group',
      divisionOrgID: 640, divisionNumber: '640', divisionName: 'ITL Division',
      ouOrgID: 600, ouNumber: '600', ouName: 'ITL',
      primary_contact: 'No', role: 'Project Leader', institution: 'NIST',
      peopleID,
      ...over,
    } as any];
  }

  function fakePerson(fields: Partial<any>): any {
    return {
      firstName: '', lastName: '', orcid: null, emailAddress: null,
      groupOrgID: 0, groupNumber: '', groupName: '',
      divisionOrgID: 0, divisionNumber: '', divisionName: '',
      ouOrgID: 0, ouNumber: '', ouName: '',
      peopleID: 0,
      ...fields,
    };
  }

  function fakeIndex(...people: any[]): any {
    return {
      getSuggestions: () => people.map((p) => ({
        display: `${p.firstName} ${p.lastName}`,
        getRecord: () => Promise.resolve(p),
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Smoke test
  // ---------------------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // addRow — NIST contributor
  // ---------------------------------------------------------------------------

  it('adds a NIST contributor to the table and mirrors it into the form', () => {
    stageNistContributor();

    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    const row = component.dmpContributors[0];
    expect(row.firstName).toBe('Ada');
    expect(row.institution).toBe('NIST');

    const formContributors = component.personnelForm.value['contributors'] as any[];
    expect(formContributors.length).toBe(1);
    expect(formContributors[0].lastName).toBe('Lovelace');
    // table-only fields must NOT leak into the form
    expect(formContributors[0].id).toBeUndefined();
    expect(formContributors[0].isEdit).toBeUndefined();
    // peopleID SHOULD flow into the form so it persists to the saved record
    expect(formContributors[0].peopleID).toBe(12345);
  });

  it('preserves the real (positive) peopleID for a NIST contributor', () => {
    stageNistContributor({ peopleID: 98765 });

    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    expect(component.dmpContributors[0].peopleID).toBe(98765);
    expect(component.dmpContributors[0].peopleID).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // peopleID — external contributor id generation
  // ---------------------------------------------------------------------------

  it('assigns a unique negative peopleID to an external contributor', () => {
    stageExternalContributor({
      firstName: 'Marie',
      lastName: 'Curie',
      emailAddress: 'marie@example.com',
      institution: 'Sorbonne',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    const external = component.dmpContributors[0];
    expect(external.institution).toBe('Sorbonne');
    // External contributors have no People Service record, so their id must be
    // a generated negative integer — the sign is what distinguishes them.
    expect(external.peopleID).toBeLessThan(0);
    expect(Number.isInteger(external.peopleID)).toBe(true);
  });

  it('gives two external contributors distinct negative peopleIDs', () => {
    stageExternalContributor({
      firstName: 'Marie', lastName: 'Curie',
      emailAddress: 'marie@example.com', institution: 'Sorbonne',
    });
    component.addRow();

    stageExternalContributor({
      firstName: 'Niels', lastName: 'Bohr',
      emailAddress: 'niels@example.com', institution: 'Copenhagen',
    });
    component.addRow();

    expect(component.dmpContributors.length).toBe(2);
    const [second, first] = component.dmpContributors; // prepended, so newest first
    expect(first.peopleID).toBeLessThan(0);
    expect(second.peopleID).toBeLessThan(0);
    expect(first.peopleID).not.toBe(second.peopleID);
  });

  // ---------------------------------------------------------------------------
  // Duplicate detection — keyed on peopleID
  // ---------------------------------------------------------------------------

  it('rejects a duplicate contributor by matching peopleID', () => {
    stageNistContributor({ peopleID: 555 });
    component.addRow();
    expect(component.dmpContributors.length).toBe(1);

    // Same peopleID but different name/email — still the same person.
    stageNistContributor({
      peopleID: 555,
      firstName: 'Augusta', lastName: 'King', emailAddress: 'different@nist.gov',
    });
    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    expect(component.errorMessage).toContain('already in the list');
  });

  it('treats different peopleIDs as different contributors', () => {
    stageNistContributor({ peopleID: 111, firstName: 'Ada', lastName: 'Lovelace' });
    component.addRow();

    stageNistContributor({ peopleID: 222, firstName: 'Grace', lastName: 'Hopper' });
    component.addRow();

    expect(component.dmpContributors.length).toBe(2);
  });

  it('falls back to composite identity when peopleID and email are absent', () => {
    // When both sides have peopleID 0 (the id branch is skipped) AND no email,
    // sameContributor falls through to the firstName+lastName+groupNumber key.
    stageNistContributor({
      peopleID: 0, emailAddress: '',
      firstName: 'Grace', lastName: 'Hopper', groupNumber: '999',
    });
    component.addRow();
    expect(component.dmpContributors.length).toBe(1);

    stageNistContributor({
      peopleID: 0, emailAddress: '',
      firstName: 'Katherine', lastName: 'Johnson', groupNumber: '888',
    });
    component.addRow();
    expect(component.dmpContributors.length).toBe(2);

    // Same composite key as the first — rejected as a duplicate.
    stageNistContributor({
      peopleID: 0, emailAddress: '',
      firstName: 'Grace', lastName: 'Hopper', groupNumber: '999',
    });
    component.addRow();
    expect(component.dmpContributors.length).toBe(2);
  });

  it('falls back to email when peopleID is absent on both sides', () => {
    // peopleID 0 on both sides skips the id branch; email then decides.
    stageNistContributor({ peopleID: 0, emailAddress: 'shared@nist.gov', firstName: 'Ada' });
    component.addRow();
    expect(component.dmpContributors.length).toBe(1);

    // Same email, different name — still the same person via the email branch.
    stageNistContributor({ peopleID: 0, emailAddress: 'shared@nist.gov', firstName: 'Augusta' });
    component.addRow();
    expect(component.dmpContributors.length).toBe(1);
  });

  it('does not falsely dedupe two distinct external contributors', () => {
    // Each external gets its own generated negative id, so two different
    // externals must never collide as duplicates.
    stageExternalContributor({
      firstName: 'Marie', lastName: 'Curie',
      emailAddress: 'marie@example.com', institution: 'Sorbonne',
    });
    component.addRow();

    stageExternalContributor({
      firstName: 'Niels', lastName: 'Bohr',
      emailAddress: 'niels@example.com', institution: 'Copenhagen',
    });
    component.addRow();

    expect(component.dmpContributors.length).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // External contributor validation (anchored name regex)
  // ---------------------------------------------------------------------------

  it('rejects an external contributor with markup in the name', () => {
    stageExternalContributor({
      firstName: '<script>',
      lastName: 'Curie',
      emailAddress: 'marie@example.com',
      institution: 'Sorbonne',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(0);
    expect(component.errorMessage).toContain('First Name');
  });

  it('rejects an external contributor with an invalid email', () => {
    stageExternalContributor({
      firstName: 'Marie', lastName: 'Curie',
      emailAddress: 'not-an-email', institution: 'Sorbonne',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(0);
    expect(component.errorMessage).toContain('e-mail');
  });

  it('rejects an external contributor with an invalid ORCID', () => {
    stageExternalContributor({
      firstName: 'Marie', lastName: 'Curie',
      emailAddress: 'marie@example.com', institution: 'Sorbonne',
      orcid: 'not-an-orcid',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(0);
    expect(component.errorMessage).toBe(PersonnelComponent.ORCID_ERROR);
  });

  it('sets the ORCID warning when an external contributor has no ORCID', () => {
    stageExternalContributor({
      firstName: 'Marie', lastName: 'Curie',
      emailAddress: 'marie@example.com', institution: 'Sorbonne',
      orcid: '',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    expect(component.contribOrcidWarn).toBe(PersonnelComponent.ORCID_WARNING);
  });

  // ---------------------------------------------------------------------------
  // People Service autoupdate reconciliation
  // ---------------------------------------------------------------------------

  it('records an unmatched contributor when the search returns no suggestions', async () => {
    jest.spyOn(component['sdsvc'], 'getPeopleIndexFor')
      .mockReturnValue(of(fakeIndex())); // empty suggestions

    seedLoadedNistContributor(500);
    component['runNistAutoUpdate']();

    // Let the concatMap/forkJoin microtasks settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(component.unmatchedContributors.length).toBe(1);
    expect(component.unmatchedContributors[0].peopleID).toBe(500);
  });

  it('records an unmatched contributor when no suggestion matches the peopleID', async () => {
    // Search returns a person, but with a different peopleID than our contributor.
    const other = fakePerson({
      firstName: 'Someone', lastName: 'Else',
      orcid: null, emailAddress: 'else@nist.gov',
      groupOrgID: 1, groupNumber: '1', groupName: 'X',
      divisionOrgID: 1, divisionNumber: '1', divisionName: 'Y',
      ouOrgID: 1, ouNumber: '1', ouName: 'Z',
      peopleID: 999, // does NOT match the contributor's 500
    });

    jest.spyOn(component['sdsvc'], 'getPeopleIndexFor')
      .mockReturnValue(of(fakeIndex(other)));

    seedLoadedNistContributor(500);
    component['runNistAutoUpdate']();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.unmatchedContributors.length).toBe(1);
    expect(component.unmatchedContributors[0].peopleID).toBe(500);
  });

  it('does NOT record an unmatched contributor when a peopleID matches', async () => {
    // Same peopleID and identical metadata: matched, no change, not unmatched.
    const match = fakePerson({
      firstName: 'Ada', lastName: 'Lovelace',
      orcid: '0000-0002-1825-0097', emailAddress: 'ada@nist.gov',
      groupOrgID: 641, groupNumber: '641', groupName: 'Software Group',
      divisionOrgID: 640, divisionNumber: '640', divisionName: 'ITL Division',
      ouOrgID: 600, ouNumber: '600', ouName: 'ITL',
      peopleID: 500, // matches
    });

    jest.spyOn(component['sdsvc'], 'getPeopleIndexFor')
      .mockReturnValue(of(fakeIndex(match)));

    seedLoadedNistContributor(500);
    component['runNistAutoUpdate']();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.unmatchedContributors.length).toBe(0);
  });

  it('does NOT run autoupdate matching for external contributors', async () => {
    const spy = jest.spyOn(component['sdsvc'], 'getPeopleIndexFor')
      .mockReturnValue(of(fakeIndex()));

    // External contributor: institution is not 'NIST', so the pipeline should
    // short-circuit before ever calling the People Service.
    seedLoadedNistContributor(-42, { institution: 'Some University' });
    component['runNistAutoUpdate']();

    await Promise.resolve();
    await Promise.resolve();

    expect(spy).not.toHaveBeenCalled();
    expect(component.unmatchedContributors.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // initialDMP_Meta input setter
  // ---------------------------------------------------------------------------

  describe('initialDMP_Meta input setter', () => {
    const mockDmp: any = {
      contributors: [{
        firstName: 'Ada', lastName: 'Lovelace',
        orcid: '0000-0002-1825-0097', emailAddress: 'ada@nist.gov',
        groupOrgID: 641, groupNumber: '641', groupName: 'Software Group',
        divisionOrgID: 640, divisionNumber: '640', divisionName: 'ITL Division',
        ouOrgID: 600, ouNumber: '600', ouName: 'ITL',
        primary_contact: 'No', role: 'Project Leader', institution: 'NIST',
        peopleID: 500,
      }],
      organizations: [{
        groupName: 'Software Group', groupNumber: '641', groupOrgID: 641,
        divisionName: 'ITL Division', divisionNumber: '640', divisionOrgID: 640, divisionAcronym: 'ITL',
        ouName: 'ITL', ouNumber: '600', ouOrgID: 600, ouAcronym: 'ITL',
      }],
    };

    it('populates dmpContributors and dmpOrganizations tables from the input', () => {
      component.initialDMP_Meta = mockDmp;
      expect(component.dmpContributors.length).toBe(1);
      expect(component.dmpContributors[0].firstName).toBe('Ada');
      expect(component.dmpOrganizations.length).toBe(1);
      expect(component.dmpOrganizations[0].groupName).toBe('Software Group');
    });

    it('mirrors loaded contributors/organizations into the form', () => {
      component.initialDMP_Meta = mockDmp;
      const formValue = component.personnelForm.value;
      expect((formValue['contributors'] as any[]).length).toBe(1);
      expect((formValue['organizations'] as any[]).length).toBe(1);
    });

    it('sets the ORCID warning when a loaded contributor has no ORCID', () => {
      component.initialDMP_Meta = { ...mockDmp, contributors: [{ ...mockDmp.contributors[0], orcid: '' }] };
      expect(component.contribOrcidWarn).toBe(PersonnelComponent.ORCID_WARNING);
    });

    it('resets tables to empty when given an empty object', () => {
      component.initialDMP_Meta = mockDmp;
      expect(component.dmpContributors.length).toBe(1);

      component.initialDMP_Meta = {} as any;
      expect(component.dmpContributors).toEqual([]);
      expect(component.dmpOrganizations).toEqual([]);
    });

    it('cancels a previous autoupdate run when rebound', () => {
      const cancelSpy = jest.spyOn(component['autoUpdateCancel$'], 'next');
      component.initialDMP_Meta = mockDmp;
      component.initialDMP_Meta = mockDmp;
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Contributor table row operations
  // ---------------------------------------------------------------------------

  describe('contributor table row operations', () => {
    let dateNowSpy: jest.SpyInstance;

    beforeEach(() => {
      // addRow() generates each row's id via Date.now(); two calls in quick
      // succession can land in the same millisecond and collide. Stub it
      // with an incrementing counter so every row gets a guaranteed-unique id.
      let counter = 1000;
      dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);

      stageNistContributor({ peopleID: 1 });
      component.addRow();
      stageNistContributor({ peopleID: 2, firstName: 'Grace', lastName: 'Hopper' });
      component.addRow();
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('removeRow deletes the matching row and syncs the form when confirmed', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      const idToRemove = component.dmpContributors.find(c => c.firstName === 'Ada')!.id;

      component.removeRow(idToRemove);

      expect(component.dmpContributors.length).toBe(1);
      expect(component.dmpContributors[0].firstName).toBe('Grace');
    });

    it('removeRow does nothing when the confirm dialog is cancelled', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(false);
      const idToRemove = component.dmpContributors[0].id;

      component.removeRow(idToRemove);

      expect(component.dmpContributors.length).toBe(2);
    });

    it('removeRow disables Clear/Remove buttons once the table is empty', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      component.dmpContributors.forEach(c => component.removeRow(c.id));

      expect(component.disableClear).toBe(true);
      expect(component.disableRemove).toBe(true);
    });

    it('removeSelectedRows removes only rows flagged isSelected', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      const adaRow = component.dmpContributors.find(c => c.firstName === 'Ada')!;
      (adaRow as any).isSelected = true;

      component.removeSelectedRows();

      expect(component.dmpContributors.length).toBe(1);
      expect(component.dmpContributors[0].firstName).toBe('Grace');
    });

    it('clearTable empties the contributors table and form when confirmed', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);

      component.clearTable();

      expect(component.dmpContributors).toEqual([]);
      expect(component.personnelForm.value['contributors']).toEqual([]);
      expect(component.disableClear).toBe(true);
      expect(component.disableRemove).toBe(true);
    });

    it('clearTable does nothing when cancelled', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(false);

      component.clearTable();

      expect(component.dmpContributors.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Organizations table: org_addRow / org_removeRow / org_clearTable
  // ---------------------------------------------------------------------------

  describe('organizations table operations', () => {
    beforeEach(() => {
      component.orgGroupName = 'Software Group';
      component.orgGroupNumber = '641';
      component.orgGroupOrgID = 641;
      component.orgDivisionName = 'ITL Division';
      component.orgDivisionNumber = '640';
      component.orgDivisionOrgID = 640;
      component.orgDivisionAcronym = 'ITL';
      component.orgOuName = 'ITL';
      component.orgOuNumber = '600';
      component.orgOuOrgID = 600;
      component.orgOuAcronym = 'ITL';
    });

    it('org_addRow adds a new organization row and syncs the form', () => {
      component.org_addRow();
      expect(component.dmpOrganizations.length).toBe(1);
      expect(component.personnelForm.value['organizations']).toHaveLength(1);
      expect(component.org_disableClear).toBe(false);
      expect(component.org_disableRemove).toBe(false);
    });

    it('org_addRow rejects a duplicate group+division+OU combination', () => {
      component.org_addRow();
      component.org_addRow();
      expect(component.dmpOrganizations.length).toBe(1);
      expect(component.org_errorMessage).toContain('already associated');
    });

    it('org_removeRow deletes the row and syncs the form when confirmed', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      component.org_addRow();
      const id = component.dmpOrganizations[0].id;

      component.org_removeRow(id);

      expect(component.dmpOrganizations).toEqual([]);
      expect(component.org_disableClear).toBe(true);
      expect(component.org_disableRemove).toBe(true);
    });

    it('org_clearTable empties organizations when confirmed', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      component.org_addRow();

      component.org_clearTable();

      expect(component.dmpOrganizations).toEqual([]);
      expect(component.personnelForm.value['organizations']).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Dropdown selection helpers
  // ---------------------------------------------------------------------------

  describe('dropdown selection helpers', () => {
    it('selPrimaryContact resolves "Yes" from primaryContactOptions', () => {
      component.primaryContact = '0'; // id 0 => Yes per primaryContactOptions
      component.selPrimaryContact();
      expect(component.primaryContactSelection).toBe('Yes');
    });

    it('selContributorRole resolves the role value from contributorRoles', () => {
      const anyRole = component.contributorRoles[0];
      component.nistContribRole = String(anyRole.id);
      component.selContributorRole();
      expect(component.crntContrib.role).toBe(anyRole.value);
    });

    it('selExtContributorRole falls back to empty string for an unmatched selection', () => {
      component.extContribRole = 'nonexistent-id';
      component.selExtContributorRole();
      expect(component.crntContrib.role).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onDoneClick — inline edit of an external contributor row
  // ---------------------------------------------------------------------------

  describe('onDoneClick (inline edit)', () => {
    beforeEach(() => {
      component.dmpContributors = [{
        id: 1, isEdit: true,
        firstName: 'Marie', lastName: 'Curie', orcid: '', emailAddress: 'marie@example.com',
        groupOrgID: 0, groupNumber: '', groupName: '',
        divisionOrgID: 0, divisionNumber: '', divisionName: '',
        ouOrgID: 0, ouNumber: '', ouName: '',
        primary_contact: 'No', role: 'Project Leader', institution: 'Sorbonne',
        peopleID: -1,
      } as any];
    });

    it('applies edits and clears isEdit on success', () => {
      component.onDoneClick({
        id: 1, firstName: 'Marie', lastName: 'Curie',
        orcid: '', institution: 'Sorbonne', emailAddress: 'marie@example.com',
      });

      const row = component.dmpContributors[0];
      expect(row.isEdit).toBe(false);
      expect(row.primary_contact).toBe('No');
    });

    it('rejects the edit and leaves isEdit true when validation fails', () => {
      component.onDoneClick({
        id: 1, firstName: '123', lastName: 'Curie',
        orcid: '', institution: 'Sorbonne', emailAddress: 'marie@example.com',
      });

      expect(component.dmpContributors[0].isEdit).toBe(true);
      expect(component.errorMessage).toContain('First Name');
    });
  });

  // ---------------------------------------------------------------------------
  // Outputs: valueChange / formReady
  // ---------------------------------------------------------------------------

  describe('valueChange output', () => {
    it('emits the current form value immediately on subscribe', async () => {
      const emitted = await new Promise(resolve =>
        component.valueChange.subscribe(v => resolve(v))
      );
      expect(emitted).toEqual({ contributors: [], organizations: [] });
    });

    it('emits an updated value after a contributor is added', async () => {
      stageNistContributor({ peopleID: 1 });
      component.addRow();

      const emitted: any = await new Promise(resolve =>
        component.valueChange.subscribe(v => resolve(v))
      );
      expect(emitted.contributors.length).toBe(1);
    });
  });

  describe('formReady output', () => {
    it('emits the personnelForm instance', async () => {
      const emittedForm = await new Promise(resolve =>
        component.formReady.subscribe(f => resolve(f))
      );
      expect(emittedForm).toBe(component.personnelForm);
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('completes both destroy$ and autoUpdateCancel$ subjects', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'complete');
      const cancelSpy = jest.spyOn(component['autoUpdateCancel$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Notice dismissal
  // ---------------------------------------------------------------------------

  describe('notice dismissal', () => {
    it('dismissAutoUpdateNotice clears autoUpdateChanges', () => {
      component.autoUpdateChanges = [{ contributorName: 'Ada', field: 'ORCID', from: '', to: '1', showTransition: false }];
      component.dismissAutoUpdateNotice();
      expect(component.autoUpdateChanges).toEqual([]);
    });

    it('dismissUnmatchedNotice clears unmatchedContributors', () => {
      component.unmatchedContributors = [{ id: 1, contributorName: 'Ada', peopleID: 500 }];
      component.dismissUnmatchedNotice();
      expect(component.unmatchedContributors).toEqual([]);
    });

    it('removeUnmatchedContributor delegates to removeRow and prunes both lists', () => {
      jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);
      stageNistContributor({ peopleID: 500 });
      component.addRow();
      const id = component.dmpContributors[0].id;
      component.unmatchedContributors = [{ id, contributorName: 'Ada Lovelace', peopleID: 500 }];

      component.removeUnmatchedContributor({ id });

      expect(component.dmpContributors.length).toBe(0);
      expect(component.unmatchedContributors.length).toBe(0);
    });
  });
});