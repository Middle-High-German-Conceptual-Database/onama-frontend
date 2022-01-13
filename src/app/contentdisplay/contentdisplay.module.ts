import { NgModule } from "@angular/core";
import { ContentDisplayComponent } from './contentdisplay.component';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DetailModule } from '../detail/detail.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { HighlightSearch } from '../highlightPipe';

@NgModule({
  declarations: [ContentDisplayComponent, HighlightSearch],
  exports: [ContentDisplayComponent],
  imports: [CommonModule, NgbModule, FontAwesomeModule, DetailModule, FormsModule]
})
export class ContentDisplayModule {

}
