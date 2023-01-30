import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DmpFormComponent } from '../dmp-form/dmp-form.component';
import { PageNotFoundComponent } from '../page-not-found/page-not-found.component';

const routes: Routes = [
  { path: 'new', component: DmpFormComponent, data: {action:"new"} },
  { path: 'edit', component: DmpFormComponent, data: {action:"edit"} },
  { path: '**', component: PageNotFoundComponent },  // Wildcard route for a 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class DmpRoutingModule { }
