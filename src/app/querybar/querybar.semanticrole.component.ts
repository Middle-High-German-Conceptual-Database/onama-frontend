import { Component, NgModule, Input, Output } from "@angular/core";
import { CommonModule } from '@angular/common';
import { getOnamaIcon } from '../fontawesome';

@Component({
  selector: 'app-query-bar-semanticrole',
  templateUrl: './querybar.semanticrole.component.html',
  styleUrls: ['./querybar.component.scss']
})
export class QuerybarSemanticRoleComponent {

  @Input() data: any;

  public getOnamaIcon = getOnamaIcon;
}
