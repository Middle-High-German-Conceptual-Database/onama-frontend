import { Component, OnInit, EventEmitter, Input, AfterViewInit, AfterContentChecked, AfterViewChecked } from "@angular/core";
import { Routes, RouterModule, ActivatedRoute, NavigationEnd, Router, RouterEvent  } from '@angular/router';
import { Repository, QueryResponse, ResultQuery, ResultSOP } from '../repository/repository.service';
import { getOnamaIcon } from '../fontawesome';
import * as lodash from "lodash";
import deepdash from "deepdash";
import { debounce } from '../debounce';
const _ = deepdash(lodash);

@Component({
  selector: "content-display",
  templateUrl: "./contentdisplay.component.html",
  styleUrls: ["./contentdisplay.component.scss"]
})
export class ContentDisplayComponent implements OnInit {
  msg: string = "<not received>";
  query: string;
  isRandom: boolean;
  columns: string[] = [];
  results: ResultQuery[] = [];
  filterResults: ResultQuery[] = [];

  filterCounts: { [uri: string]: number } = {};

  public filter: string = "";

  public detailID: string;

  public longId: string;

  public labelMap = {};

  public classLabels: { checked: boolean, uri: string, count: number }[] = [];

  showDetail: boolean = false;

  queryVisible: boolean = false;
  public loading: boolean = true;

  public expandRandomHelp: boolean = false;

  detailIRI: string;

  constructor(private repository: Repository, private router: Router, private route: ActivatedRoute) {
    repository.loadingEvent.subscribe(() => { this.loading = true; })
    repository.eventContentUpdated.subscribe((resp) => {
      this.update(resp)
    });
    this.route.queryParams.subscribe(
      data => {
        this.detailIRI = data['iri'];
      }
    );
  }

  public getOnamaIcon = getOnamaIcon;

  async ngOnInit(): Promise<void> {   
    this.repository.showSidebar.emit(true);
    this.loading = true;
    var resp = await this.repository.getQuerybarSearch();
    var struct = (await this.repository.getQuerybarStructure()).classes;
    _.eachDeep(struct, (child, i, parent, ctx) => {
      this.labelMap[child.uri] = { label: child.label, depth: ctx?.depth };
    }, { childrenPath: 'owlHierarchy' })
    // in case of a detail view, we "preload" the result list with arbitrary results, 
    // so we have something to show after closing the detail
    await this.update(resp.response);
    if(this.detailIRI !== undefined) {
      const linkUrl = "http://onama.sbg.ac.at/object/" + this.detailIRI;
      this.detailIRI = undefined;
      await this.openDetail(linkUrl);
      this.loading = false;
    }
  }

  async update(resp: QueryResponse) {
    this.loading = true;
    this.results = [];
    this.filterResults = [];
    this.filterCounts = {};
    this.classLabels = [];
    this.msg = resp.message;
    this.query = resp.query;
    this.isRandom = resp.isRandom;
    this.columns = resp.columns;
    var results = <ResultQuery[]>resp.results;

    results.forEach(r => {
      if(r.label === undefined) {
        if(r.propertyLabel !== undefined) {
          r.label = r.propertyLabel;
        } else {
          r.label = r.node;
        }
      }
    });

    results = _.sortBy(results, [r => r.classUri?.value, r => r.label.value]);

    this.results = results;
    this.internalDoFilter();

    var tempresults = _.uniqBy(results, r => r.classUri?.value);
    tempresults.forEach(r => this.classLabels.push({ checked: false, uri: r.classUri?.value, count: this.filterCounts[r.classUri?.value] }));

    this.showDetail = false;
    this.repository.showSidebar.emit(true);
    this.loading = false;
  }

  async openDetail(linkUrl) {
    const id = linkUrl.split("/").pop();
    this.detailID = id;
    this.longId = linkUrl;
    this.showDetail = true;
    this.repository.showSidebar.emit(false);
  }

  undoFilter() {
    this.classLabels.forEach(c => c.checked = false);
    this.filter = "";
    this.internalDoFilter();
  }

  getMostSignificantUri(uris: string[]) {
    return this.getUrisSortBySignificance(uris).pop();
  }

  getUrisSortBySignificance(uris: string[]) {
    return _.sortBy(uris.map(uri => [uri, this.labelMap[uri]?.depth]), u => u[1]).map(u => u[0]);
  }

  @debounce(50)
  public doFilter() {
    this.internalDoFilter();
  }

  private internalDoFilter() {
    var filterResults = _.clone(this.results);
    var doubles = _.groupBy(filterResults, r => r.node.value);
    doubles = _.filter(doubles, x => x.length > 1);
    doubles.forEach(d => {
      _.remove(filterResults, f => f.node.value == d[0].node.value);
      filterResults.push({
        classUri: null,
        label: d[0].label,
        node: d[0].node,
        reo_uri: d[0].reo_uri,
        depictedin_uri: d[0].depictedin_uri,
        mergedClassUris: this.getUrisSortBySignificance(_.uniq(d.map(ds => ds.classUri.value)))
      });
    });

    filterResults.forEach(fr => {
      var uris = [];
      if (fr.classUri) uris.push(fr.classUri?.value);
      if (fr.mergedClassUris) uris.push(...fr.mergedClassUris);
      uris.forEach(uri => this.filterCounts[uri] = (this.filterCounts[uri] ?? 0) + 1);
    });

    if (this.classLabels.find(c => c.checked)) {
      filterResults = filterResults.filter(r =>
        this.classLabels.find(c => c.checked && (c.uri == r.classUri?.value || r.mergedClassUris?.includes(c.uri)))
      );
    }
    if (this.filter) {
      filterResults = filterResults.filter(r =>
        r.label.value.toLocaleLowerCase().includes(this.filter.toLocaleLowerCase())
      );
    }
    this.filterResults = filterResults;
  }
}
