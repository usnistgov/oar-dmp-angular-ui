import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-error',
  templateUrl: './page-error.component.html',
  styleUrls: ['./page-error.component.scss']
})
export class PageErrorComponent implements OnInit {
  errorMessage:string = "";

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // console.log(this.route.snapshot.params['foo']);
    this.errorMessage = this.route.snapshot.params['dmpError'];

  }

}
