import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { of } from 'rxjs';

import { PersonnelComponent } from './personel.component';
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
    getOrgsIndexFor:   () => of(null) as any,
    getParentOrgs:     () => of([]) as any,
    getOrgsFor:        () => of([]) as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [ PersonnelComponent ],
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
      ReactiveFormsModule,   // <-- add this — supplies NgControl for [formControl]
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
  .compileComponents();
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
      peopleID: 12345,   // NIST contributors carry a real, positive People Service id
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
      peopleID: 0,   // externals get a generated negative id inside addRow
      ...fields,
    } as any;
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

    const formContributors = component.personelForm.value['contributors'] as any[];
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
  // Duplicate detection — now keyed on peopleID
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
      firstName: '<script>alert(1)</script>',
      lastName: 'Doe',
      emailAddress: 'doe@example.com',
      institution: 'Example U',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(0);
    expect(component.errorMessage).toContain('First Name');
  });

  it('accepts an external contributor with a legitimate accented name', () => {
    stageExternalContributor({
      firstName: 'Begoña',
      lastName: "O'Brien-Smith",
      emailAddress: 'b@example.com',
      institution: 'Universität Wien',
    });

    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    expect(component.dmpContributors[0].firstName).toBe('Begoña');
  });

  // ---------------------------------------------------------------------------
  // Remove
  // ---------------------------------------------------------------------------

  it('removes a contributor and updates the form and button state', () => {
    jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);

    stageNistContributor();
    component.addRow();
    const id = component.dmpContributors[0].id;

    component.removeRow(id);

    expect(component.dmpContributors.length).toBe(0);
    expect((component.personelForm.value['contributors'] as any[]).length).toBe(0);
    expect(component.disableClear).toBe(true);
    expect(component.disableRemove).toBe(true);
  });

  it('does not remove a contributor when the confirm dialog is cancelled', () => {
    jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(false);

    stageNistContributor();
    component.addRow();
    const id = component.dmpContributors[0].id;

    component.removeRow(id);

    expect(component.dmpContributors.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Unmatched-contributor notice
  // ---------------------------------------------------------------------------

  it('prunes an unmatched-notice entry when its row is removed via removeRow', () => {
    jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);

    stageNistContributor({ peopleID: 777 });
    component.addRow();
    const row = component.dmpContributors[0];

    // Simulate the autoupdate pass having flagged this contributor as unmatched.
    component.unmatchedContributors = [
      { id: row.id, contributorName: `${row.firstName} ${row.lastName}`, peopleID: row.peopleID },
    ];

    component.removeRow(row.id);

    expect(component.dmpContributors.length).toBe(0);
    // removeRow must also drop the matching notice entry so the two stay in sync.
    expect(component.unmatchedContributors.length).toBe(0);
  });

  it('removeUnmatchedContributor deletes the row and clears the notice', () => {
    jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(true);

    stageNistContributor({ peopleID: 888 });
    component.addRow();
    const row = component.dmpContributors[0];

    component.unmatchedContributors = [
      { id: row.id, contributorName: `${row.firstName} ${row.lastName}`, peopleID: row.peopleID },
    ];

    component.removeUnmatchedContributor({ id: row.id } as any);

    expect(component.dmpContributors.length).toBe(0);
    expect(component.unmatchedContributors.length).toBe(0);
  });

  it('keeps the unmatched-notice entry if the confirm dialog is cancelled', () => {
    jest.spyOn(dmpService, 'confirmDialog').mockReturnValue(false);

    stageNistContributor({ peopleID: 999 });
    component.addRow();
    const row = component.dmpContributors[0];

    component.unmatchedContributors = [
      { id: row.id, contributorName: `${row.firstName} ${row.lastName}`, peopleID: row.peopleID },
    ];

    component.removeUnmatchedContributor({ id: row.id } as any);

    // Cancelled delete: both the row and the notice entry must remain.
    expect(component.dmpContributors.length).toBe(1);
    expect(component.unmatchedContributors.length).toBe(1);
  });

  it('dismissUnmatchedNotice clears the panel without touching the table', () => {
    stageNistContributor({ peopleID: 1010 });
    component.addRow();
    const row = component.dmpContributors[0];

    component.unmatchedContributors = [
      { id: row.id, contributorName: `${row.firstName} ${row.lastName}`, peopleID: row.peopleID },
    ];

    component.dismissUnmatchedNotice();

    expect(component.unmatchedContributors.length).toBe(0);
    // Dismissing the notice must NOT remove the contributor from the table.
    expect(component.dmpContributors.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Unmatched detection through the autoupdate pipeline
  //
  // These drive runNistAutoUpdate for real by overriding getPeopleIndexFor to
  // return a fake index. They prove recordUnmatchedContributor is reached on
  // the two miss paths, not just that removal works once the array is set.
  //
  // Helpers:
  //  - fakeIndex(...suggestions) builds an SDIndex-like object whose
  //    getSuggestions returns the given suggestions regardless of query.
  //  - fakePerson(rec) builds a suggestion whose getRecord() resolves to rec.
  // ---------------------------------------------------------------------------

  function fakePerson(rec: any) {
    return { getRecord: () => Promise.resolve(rec) };
  }

  function fakeIndex(...suggestions: any[]) {
    return { getSuggestions: (_q: string) => suggestions } as any;
  }

  /** Loads a single NIST contributor into the table WITHOUT going through the
   *  autoupdate pipeline, so a test can invoke runNistAutoUpdate deliberately. */
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
      peopleID: 999,   // does NOT match the contributor's 500
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
      peopleID: 500,   // matches
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
});