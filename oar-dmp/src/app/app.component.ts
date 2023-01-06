import { Component } from '@angular/core';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dmp_ui2';

  //Message that will be sent from this parent component to the resource-options.component 
  // to the HTML file of the  parent component (app.component.html)
  // resourceCompMessage = "welcome child";
  constructor(){
    
  }

  
}
