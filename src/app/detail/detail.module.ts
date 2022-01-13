import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { DetailComponent } from './detail.component';

@NgModule({
  declarations: [DetailComponent],
  exports: [DetailComponent],
  imports: [CommonModule, NgbModule, FontAwesomeModule, FormsModule]
})
export class DetailModule {

}
