import { Component, OnInit } from '@angular/core';
import { ObservedValueOf } from "rxjs";
import { BasicInfoComponent } from '../form-components/basic-info/basic-info.component';

@Component({
  selector: 'app-dmp-form',
  templateUrl: './dmp-form.component.html',
  styleUrls: ['./dmp-form.component.scss']
})
export class DmpFormComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
