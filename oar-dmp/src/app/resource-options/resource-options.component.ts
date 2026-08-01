import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

// In the child, we need to import the service "ResourcesService" file to be able to use it.
import { ResourcesService } from '../shared/resources.service';
import { LoadResourcesService } from '../shared/load-resources.service';


@Component({
  selector: 'app-resource-options',
  templateUrl: './resource-options.component.html',
  styleUrls: ['./resource-options.component.scss']
})
export class ResourceOptionsComponent implements OnInit, OnDestroy, AfterViewInit {

  /** Fires once on destroy; every long-lived subscription pipes takeUntil(this). */
  private destroy$ = new Subject<void>();

  // Guards so each stream is wired at most once.
  private storageSubscribed = false;
  private softwareSubscribed = false;

  // we inject shared service ResourcesService in the constructor.
  constructor(
    private sharedService: ResourcesService,
    private nistResources: LoadResourcesService
  ) { }

  storageSelection: string = "";
  softwareSelection: string = "";

  availableResources: any = {};

  ngOnInit(): void {
    this.storageSubscribe();
    this.softwareSubscribe();
    this.availableResources = this.nistResources.getAllResources();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //subscribe to a particular subject
  storageSubscribe() {
    if (this.storageSubscribed) return;
    this.storageSubscribed = true;

    this.sharedService.storageSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.storageSelection = message;
        }
      });
  }

  //subscribe to a particular subject
  softwareSubscribe() {
    if (this.softwareSubscribed) return;
    this.softwareSubscribed = true;

    this.sharedService.softwareSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.softwareSelection = message;
        }
      });
  }

}