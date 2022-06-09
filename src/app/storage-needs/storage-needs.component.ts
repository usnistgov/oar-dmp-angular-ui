import { Component, OnInit } from '@angular/core';
import { PersonelService } from '../personel.service';

@Component({
  selector: 'app-storage-needs',
  templateUrl: './storage-needs.component.html',
  styleUrls: ['./storage-needs.component.scss']
})
export class StorageNeedsComponent implements OnInit {

  constructor(
    private personelService: PersonelService
  ) { }

  ngOnInit(): void {
  }
  dataSize = "3";
  dataSetSize: any;

  dataUnits =[    
    {
      id: "1",
      size: 'MB'
    },
    {
      id: "2",
      size: 'GB'
    },
    {
      id: "3",
      size: 'TB'
    }
  ];

  selDataSize(){
    this.dataSetSize = this.personelService.getDropDownText(this.dataSize, this.dataUnits)[0].group;
    const myDiv1 = document.getElementById("myDiv1");
    const span = document.createElement("span")
    span.textContent= this.dataSetSize;
    myDiv1?.appendChild(span);
  }

  techRsrc: string[] = [];
  newTechRsrc = '';
  techRsrcErr = '';

  techRsrcOnInput(value: string) {
    this.newTechRsrc = value;
  }

  techRsrcOnClick() {
    if (!this.newTechRsrc.length) {
      this.techRsrcErr = "Technical Resources can't be empty";
      return;
    }

    this.techRsrcErr = '';
    this.techRsrc.push(this.newTechRsrc);
    this.newTechRsrc = '';
  }

  techRsrcOnClickClear(){
    this.techRsrc = [];
    this.techRsrcErr = '';
  }

}
