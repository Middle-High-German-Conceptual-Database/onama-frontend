import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { AppComponent } from './app.component';
import { QuerybarModule } from './querybar/querybar.module';
import { ContentDisplayModule } from './contentdisplay/contentdisplay.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { setupFontAwesomeLibrary } from './fontawesome';
import { FormsModule } from '@angular/forms';
import { registerLocaleData, APP_BASE_HREF } from '@angular/common';
import localeDe from "@angular/common/locales/de";
import { DetailModule } from './detail/detail.module';
import { Routes, RouterModule } from '@angular/router';
import { ContentDisplayComponent } from './contentdisplay/contentdisplay.component';

const routes: Routes = [
  { path: 'object/:iri', component: ContentDisplayComponent},
  { path: 'onama-abfrage/:iri', component: ContentDisplayComponent},
  { path: 'onama-query/:iri', component: ContentDisplayComponent},
  { path: '**', component: AppComponent }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    QuerybarModule,
    ContentDisplayModule,
    DetailModule,
    NgbModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [{provide: APP_BASE_HREF, useValue: '/'}],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor(library: FaIconLibrary){
    setupFontAwesomeLibrary(library);
    registerLocaleData(localeDe);
  }
}
