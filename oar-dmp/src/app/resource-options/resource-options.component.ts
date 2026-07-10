import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

// In the child, we need to import the service "ResourcesService" file to be able to use it.
import { ResourcesService } from '../shared/resources.service';
import { LoadResourcesService } from '../shared/load-resources.service';


@Component({
  selector: 'app-resource-options',
  templateUrl: './resource-options.component.html',
  styleUrls: ['./resource-options.component.scss']
})
export class ResourceOptionsComponent implements OnInit {

  storageSubscription!: Subscription | null;
  softwareSubscription!: Subscription | null;

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

  //subscribe to a particular subject
  storageSubscribe() {
    if (!this.storageSubscription) {
      //subscribe if not already subscribed
      this.storageSubscription = this.sharedService.storageSubject$.subscribe({
        next: (message) => {
          this.storageSelection = message;
        }
      });
    }
  }

  //subscribe to a particular subject
  softwareSubscribe() {
    if (!this.softwareSubscription) {
      //subscribe if not already subscribed
      this.softwareSubscription = this.sharedService.softwareSubject$.subscribe({
        next: (message) => {
          this.softwareSelection = message;
        }
      });
    }
  }

}