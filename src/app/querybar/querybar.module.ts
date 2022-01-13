import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuerybarComponent } from './querybar.component';
import { QuerybarStructureComponent } from './querybar.structure.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { QuerybarSemanticRoleComponent } from './querybar.semanticrole.component';
import { AutocompleteModule } from '../components/autocomplete/autocomplete.module';

@NgModule({
  declarations: [QuerybarComponent, QuerybarStructureComponent, QuerybarSemanticRoleComponent],
  exports: [QuerybarComponent, QuerybarStructureComponent, QuerybarSemanticRoleComponent],
  imports: [CommonModule, NgbModule, FontAwesomeModule, FormsModule, AutocompleteModule]
})
export class QuerybarModule {}

