import { Component, OnInit } from '@angular/core';
import { PersonelService } from '../personel.service';
import { ROLES } from '../mock-roles';
import { Contributor } from '../contributor';
import { DmpAPIService } from '../dmp-api.service';
@Component({
  selector: 'app-personel',
  templateUrl: './personel.component.html',
  styleUrls: ['./personel.component.scss']
})
export class PersonelComponent implements OnInit {

  constructor(
    private personelService: PersonelService,
    private apiService: DmpAPIService
  ) { 
    this.getgetAllFromAPI();
  }

  ngOnInit(): void {
  }  

  btnAddContrib: boolean=false;
  //List of contributors that will be aded to the DMP
  contributors: Contributor[]=[];

  //List of all nist contacts from NIST directory
  nistContacts: any = null;

  getgetAllFromAPI(){
    this.apiService.getAll().subscribe(
      {
        next: (v) => {
          console.log(v); 
          this.nistContacts = v;
        },
        error: (e) => console.error(e),
        complete: () => console.info('complete') 
      }
    );
  }

  //current selection string on dropdown option
  //for Primary NIST Contact
  primNistContact: string = "";


  
  crntNistContactGrp: string = "";
  crntNistContactName: string = "";
  selPrimNistContact() {
    //Select primary contact from a drop down list of NIST contacts
    this.crntNistContactGrp = this.personelService.getDropDownText(this.primNistContact, this.nistContacts)[0].group;
    this.crntNistContactName = this.personelService.getDropDownText(this.primNistContact, this.nistContacts)[0].name;
  }

  private contributorOption: string="false";
  setContributor(e:string):void{
    this.contributorOption = e;

  }
  selectedContributor(name: string): boolean{
    
    
    if (!this.contributorOption) { // if no radio button is selected, always return false so every nothing is shown  
      return false;  
    }  
    return (this.contributorOption === name); // if current radio button is selected, return true, else return false  

  }

  nistContributor: string = "";
  crntNistContribName: string = "";
  crntNistContribSurname: string = "";
  crntNistContribEmail: string = "";
  selNistContributor(){
    
    this.crntNistContribName = this.personelService.getDropDownText(this.nistContributor, this.nistContacts)[0].firstName;
    this.crntNistContribSurname = this.personelService.getDropDownText(this.nistContributor, this.nistContacts)[0].lastName;
    this.crntNistContribEmail = this.personelService.getDropDownText(this.nistContributor, this.nistContacts)[0].e_mail;
  }

  private clearContributor():void{
    this.contributorRole ="";
    this.nistContributor = "";
    this.externalContributor = {firstName:"", lastName:"",instituion:"", e_mail:"", role:""};
  }

  contributorRoles = ROLES;
  contributorRole: string = "";
  crntContribRole:any;
  selContributorRole(){
    // select role for the contributors from a drop down list
    this.crntContribRole = this.personelService.getDropDownText(this.contributorRole, this.contributorRoles)[0].value;
  }

  // Default values of external contributor
  externalContributor: Contributor={firstName:"", lastName:"",instituion:"", e_mail:"", role:""};
  
  addContributor(role:string):void{
    if (this.contributorRadioSel === "contributorNIST"){
      //Add NIST employe / associate contributor
      this.contributors.push(
        {
          firstName: this.crntNistContribName,
          lastName: this.crntNistContribSurname,
          instituion:"NIST",
          e_mail:this.crntNistContribEmail,
          role:this.crntContribRole
        }
      );
    }
    else if (this.contributorRadioSel === "contributorExternal"){
      console.log("adding contributorExternal");
      this.externalContributor.role=this.crntContribRole
      this.contributors.push(this.externalContributor);
    }
    
    //Clear previously selected options on radio button click
    this.clearContributor();

  }

  private contributorRadioSel: string="";
  onContributorChange(value:any){
    console.log(value.id);
    this.contributorRadioSel=value.id;
    this.btnAddContrib=true;
  }

  dmpReviewer: string="";
  crntReviewerName: string="";
  crntReviewerSurname: string="";
  selDmpReviewer(){
    // select DMP reviewer from a drip down list
    this.crntReviewerName = this.personelService.getDropDownText(this.dmpReviewer, this.nistContacts)[0].firstName;
    this.crntReviewerSurname = this.personelService.getDropDownText(this.dmpReviewer, this.nistContacts)[0].lastName;
  }



}
