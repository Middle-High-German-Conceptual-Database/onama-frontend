import { Component, Input, ElementRef, LOCALE_ID, Inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Repository } from './repository/repository.service';


@Component({
  selector: 'app-onama-query',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'webclient';

  public searchView = (<any>environment).defaultTab ? (<any>environment).defaultTab : "simple";

  @Input()
  develop: boolean;

  public showSidebar: boolean = false;

  constructor(private elementRef: ElementRef, private repo: Repository, @Inject(LOCALE_ID) private locale: string) {
    this.repo.showSidebar.subscribe((resp) => this.showSidebar = resp);
    this.develop = this.elementRef.nativeElement.getAttribute("develop") ?? false;
    this.repo.setLanguage(this.locale);
  }
}
