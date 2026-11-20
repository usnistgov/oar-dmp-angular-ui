import { TestBed } from '@angular/core/testing';

// Sibling import — the spec lives next to the service in shared/.
import { SubmitDmpService, DmpButtonAction } from './submit-dmp.service';

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
    it('stores the button action', () => {
      service.setButtonMessage({ action: 'Save' });
      expect(service.buttonMessage).toEqual({ action: 'Save' });
    });

    it('stores a Download action together with its format', () => {
      service.setButtonMessage({ action: 'Download', format: 'PDF' });
      expect(service.buttonMessage).toEqual({ action: 'Download', format: 'PDF' });
    });

    it('overwrites a previously stored button action', () => {
      service.setButtonMessage({ action: 'Save' });
      service.setButtonMessage({ action: 'Download', format: 'JSON' });
      expect(service.buttonMessage).toEqual({ action: 'Download', format: 'JSON' });
    });
  });

  describe('buttonSubject$', () => {
    it('emits the action pushed onto it', () => {
      const received: DmpButtonAction[] = [];
      service.buttonSubject$.subscribe(v => received.push(v));
      service.buttonSubject$.next({ action: 'Save' });
      expect(received).toEqual([{ action: 'Save' }]);
    });

    it('emits a Download action with its format', () => {
      const received: DmpButtonAction[] = [];
      service.buttonSubject$.subscribe(v => received.push(v));
      service.buttonSubject$.next({ action: 'Download', format: 'Markdown' });
      expect(received).toEqual([{ action: 'Download', format: 'Markdown' }]);
    });

    it('does not replay to late subscribers (plain Subject)', () => {
      const received: DmpButtonAction[] = [];
      service.buttonSubject$.next({ action: 'Save' }); // emitted before anyone subscribed
      service.buttonSubject$.subscribe(v => received.push(v));
      service.buttonSubject$.next({ action: 'Download', format: 'PDF' });
      expect(received).toEqual([{ action: 'Download', format: 'PDF' }]);
    });
  });

  it('keeps setButtonMessage state and the subject independent', () => {
    // Calling the setter must NOT emit on the subject, and vice versa.
    const received: DmpButtonAction[] = [];
    service.buttonSubject$.subscribe(v => received.push(v));
    service.setButtonMessage({ action: 'Save' });
    expect(received).toEqual([]); // setter didn't emit
    expect(service.buttonMessage).toEqual({ action: 'Save' });
  });
});