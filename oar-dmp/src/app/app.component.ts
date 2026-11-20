import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Credentials, AuthenticationService, StaffDirectoryService, ConfigurationService,
  PermissionManagerDialogComponent } from 'oarng';
import { MatDialog } from '@angular/material/dialog';
import { SubmitDmpService } from './shared/submit-dmp.service';
import { FormChangedService } from './shared/form-changed.service';
import { DMPConfiguration } from './shared/config.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dmp_ui2';
  readyDisplay: boolean = false;
  creds: Credentials | null = null;

  authMessage: string = "You are not authenticated.";

  // Passed to <app-header>. Without these, oarng's HeaderComponent falls
  // back to its own default title text ("MIDAS DATA PUBLISHING"), which is
  // wrong for this app.
  appVersion: string = "1.0";
  titleLn1: string = "MIDAS";
  titleLn2: string = "DATA MANAGEMENT";

  disableSaveBtn: boolean = false;
  hasUnsavedChanges: boolean = false;
  currentDmpId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthenticationService,
    private sdsvc: StaffDirectoryService,
    private form_buttons: SubmitDmpService,
    private formChangedService: FormChangedService,
    private dialog: MatDialog,
    private configService: ConfigurationService
  ) { }

  ngOnInit(): void {
    this.authService.getCredentials()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info: Credentials) => {
          if (info.token) {
            // Authenticated
            this.creds = info;
            this.authMessage = "Welcome, " + (this.creds.userAttributes.userName || this.creds.userId);
            this.sdsvc.setAuthToken(info.token);
          } else {
            this.authMessage = "You are not logged in.";
          }
          this.readyDisplay = true;
        },
        error: (err: any) => {
          this.readyDisplay = true;
          if (err.status && err.status >= 500) {
            console.error("Auth server failure: " + err.message);
            this.authMessage = "Unable to log in; authentication server error";
          } else if (err.status && err.status === 401) {
            console.error("Auth server reports: user is unauthorized: " + err.message);
            this.authMessage = "User Log-in failure";
          } else {
            console.error("Auth server communication failure: " + err.message);
            this.authMessage = "Unable to log in; authentication server communication error";
          }
        }
      });

    this.saveButtonSubscribe();

    this.formChangedService.currentDmpId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => { this.currentDmpId = id; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Download buttons are disabled until the record has been saved at least
   * once (currentDmpId set) AND there are no unsaved edits since. This
   * replaces the old alert-after-click validation in dmp-form's
   * handleDownloadRequest with an upfront, visible disabled state.
   */
  get disableDownloadBtns(): boolean {
    return !this.currentDmpId || this.hasUnsavedChanges;
  }

  /**
   * Dispatches the selected action to the DMP form component. `format` is
   * only relevant for 'Download' — each format button passes its own format
   * directly, so there's no separate "select a format" step.
   */
  dmpButtonClick(action: string, format?: string): void {
    const payload = { action, format };
    this.form_buttons.setButtonMessage(payload);
    this.form_buttons.buttonSubject$.next(payload);
  }

  openShareDialog(): void {
    if (!this.currentDmpId) return;
    this.dialog.open(PermissionManagerDialogComponent, {
      data: {
        record: {
          id: this.currentDmpId,
          apiBase: this.configService.getConfig<DMPConfiguration>().PDRDMP
        },
        title: 'Share my record'
      },
      maxWidth: '95vw'
    });
  }

  // Subscribe to form-change state. Called once from ngOnInit; teardown via destroy$.
  saveButtonSubscribe(): void {
    this.formChangedService.disableSaveBtn$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => { this.disableSaveBtn = message; }
      });

    this.formChangedService.hasUnsavedChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unsaved) => { this.hasUnsavedChanges = unsaved; }
      });
  }
}