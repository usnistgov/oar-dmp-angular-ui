import { DmpExportService } from './dmp-export.service';
import { DMP_Meta } from '../types/DMP.types';

// ---------------------------------------------------------------------------
// Mock file-saver: capture what would be written instead of downloading.
// ---------------------------------------------------------------------------
import { saveAs } from 'file-saver';
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

// ---------------------------------------------------------------------------
// Mock jsPDF + DmpPdf so PDF export doesn't touch canvas/jsPDF internals.
// We only need to assert the service *drives* the PDF builder; the PDF layout
// itself is DmpPdf's concern (tested separately).
// ---------------------------------------------------------------------------
// The service does `import jsPDF from 'jspdf'; new jsPDF(...)`, so the mock
// must expose a constructable DEFAULT export (with __esModule so interop picks
// up .default rather than the module object).
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

const pdfCalls: any = {
  printHeader: jest.fn(),
  printTextField: jest.fn(),
  printTable: jest.fn(),
  exportAsPDF: jest.fn(),
};
jest.mock('../dmp-form/dmp-pdf', () => ({
  DmpPdf: jest.fn().mockImplementation(() => pdfCalls),
}));

const mockedSaveAs = saveAs as jest.MockedFunction<typeof saveAs>;

/** The most recent saveAs call's arguments, or undefined if never called. */
function lastSaveCall(): [Blob | string, string?] | undefined {
  const calls = mockedSaveAs.mock.calls;
  return calls.length ? (calls[calls.length - 1] as [Blob | string, string?]) : undefined;
}

/** Reads a Blob's text content. jsdom's Blob lacks .text(), so use FileReader. */
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/** Reads the text content of the Blob passed to the most recent saveAs call. */
async function lastSavedText(): Promise<string> {
  const blob = lastSaveCall()?.[0] as Blob;
  expect(blob).toBeInstanceOf(Blob);
  return await readBlob(blob);
}

/** Filename of the most recent saveAs call. */
function lastSavedName(): string {
  return lastSaveCall()?.[1] as string;
}

/** A fully-populated, benign DMP record for happy-path assertions. */
function makeDmp(overrides: Partial<DMP_Meta> = {}): DMP_Meta {
  return {
    title: 'My Plan',
    startDate: '2025-01-01',
    dmpSearchable: 'yes',
    funding: { grant_source: 'Grant Number', grant_id: 'G-123' },
    projectDescription: 'A description.',

    organizations: [
      { groupName: 'Grp', groupNumber: '1', groupOrgID: 1,
        divisionName: 'Div', divisionNumber: '2', divisionOrgID: 2, divisionAcronym: 'D',
        ouName: 'OU', ouNumber: '3', ouOrgID: 3, ouAcronym: 'O' },
    ],
    contributors: [
      { firstName: 'Ada', lastName: 'Lovelace', orcid: '0000-0001-0002-0003',
        emailAddress: 'ada@example.gov',
        groupOrgID: 1, groupNumber: '1', groupName: 'Grp',
        divisionOrgID: 2, divisionNumber: '2', divisionName: 'Div',
        ouOrgID: 3, ouNumber: '3', ouName: 'OU',
        primary_contact: 'Yes', institution: 'NIST', role: 'Project Leader' },
    ],

    keywords: ['alpha', 'beta'],

    dataSize: 10,
    sizeUnit: 'GB',
    dataSizeDescription: 'of data',
    softwareDevelopment: { development: 'no', softwareUse: '', softwareDatabase: '', softwareWebsite: '' },
    technicalResources: ['HPC cluster'],
    instruments: [{ name: 'Microscope', description_url: 'http://example.gov/scope' }],

    ethical_issues: {
      irb_number: 'IRB-1', ethical_issues_exist: 'no',
      ethical_issues_description: '', ethical_issues_report: '',
    },
    security_and_privacy: { data_sensitivity: ['low'], cui: [] },

    dataDescription: 'Some data.',
    dataCategories: ['cat1'],

    preservationDescription: 'Keep it.',
    dataAccess: 'Open.',
    pathsURLs: ['http://example.gov/data'],

    ...overrides,
  } as DMP_Meta;
}

