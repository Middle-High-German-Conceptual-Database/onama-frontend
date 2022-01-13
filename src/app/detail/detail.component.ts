import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { Repository, Node, PredicateObject, ResultSOP } from '../repository/repository.service';
import * as _ from "lodash";
import { getOnamaIcon } from '../fontawesome';
import { environment } from 'src/environments/environment';
import { DetailModel, DetailLine, DetailNode } from './detailmodel';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  @Input()
  public id: string;

  @Input()
  public longId: string;

  @Output()
  public onClose = new EventEmitter();

  public results: ResultSOP[];
  public nodes: Node[];
  public nodeMap: {} = {};

  public lang: string;

  public types: ResultSOP[];
  public label: string;
  public description: string;
  public altLabel: string;

  public history = [];
  public currentHistoryPos: number = 0;

  public reoImageUrl: string;
  public depictedInUrl: string;

  public rdfLink: string;

  public labelMap: {} = {};
  public structMapProperties: { [uri: string]: { label: string, depth: number } } = {};
  public structMapClasses: { [uri: string]: { label: string, depth: number } } = {};
  public typeMap: { [uri: string]: { typeUri: string, name: string } } = {};

  public showDebug: boolean = false;

  public loading: boolean = false;

  public filter = ["rdf-schema#label", "annotationAdvice", "22-rdf-syntax-ns#type"];

  public queryOut: string;
  public queryIn: string;
  public queryVisible: boolean = false;

  public getOnamaIcon = getOnamaIcon;

  public propertyList: DetailNode[];
  public detailModelSubject: DetailLine[];
  public detailModelObject: DetailLine[];

  constructor(private repository: Repository) {
    this.showDebug = repository.showDebug;
  }

  async ngOnInit() {
    this.loading = true;
    await this.prepareDataNew();
    this.history.push({ id: this.id, longId: this.longId, label: this.label });
  }

  public clean = (uri: string) => uri?.split("/").pop();

  public getLabel = (node: Node) => node?.predicateObjects?.find(
    o => this.clean(o.predicate) == "rdf-schema#label"
      && o.object.split("@").pop() == this.repository.getLanguage())?.object.split("@")[0];


  /**
   * @param node
   * returns all rdf-syntax-types of the node
   */
  public getTypes = (node: Node) => node?.predicateObjects?.filter(
    o => this.clean(o.predicate) == "22-rdf-syntax-ns#type")?.map(t => t.object);

  /**
   * @param node
   * returns the first rdf-syntax-type of the node
   */
  public getType = (node: Node) => node?.predicateObjects?.find(
    o => this.clean(o.predicate) == "22-rdf-syntax-ns#type")?.object;

  public getNode = (uri: string) => this.nodeMap[uri];

  public getIntermLabel = (node: Node) => this.typeMap[node.uri]?.name;

  public getDisplayText = (node: Node) => this.getLabel(node) || this.getIntermLabel(node) || this.clean(node?.uri) || node;

  public filterPredicates = (preds: PredicateObject[]) => preds.filter(p => !this.filter.includes(this.clean(p.predicate)));

  public filterEmptyNodes = (nodes: Node[]) => nodes.filter(n => this.filterPredicates(n.predicateObjects).length > 0);

  async prepareDataNew() {
    this.loading = true;
    this.detailModelSubject = [];
    this.detailModelObject = [];

    this.types = [];
    this.label = "";
    this.description = "";
    this.rdfLink = "";
    this.altLabel = "";
    this.labelMap = {};
    this.typeMap = {};
    this.nodeMap = {};

    var response = await this.repository.getDescriptionFull(this.id);
    var structMapProperties = await this.repository.getLabelMapProperties();
    var structMapClasses = await this.repository.getLabelMapClasses();

    this.rdfLink = environment.baseUrl + "/rdfdescription?id=" + this.id;

    this.results = <ResultSOP[]>response.results;
    this.parseQuery(response.query);
    this.nodes = response.nodes;
    this.nodes.forEach(n => this.nodeMap[n.uri] = n);
    var lang = this.repository.getLanguage();


    var detailModel = new DetailModel(this.nodes, this.results, this.id, lang, structMapProperties, structMapClasses);
    this.propertyList = detailModel.propertyList;
    this.detailModelSubject = _.filter(detailModel.detailLines, d => d.subject.isCurrent);
    this.detailModelObject = _.filter(detailModel.detailLines, d => d.object.isCurrent);


    this.labelMap = detailModel.labelDict;
    this.typeMap = detailModel.typeDict;
    this.structMapProperties = structMapProperties;
    this.structMapClasses = structMapClasses;

    /* _.remove(this.results, r => r.predicate.split("/").pop() == "rdf-schema#label")
      .filter(r => r.object.split("@").pop() == lang).forEach(l => {
        this.labelMap[l.subject.split("/").pop()] = l.object.split("@")[0]
      });


      
      _.remove(this.results, r => r.subject.split("/").pop()[0] == "Q" && r.subject.split("/").pop()[5] == "-").forEach(node => {
        this.intermNodes.push(node);
      }); */

    this.label = this.labelMap[this.id];
    if (!this.label || this.label == undefined || this.label == "undefined")
      this.label = "" + this.getDisplayText(this.getNode(this.longId));

    var tps = this.results.filter(r => r.predicate.split("/").pop() == "22-rdf-syntax-ns#type" && r.subject.split("/").pop() == this.id);
    var tpsmap = tps.map(t => { return { type: t, depth: this.structMapClasses[t.object]?.depth } });
    tpsmap = _.sortBy(tpsmap, t => -t.depth);
    this.types = tpsmap.map(t => t.type);

    this.depictedInUrl = this.propertyList.find(
      l => l.type.typeUri == "http://onama.sbg.ac.at/ontology#depictedIn"
    )?.uri;
    this.reoImageUrl = this.depictedInUrl ? await this.repository.getReoImageUrl(this.depictedInUrl.split("/").pop()) : null;
    this.loading = false;
  }

  parseQuery(query: string) {
    if (query != undefined) {
      try {
        const queryData = JSON.parse(query);
        if (queryData.length == 2) {
          this.queryOut = queryData[0];
          this.queryIn = queryData[1];
        }
      }
      catch {
        console.error("invalid JSON in QueryData");
      }
    }
  }

  getLabelOrDefault(uri: string) {
    return this.labelMap[uri] || this.structMapProperties[uri]?.label || this.structMapClasses[uri]?.label;
  }

  isLink(predicate: string) {
    var id = predicate.split("/").pop();
    if (_.find(environment.linkUrls, l => l == id)) return true;
    return false;
  }

  findLabel(uri: string) {
    var id = uri.split("/").pop();
    var label = this.labelMap[id];
    if (label) return label;
    return null;
  }


  async onLC(link: string) {
    event.stopPropagation();
    event.preventDefault();
    await this.openDetail(link);
  }

  async openDetail(linkUrl) {
    if (this.longId == linkUrl) return;
    if (!linkUrl) return;
    var newid = linkUrl.split("/").pop();
    if (newid == this.id) return;
    this.id = newid;
    this.longId = linkUrl;
    await this.prepareDataNew();
    if (this.id && this.id != "undefined") {
      this.history.splice(++this.currentHistoryPos);
      this.history.push({ id: this.id, longId: this.longId, label: this.label });
    }
  }

  async goBack() {
    var h = this.history[--this.currentHistoryPos];
    this.id = h.id;
    this.longId = h.longId;
    if (this.id) {
      await this.prepareDataNew();
    }
    else {
      await this.close();
    }
  }

  async goForward() {
    var h = this.history[++this.currentHistoryPos];
    this.id = h.id;
    this.longId = h.longId;
    if (this.id) {
      await this.prepareDataNew();
    }
    else {
      await this.close();
    }
  }

  async breadcrumb(index: number) {
    var h = this.history[index];
    if (!h.id) {
      await this.close();
    }
    this.id = h.id;
    this.longId = h.longId;
    this.currentHistoryPos = index;
    await this.prepareDataNew();
  }


  async close() {
    await this.onClose.emit(true);
    await this.repository.showSidebar.emit(true);
  }

  async openDebug() {
    var wnd = window.open("about:blank", "_blank");
    wnd.document.write("<pre>" + JSON.stringify(await this.repository.getDescription(this.id), null, 2) + "</pre>");
    wnd.document.close();
  }


}
