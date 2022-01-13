import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, Inject, EventEmitter } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as lodash from "lodash";
import deepdash from "deepdash";
const _ = deepdash(lodash);
import { send } from 'process';


/**
 * Das Daten-Repository für die Bill-Daten
 */

@Injectable({
  providedIn: "root"
})
export class Repository {

  private API_BASE_URL: string;

  private REO_BASE_URL: string;

  private REO_API_KEY: string;

  public loadingChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  public showSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();

  public exclUri: string[];

  private language: Language = Language["de"];

  public showDebug: boolean = false;

  public imageIdCache: { [workid: string]: string } = {};

  private labelMap: { [uri: string]: {label: string, depth: number} };
  private labelMapFull: { [uri: string]: {label: string, depth: number} };

  constructor(private httpClient: HttpClient) {
    this.API_BASE_URL = environment.baseUrl;
    this.REO_BASE_URL = environment.reoBaseUrl;
    this.REO_API_KEY = environment.reoApiKey || "";
    this.exclUri = ["http://onama.sbg.ac.at/ontology#TimeSpan", "http://onama.sbg.ac.at/ontology#State"];
    this.showDebug = environment.showDebug;

  }

  // QueryBar

  public eventContentUpdated: EventEmitter<QueryResponse> = new EventEmitter<QueryResponse>();
  public loadingEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  public async getQuerybarStructure(): Promise<QuerybarStructure> {
    var struct = await this.get<QuerybarStructure>("/structure/full", null);
    struct.classes = _.filter(struct.classes, n => !_.includes(this.exclUri, n.uri));
    return struct;
  }

  public async getLabelMapProperties(): Promise<{ [uri: string]: {label: string, depth: number} }> {
    if (this.labelMap) {
      return this.labelMap;
    }
    else {
      var struct = await this.get<QuerybarStructure>("/structure/properties", null);
      struct = _.filter(struct.properties, n => !_.includes(this.exclUri, n.uri));

      var lm = {};
      _.eachDeep(struct, (child, i, parent, ctx) => {
        lm[child.uri] = {label: child.label, depth: ctx?.depth};
      }, { childrenPath: 'Hierarchy' })
      this.labelMap = lm;
      return lm;
    }
  }

  public async getLabelMapClasses(): Promise<{ [uri: string]: {label: string, depth: number} }> {
    if (this.labelMapFull) {
      return this.labelMapFull;
    }
    else {
      var struct = await this.get<QuerybarStructure>("/structure/full", null);
      struct = _.filter(struct.classes, n => !_.includes(this.exclUri, n.uri));

      var lm = {};
      _.eachDeep(struct, (child, i, parent, ctx) => {
        lm[child.uri] = {label: child.label, depth: ctx?.depth};
      }, { childrenPath: 'owlHierarchy' })
      this.labelMapFull = lm;
      return lm;
    }
  }

  public async getQuerybarSearch(searchString: string = ''): Promise<QueryResponseContainer> {
    var params = {};
    if (searchString) {
      params["searchstring"] = searchString;
    }
    var response = await this.post<QueryResponseContainer>('/search', params);
    console.debug("Response", response);
    return response;
  }

  public async getQuerybarQuery(searchTerm: string = "", query: Query[] = null, tree = null): Promise<QueryResponseContainer> {
    var params = {};
    if (searchTerm) params["searchTerm"] = searchTerm;
    if (query !== null && query.length > 0) {
      params["jsonquery"] = query;
    }
    if (tree !== null && tree.length > 0) {
      params["tree"] = tree;
    }
    var response = await this.post<QueryResponseContainer>("/query", params);
    console.debug("Response", response);
    return response;
  }

  public async getReoImageUrl(workId: string): Promise<string> {
    return this.imageIdCache[workId] || await this.getDiaUrlFromWorkId(workId);
  }

  private getReoImageUrlFromDiaNr(dianr: string): string {
    return this.REO_BASE_URL + "/imageservice/onama/" + dianr;
  }

  private async getDiaUrlFromWorkId(workId: string): Promise<string> {
    var work = await this.getReoWork(workId);
    var dianr = work?.dianr?.find(d => d.flags.primary)?.value
      || work?.dianr?.find(d => !d.flags.outdated)?.value
      || work?.dianr[0]?.value
      || null;
    var url = dianr ? this.getReoImageUrlFromDiaNr(dianr) : null;
    this.imageIdCache[workId] = url;
    return url;
  }

  public async getNarrativSearch(query: {} = null) {
    var response = await this.post<QueryResponseContainer>("/register/narrative", query);
    console.debug("Response", response);
    return response;
  }

  public async getQuerybarEntries<T>(className: string): Promise<[T]> {
    var params = new HttpParams().set("classname", className);
    return await this.get("/structure/classentries", params);
  }

