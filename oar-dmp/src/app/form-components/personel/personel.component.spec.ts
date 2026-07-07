import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { of } from 'rxjs';

import { PersonelComponent } from './personel.component';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
import { UpdateNistContributorService } from 'src/app/shared/update-nist-contributor.service';
import { StaffDirectoryService } from 'oarng';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// confirmDialog is a standalone exported function from dmp.service.
// Spied per-test to control the confirm/cancel result.
import * as dmpService from 'src/app/shared/dmp.service';

describe('PersonelComponent', () => {
  let component: PersonelComponent;
  let fixture: ComponentFixture<PersonelComponent>;

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
    declarations: [ PersonelComponent ],
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
    fixture = TestBed.createComponent(PersonelComponent);
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
  });

  // ---------------------------------------------------------------------------
  // Duplicate detection
  // ---------------------------------------------------------------------------

  it('rejects a duplicate contributor and surfaces an error message', () => {
    stageNistContributor();
    component.addRow();
    expect(component.dmpContributors.length).toBe(1);

    stageNistContributor();
    component.addRow();

    expect(component.dmpContributors.length).toBe(1);
    expect(component.errorMessage).toContain('already in the list');
  });

  it('falls back to composite identity when email is empty', () => {
    stageNistContributor({ emailAddress: '', firstName: 'Grace', lastName: 'Hopper', groupNumber: '999' });
    component.addRow();
    expect(component.dmpContributors.length).toBe(1);

    stageNistContributor({ emailAddress: '', firstName: 'Katherine', lastName: 'Johnson', groupNumber: '888' });
    component.addRow();
    expect(component.dmpContributors.length).toBe(2);

    stageNistContributor({ emailAddress: '', firstName: 'Grace', lastName: 'Hopper', groupNumber: '999' });
    component.addRow();
    expect(component.dmpContributors.length).toBe(2);   // rejected as duplicate
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
});