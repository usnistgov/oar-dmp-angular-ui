import { Component } from '@angular/core';
import { DmpAPIService } from './dmp-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dmp_ui2';
  nistPeople = [];
  constructor(private apiService: DmpAPIService){
    this.getgetAllFromAPI();
  }
  doSomethingElse(){
    console.log("something else")
  }

  getgetAllFromAPI(){
    this.apiService.getAll().subscribe(
      {
        next: (v) => {console.log(v), this.doSomethingElse()},
        error: (e) => console.error(e),
        complete: () => console.info('complete') 
      }
    );
  }
}
