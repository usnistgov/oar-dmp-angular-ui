import { Component, OnInit } from '@angular/core';

import { PageResizeService } from '../shared/page-resize.service';

@Component({
  selector: 'app-page-dmp-published',
  templateUrl: './page-dmp-published.component.html',
  styleUrls: ['./page-dmp-published.component.scss']
})
export class PageDmpPublishedComponent implements OnInit {

  constructor(
    private elementResize:PageResizeService
  ) { }

  ngOnInit(): void {
    this.elementResize.elementResize("DmpPublished");
  }

}
