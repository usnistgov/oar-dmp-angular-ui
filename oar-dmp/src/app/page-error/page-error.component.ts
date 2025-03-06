import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageResizeService } from '../shared/page-resize.service';

@Component({
  selector: 'app-page-error',
  templateUrl: './page-error.component.html',
  styleUrls: ['./page-error.component.scss']
})
export class PageErrorComponent implements OnInit {
  errorMessage:string = "";

  constructor(
    private route: ActivatedRoute,
    private elementResize:PageResizeService
  ) { }

  ngOnInit(): void {
    this.errorMessage = this.route.snapshot.params['dmpError'];
    this.elementResize.elementResize("PageError");

  }

}
