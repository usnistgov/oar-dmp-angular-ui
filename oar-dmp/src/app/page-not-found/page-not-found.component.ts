import { Component, OnInit } from '@angular/core';
import { PageResizeService } from '../shared/page-resize.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {


  constructor(
    private elementResize:PageResizeService
  ) { 
    // console.log("page-notfound component - constructor");
  }

  ngOnInit(): void {
    this.elementResize.elementResize("PageNotFound");
  }

}
