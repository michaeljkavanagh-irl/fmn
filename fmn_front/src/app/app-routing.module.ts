import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapComponent } from './map/map.component';


const routes: Routes = [

  { path: '', component: MapComponent},
  { path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes ,{
  onSameUrlNavigation: 'ignore'}) ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
