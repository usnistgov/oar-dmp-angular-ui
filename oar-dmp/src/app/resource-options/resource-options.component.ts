//Example of passing data from parent component (app.component) to the child component (resource-options.component)
// Start with declaring Input decorator
//import { Component, OnInit, Input } from '@angular/core';
import { Component, OnInit, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs';

// In the child, we need to import the service "ResourcesService" file to be able to use it. 
import { ResourcesService } from '../shared/resources.service';

@Component({
  selector: 'app-resource-options',
  templateUrl: './resource-options.component.html',
  styleUrls: ['./resource-options.component.scss']
})
export class ResourceOptionsComponent implements OnInit {

  subscription!: Subscription | null;
  softwareSubscription!: Subscription | null;
  databaseSubscription!: Subscription | null;
  websiteSubscription!: Subscription | null;

  // to pass data from parent to this component we declare an input decorator along
  // with a property named data wich is of type string
  // @Input() data :any

  // we inject shared service ResourcesService in the constructor.
  constructor(private sharedService:ResourcesService) { }

  // message : any
  storageSelection: string = "";
  computingSelection: string = "";
  networkSelection: string = "";
  
  websiteSelection: string = "";
  databaseSelection: string = "";  
  awsSelection: string = "";

  colaborationSelection: string = "";
  softwareSelection: string = "";
  dataSelection: string = "";

  ngOnInit(): void {
    // this.message = this.sharedService.getMessage()
    this.subscribe()
    this.softwareSubscribe()
    this.databaseSubscribe()
    this.websiteSubscribe()
  }

  //subscribe to a particular subject
  subscribe() {
    if (!this.subscription) {
      //subscribe if not already subscribed
      this.subscription = this.sharedService.storageSubject$.subscribe({
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

  databaseSubscribe() {
    if (!this.databaseSubscription) {
      //subscribe if not already subscribed
      this.databaseSubscription = this.sharedService.databaseSubject$.subscribe({
        next: (message) => {
          this.databaseSelection = message;
        }
      });
    }
  }

  websiteSubscribe() {
    if (!this.websiteSubscription) {
      //subscribe if not already subscribed
      this.websiteSubscription = this.sharedService.websiteSubject$.subscribe({
        next: (message) => {
          this.websiteSelection = message;
        }
      });
    }
  }

}
