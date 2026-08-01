import { TestBed } from '@angular/core/testing';

// Sibling import — the spec lives next to the service in shared/.
import { SubmitDmpService } from './submit-dmp.service';

describe('SubmitDmpService', () => {
  let service: SubmitDmpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubmitDmpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setButtonMessage', () => {
    it('stores the button message', () => {
      service.setButtonMessage('Save');
      expect(service.buttonMessage).toBe('Save');
    });

    it('overwrites a previously stored button message', () => {
      service.setButtonMessage('Save');
      service.setButtonMessage('Download');
      expect(service.buttonMessage).toBe('Download');
    });
  });

  describe('setexportFormat', () => {
    it('stores the export format', () => {
      service.setexportFormat('PDF');
      expect(service.exportFormat).toBe('PDF');
    });

    it('overwrites a previously stored export format', () => {
      service.setexportFormat('PDF');
      service.setexportFormat('JSON');
      expect(service.exportFormat).toBe('JSON');
    });
  });

  describe('buttonSubject$', () => {
    it('emits the value pushed onto it', () => {
      const received: string[] = [];
      service.buttonSubject$.subscribe(v => received.push(v));
      service.buttonSubject$.next('Save');
      expect(received).toEqual(['Save']);
    });

    it('does not replay to late subscribers (plain Subject)', () => {
      const received: string[] = [];
      service.buttonSubject$.next('missed');
      service.buttonSubject$.subscribe(v => received.push(v));
      service.buttonSubject$.next('Download');
      expect(received).toEqual(['Download']);
    });
  });

  describe('exportFormatSubject$', () => {
    it('emits the value pushed onto it', () => {
      const received: string[] = [];
      service.exportFormatSubject$.subscribe(v => received.push(v));
      service.exportFormatSubject$.next('Markdown');
      expect(received).toEqual(['Markdown']);
    });
  });

  it('keeps the setter state and the subjects independent', () => {
    // Calling a setter must NOT emit on the subject, and vice versa.
    const received: string[] = [];
    service.buttonSubject$.subscribe(v => received.push(v));
    service.setButtonMessage('Save');
    expect(received).toEqual([]); // setter didn't emit
    expect(service.buttonMessage).toBe('Save');
  });
});