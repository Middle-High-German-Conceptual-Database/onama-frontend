import { Component, NgModule, Input, Output } from "@angular/core";
import { CommonModule } from '@angular/common';
import { getOnamaIcon } from '../fontawesome';

@Component({
  selector: 'app-query-bar-structure',
  templateUrl: './querybar.structure.component.html',
  styleUrls: ['./querybar.component.scss']
})
export class QuerybarStructureComponent {

  @Input() data: any;

  expanded: boolean;
  propertiesExpanded: boolean;

  propertySearchTermVisible: boolean;
  propertySearchTerm: string;

  public getOnamaIcon = getOnamaIcon;
}
