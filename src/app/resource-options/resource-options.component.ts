//Example of passing data from parent component (app.component) to the child component (resource-options.component)
// Start with declaring Input decorator
//import { Component, OnInit, Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';

// In the child, we need to import the service "ResourcesService" file to be able to use it. 
import { ResourcesService } from '../shared/resources.service';

@Component({
  selector: 'app-resource-options',
  templateUrl: './resource-options.component.html',
  styleUrls: ['./resource-options.component.scss']
})
export class ResourceOptionsComponent implements OnInit {

  // to pass data from parent to this component we declare an input decorator along
  // with a property named data wich is of type string
  // @Input() data :any
  
  // we inject shared service ResourcesService in the constructor.
  constructor(private shared:ResourcesService) { }

  message = "Hey I'm resources component"

  ngOnInit(): void {
    this.shared.setMessage(this.message);
  }

}