describe('DmpExportService', () => {
  let service: DmpExportService;

  beforeEach(() => {
    // DmpExportService has no injected dependencies, so we construct it
    // directly and avoid TestBed / initTestEnvironment entirely.
    service = new DmpExportService();
    jest.clearAllMocks();
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Dispatch / guards
  // -------------------------------------------------------------------------
  describe('export() dispatch', () => {
    it('does nothing (and warns) when dmp is undefined', () => {
      const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
      service.export(undefined, 'JSON');
      expect(mockedSaveAs).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('routes JSON to a .json file', async () => {
      service.export(makeDmp(), 'JSON');
      expect(lastSavedName()).toBe('DMP.json');
      const text = await lastSavedText();
      expect(JSON.parse(text).title).toBe('My Plan');
    });

    it('routes Markdown to a .md file', () => {
      service.export(makeDmp(), 'Markdown');
      expect(lastSavedName()).toBe('DMP.md');
    });

    it('routes PDF through the DmpPdf builder and saves via exportAsPDF', () => {
      service.export(makeDmp(), 'PDF');
      // PDF path doesn't call saveAs (DmpPdf.exportAsPDF handles saving)
      expect(pdfCalls.exportAsPDF).toHaveBeenCalledTimes(1);
      expect(pdfCalls.printHeader).toHaveBeenCalledWith('Data Management Plan', 0.1, '#707b7c');
    });
  });

  // -------------------------------------------------------------------------
  // JSON
  // -------------------------------------------------------------------------
  describe('JSON export', () => {
    it('pretty-prints the full record', async () => {
      service.export(makeDmp({ title: 'Round Trip' }), 'JSON');
      const parsed = JSON.parse(await lastSavedText());
      expect(parsed.title).toBe('Round Trip');
      expect(parsed.contributors[0].lastName).toBe('Lovelace');
    });
  });

  // -------------------------------------------------------------------------
  // Markdown happy path
  // -------------------------------------------------------------------------
  describe('Markdown export — content', () => {
    it('includes the document title and all section headings', async () => {
      service.export(makeDmp(), 'Markdown');
      const md = await lastSavedText();

      expect(md).toContain('# Data Management Plan');
      expect(md).toContain('## Basic Information');
      expect(md).toContain('## Researchers');
      expect(md).toContain('## Keywords / Phrases');
      expect(md).toContain('## Technical Requirements');
      expect(md).toContain('## Ethical Concerns');
      expect(md).toContain('## Security and Privacy');
      expect(md).toContain('## Data Description');
      expect(md).toContain('## Data Preservation and Accessibility');
    });

    it('renders prose fields as bold labels', async () => {
      service.export(makeDmp(), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('**Title:** My Plan');
      expect(md).toContain('**Start Date:** 2025-01-01');
      expect(md).toContain('**Make DMP Searchable:** yes');
    });

    it('renders the contributors table with a single-line Primary Contact header', async () => {
      service.export(makeDmp(), 'Markdown');
      const md = await lastSavedText();
      // Markdown must NOT contain the PDF-only newline in the header
      expect(md).toContain('Primary Contact');
      expect(md).not.toContain('Primary\nContact');
      expect(md).toContain('Ada');
      expect(md).toContain('Lovelace');
    });

    it('omits optional software sub-fields that are empty strings', async () => {
      service.export(makeDmp(), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('**Software Development:** no');
      // softwareUse/Database/Website are '' -> their labels must be absent
      expect(md).not.toContain('Software developed for this project will be for');
      expect(md).not.toContain('require a database');
      expect(md).not.toContain('produce a website interface');
    });
  });

  // -------------------------------------------------------------------------
  // Markdown escaping — the security-relevant part
  // -------------------------------------------------------------------------
  describe('Markdown escaping — table cells', () => {
    it('escapes pipes so a value cannot break table structure', async () => {
      service.export(makeDmp({ keywords: ['a|b'] }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('a\\|b');
      expect(md).not.toContain('|a|b|'); // raw pipe would forge a 3-column row
    });

    it('collapses newlines inside a cell', async () => {
      service.export(makeDmp({ keywords: ['line1\nline2'] }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('line1 line2');
      expect(md).not.toContain('line1\nline2');
    });

    it('neutralizes inline HTML in cells', async () => {
      service.export(makeDmp({ keywords: ['<img src=x onerror=alert(1)>'] }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('&lt;img');
      expect(md).not.toContain('<img');
    });

    it('defuses link/image and inline-code syntax in cells', async () => {
      service.export(makeDmp({ keywords: ['[click](http://evil)`code`'] }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('\\[click\\]');
      expect(md).toContain('\\`code\\`');
    });

    it('escapes backslashes before other escapes (no double-eating)', async () => {
      service.export(makeDmp({ keywords: ['a\\b'] }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('a\\\\b');
    });
  });

  describe('Markdown escaping — prose', () => {
    it('escapes leading block markers so a value cannot start a heading/list', async () => {
      service.export(makeDmp({ title: '# not a heading' }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('**Title:** \\# not a heading');
      expect(md).not.toContain('**Title:** # not a heading');
    });

    it('neutralizes inline HTML in prose', async () => {
      service.export(makeDmp({ projectDescription: '<script>x</script>' }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('&lt;script&gt;');
      expect(md).not.toContain('<script>');
    });

    it('leaves pipes untouched in prose (they are harmless there)', async () => {
      service.export(makeDmp({ projectDescription: 'a | b' }), 'Markdown');
      const md = await lastSavedText();
      expect(md).toContain('a | b');
    });
  });

  // -------------------------------------------------------------------------
  // Null/empty tolerance
  // -------------------------------------------------------------------------
  describe('missing / empty values', () => {
    it('handles empty collections without throwing', () => {
      const empty = makeDmp({
        contributors: [], organizations: [], keywords: [],
        technicalResources: [], instruments: [],
        dataCategories: [], pathsURLs: [],
        security_and_privacy: { data_sensitivity: [], cui: [] },
      });
      expect(() => service.export(empty, 'Markdown')).not.toThrow();
    });

    it('renders empty string for null field values in cells', async () => {
      service.export(makeDmp({ keywords: [null as any] }), 'Markdown');
      const md = await lastSavedText();
      // The row exists but the cell is empty (no "null" text leaking through)
      expect(md).not.toContain('null');
    });
  });
});