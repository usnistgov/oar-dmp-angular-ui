import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ethical-issues',
  templateUrl: './ethical-issues.component.html',
  styleUrls: ['./ethical-issues.component.scss']
})
export class EthicalIssuesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  private selectedEthicalIssue: string="no"; 

  setEthicalIssues(e: string): void {
    this.selectedEthicalIssue = e; 
  }

  selEthicalIssues(name:string): boolean{
    if (!this.selectedEthicalIssue) { // if no radio button is selected, always return false so every nothing is shown  
      return false;  
    }  
    return (this.selectedEthicalIssue === name); // if current radio button is selected, return true, else return false 

  }


}