  public async getQueryBarClassItems(className: string): Promise<[LabelUriPair]> {
    return await this.getQuerybarEntries(className);
  }

  public async getQueryBarSubclasses(className: string): Promise<OwlHierarchy[]> {
    var params = new HttpParams().set("classname", className);
    var subclasses = await this.get<QuerybarStructure>("/structure/subclasses", params);
    return subclasses.classes;
  }

  public async getDescription(id: string): Promise<[ResultSOP]> {
    var params = new HttpParams().set("id", id);
    return (await this.get<any>("/describe", params)).response.results;
  }
  public async getDescriptionFull(id: string): Promise<QueryResponse> {
    var params = new HttpParams().set("id", id);
    return (await this.get<any>("/describe", params)).response;
  }

  public async get<T>(url, params?: HttpParams): Promise<T> {
    this.loadingChange.emit(true);
    if (params) {
      params = params.append("language", this.language)
    }
    else {
      params = new HttpParams().set("language", this.language);
    }
    var response = await this.httpClient.get<T>(this.API_BASE_URL + url, { params: params }).toPromise();
    this.loadingChange.emit(false);
    return response;
  }

  public async post<T>(url, args: {}): Promise<T> {
    this.loadingChange.emit(true);
    args["language"] = this.language;
    var response;
    try {
      response = await this.httpClient.post<T>(this.API_BASE_URL + url, args).toPromise();
    }
    catch (e) {
      this.loadingChange.emit(false);
      throw e;
    }
    this.loadingChange.emit(false);
    return response;
  }

  public async getReoWork(archivnr, params?: HttpParams): Promise<ReoWork> {
    return await this.httpClient.get<ReoWork>(this.REO_BASE_URL + "/api/data/work?apiKey=" + this.REO_API_KEY + "&detail=true&archivnr=" + archivnr, { params: params }).toPromise();
  }

  public setLanguage(language: Language | string) {
    // this may actually be "en-US" or something and thus remain undefined
    var lang = Language[language];
    if (lang === undefined) {
      for (var l of [language.substr(0, 2), "en"]) {
        console.debug('l: ' + l);
        lang = Language[l];
        if (lang !== undefined) {
          console.debug('found lang: ' + lang);
          break;
        }
      }
    }
    this.language = lang;
  }

  public getLanguage() {
    return this.language;
  }

  public getBaseUrl() {
    return this.API_BASE_URL;
  }

}

export enum Language {
  en = "en",
  de = "de"
}

export interface QueryResponseContainer {
  response: QueryResponse;
}

export interface QueryResponse {
  message: string;
  query: string;
  isRandom: boolean;
  nodes: Node[];
  results: ResultSOP[] | ResultQuery[];
  columns: string[];
}

export interface QueryResult {
  dataType: string;
  graph: string;
  graphUri: string;
  language: string;
  nodeType: number;
  value: string;
}

export interface Query {
  uri: string;
  searchTerm: string;
}

export interface QuerybarStructure {
  classes?: OwlHierarchy[];
  properties?: OwlHierarchy[];
  message: string;
}
/* This is the base of OwlHierarchy and OwlProperty*/
export interface IOwlResource {
  label: string;
  uri: string;
  description: string;
}

export interface IOwlProperty extends IOwlResource {
  // we might be interested in the range as well, or the domain, if we decide to support range properties

}

export interface IOwlHierarchy extends IOwlResource {
  owlHierarchy: IOwlHierarchy[];
  owlProperties: IOwlProperty[];
}

export class OwlProperty implements IOwlProperty {
  label: string;
  uri: string;
  description: string;
  // we might be interested in the range as well, or the domain, if we decide to support range properties

  // these are for the GUI
  propertySearchTermVisible: boolean;
  propertySearchTerm: string;

}

export class OwlHierarchy implements IOwlHierarchy {
  owlHierarchy: IOwlHierarchy[];
  owlProperties: OwlProperty[];
  label: string;
  uri: string;
  description: string;

}

export class LabelUriPair {
  label: string;
  uri: string;
}

export class ResultSOP {
  subject: string;
  predicate: string;
  object: string;
  reversed?: boolean;
}

export interface ResultQuery {
  classUri: data;
  label: data;
  node: data;
  property: data;
  propertyLabel: data;
  reo_uri?: data;
  depictedin_uri?: data;
  mergedClassUris?: string[];
}

export interface data {
  dataType: any;
  graph: any;
  graphUri: string;
  language: Language;
  nodeType: number;
  value: string;
}

export class Node {
  uri: string;
  isOutgoing: boolean;
  predicateObjects: PredicateObject[];
}

export class PredicateObject {
  object: string;
  predicate: string;
}


export interface ReoWork {
  dianr: [{
    value: string;
    flags: {
      primary?: boolean;
      outdated?: boolean;
    }
  }]
}