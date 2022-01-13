import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { Repository, OwlHierarchy, LabelUriPair, IOwlHierarchy, QuerybarStructure } from '../repository/repository.service';
import * as lodash from "lodash";
import deepdash from "deepdash";
const _ = deepdash(lodash);
import { KeyValuePair } from '../components/autocomplete/autocomplete.component';


@Component({
  selector: 'query-bar',
  templateUrl: './querybar.component.html',
  styleUrls: ['./querybar.component.scss']
})
export class QuerybarComponent implements OnInit {

  public searchTerm: string;

  @Input()
  public searchView: "structured" | "simple" | "narrativ";

  @ViewChild("searchString")
  public inputSearchString: ElementRef;

  structure: OwlHierarchy[];

  semanticRole: IOwlHierarchy[];
  originalSemanticRole: IOwlHierarchy[];

  public collections: LabelUriPair[];

  public selectedCollectionUri: string = null;

  public listSelectedCollections: LabelUriPair[] = [];

  public actions: LabelUriPair[];

  public selectedActionUri: string = null;

  public listSelectedActions: LabelUriPair[] = [];

  public label: string;

  public konzeption = true;

  public realisierung = true;

  public text = true;

  public bild = true;

  public entitySearch: string;

  public narrativeSelect: string = null;

  public classSelect: string = null;

  public addEntity: boolean = false;

  data: QuerybarStructure;
  temppi: LabelUriPair[];
  tempplace: LabelUriPair[];
  temptent: LabelUriPair[];

  public entities: entity[] = [];
  public entityfunctions: LabelUriPair[];
  public persistentItemClasses: LabelUriPair[];
  public autocompleteItems: KeyValuePair[];

  constructor(private repository: Repository) {
  }

  async ngOnInit(): Promise<void> {
    this.data = await this.repository.getQuerybarStructure();
    this.collections = await this.repository.getQueryBarClassItems('Collection');
    this.actions = await this.repository.getQueryBarClassItems('Action');
    this.temppi = await this.repository.getQueryBarClassItems('PersistentItem');
    this.tempplace = await this.repository.getQueryBarClassItems('Place');
    this.temptent = await this.repository.getQueryBarClassItems('TemporalEntity');
    this.entityfunctions = await this.repository.getQueryBarClassItems('EntityFunction');

    this.prepareData();
  }

  prepareData() {
    this.listSelectedCollections = [];
    this.listSelectedActions = [];
    this.autocompleteItems = [];
    this.entities = [];
    this.temppi.forEach(t => this.autocompleteItems.push({ key: t.uri, value: t.label }));
    this.tempplace.forEach(t => this.autocompleteItems.push({ key: t.uri, value: t.label }));
    this.temptent.forEach(t => this.autocompleteItems.push({ key: t.uri, value: t.label }));
    this.autocompleteItems = _.orderBy(_.uniqBy(this.autocompleteItems, a => a.key), a => a.value);
    this.structure = _.cloneDeep(this.data.classes);

    this.label = null;
    this.konzeption = true
    this.realisierung = true;
    this.text = true;
    this.bild = true;

    this.selectedCollectionUri = null;
    this.selectedActionUri = null;

    var pi = this.structure.find(o => o.uri == "http://onama.sbg.ac.at/ontology#PersistentItem");
    var pis = this.flatten(pi["owlHierarchy"]);
    var mapped = [];
    _.map(pis, (n) => { mapped.push({ label: n.label, uri: n.uri }) });
    mapped.push({ label: pi.label, uri: pi.uri });
    this.persistentItemClasses = mapped.reverse();

    this.originalSemanticRole = this.structure.find(o => o.uri == "http://onama.sbg.ac.at/ontology#SemanticRole")["owlHierarchy"]
    this.semanticRole = _.cloneDeep(this.originalSemanticRole);

    if (this.inputSearchString) this.inputSearchString.nativeElement.value = "";
    this.addEntity = false;

    this.doEntityReset();
  }

  public appendCollection() {
    if (this.listSelectedCollections.findIndex(c => c.uri == this.selectedCollectionUri) == -1) {
      this.listSelectedCollections.push(this.collections.find(c => c.uri == this.selectedCollectionUri));
      this.selectedCollectionUri = null;
    }
  }

  public removeSelectedCol(col: LabelUriPair) {
    this.listSelectedCollections = this.listSelectedCollections.filter(c => c.uri != col.uri);
  }

  public appendAction() {
    if (this.listSelectedActions.findIndex(a => a.uri == this.selectedActionUri) == -1) {
      this.listSelectedActions.push(this.actions.find(a => a.uri == this.selectedActionUri));
      setTimeout(() => {
        this.selectedActionUri = null;
      }, 10);
    }
  }

  public removeSelectedAct(act: LabelUriPair) {
    this.listSelectedActions = this.listSelectedActions.filter(a => a.uri != act.uri);
  }

  public removeEntity(index: number) {
    _.remove(this.entities, (v, i, a) => i == index);
  }

  recurse(collection, domain = null) {

    var flatcollection = [];

    if (collection.owlHierarchy)
      collection.owlHierarchy.forEach(element => {
        var temp = this.recurse(element, collection.uri);
        temp.forEach(e => {
          flatcollection.push(e);
        });
      });

    if (collection.owlProperties)
      collection.owlProperties.forEach(element => {
        var temp = this.recurse(element, collection.uri);
        temp.forEach(e => {
          flatcollection.push(e);
        });
      });

    if (collection.propertySearchTermVisible)
      flatcollection.push({
        uri: collection.uri,
        label: collection.label,
        domain: domain,
        checked: collection.checked,
        search: collection.classSearchTermVisible || collection.propertySearchTermVisible,
        searchTerm: (collection.classSearchTermVisible ? collection.classSearchTerm : collection.propertySearchTermVisible ? collection.propertySearchTerm : null),
        type: (collection.classSearchTermVisible ? "class" : collection.propertySearchTermVisible ? "property" : null)
      });
    else
      flatcollection.push({
        uri: collection.uri,
        label: collection.label,
        checked: collection.checked,
        search: collection.classSearchTermVisible || collection.propertySearchTermVisible,
        searchTerm: (collection.classSearchTermVisible ? collection.classSearchTerm : collection.propertySearchTermVisible ? collection.propertySearchTerm : null),
        type: (collection.classSearchTermVisible ? "class" : collection.propertySearchTermVisible ? "property" : null)
      });

    return flatcollection;
  }

  flatten(collection) {
    var flatcollection = [];
    collection.forEach(element => {
      var temp = this.recurse(element);
      temp.forEach(e => {
        flatcollection.push(e);
      });
    });

    return flatcollection;
  }

  async doSearch(searchTerm: string = '') {
    this.repository.loadingEvent.emit(true);
    var response = await this.repository.getQuerybarSearch(searchTerm);
    this.repository.eventContentUpdated.emit(response.response);
  }


  async doQuery() {
    this.repository.loadingEvent.emit(true);
    var filterStruct = [];
    _.filter(this.flatten(this.structure), n => n.search).forEach(s => {
      filterStruct.push({
        uri: s.uri,
        domain: s.domain,
        searchTerm: s.searchTerm || "",
        type: s.type
      });
    });
    var response = await this.repository.getQuerybarQuery(this.searchTerm, filterStruct);
    this.repository.eventContentUpdated.emit(response.response);
  }

  doEntitySave() {
    var temphierarchy = this.semanticRole;
    var selected = this.flatten(_.cloneDeep(this.semanticRole));
    temphierarchy = _.filterDeep(temphierarchy, "checked", { childrenPath: "owlHierarchy" }); // keeps tree structure, but removes unchecked branches (except if children are checked)
    var searchattribs: string[] = [];
    if (this.entitySearch) searchattribs.push(this.entitySearch);
    if (this.narrativeSelect) searchattribs.push(this.entityfunctions.find(e => e.uri == this.narrativeSelect)?.label);
    if (this.classSelect) searchattribs.push(this.persistentItemClasses.find(p => p.uri == this.classSelect)?.label);
    selected = selected.filter(s => s.checked);
    if (selected.length > 0) searchattribs.push(...selected.map(s => s.label.replace("Rolle ", "")));
    this.entities.push({
      label: searchattribs.join(", "),
      searchstring: this.entitySearch,
      narrativerole: this.narrativeSelect,
      persistentitem: this.classSelect,
      owlHierarchy: temphierarchy
    });
    this.doEntityReset();
  }

  doEntityReset() {
    this.entitySearch = "";
    this.narrativeSelect = "";
    this.classSelect = "";
    this.semanticRole = (_.cloneDeep(this.originalSemanticRole));
  }

  async doNarrativSearch() {
    this.repository.loadingEvent.emit(true);

    if (this.selectedCollectionUri) {
      this.appendCollection();
    }

    if (this.selectedActionUri) {
      this.appendAction();
    }

    var subclasses = [];
    // TODO: This is clumsy
    if (this.konzeption) {
      subclasses.push("http://onama.sbg.ac.at/ontology#Concept");
    }
    if (this.realisierung) {
      subclasses.push("http://onama.sbg.ac.at/ontology#Realisation");
    }
    if (this.text) {
      subclasses.push("http://onama.sbg.ac.at/ontology#TextualRealisation");
    }
    if (this.bild) {
      subclasses.push("http://onama.sbg.ac.at/ontology#VisualRealisation");
    }
    var query = {
      "class": "http://onama.sbg.ac.at/ontology#Narrative",
      "searchstring": this.label,
      subclasses: subclasses,
      attributes: [
        {
          classUri: "http://onama.sbg.ac.at/ontology#Collection",
          terms: this.listSelectedCollections.map(c => c.uri)
        },
        {
          classUri: "http://onama.sbg.ac.at/ontology#Action",
          terms: this.listSelectedActions.map(a => a.uri)
        }
      ],
      entities: this.entities
    }
    var response = await this.repository.getNarrativSearch(query)
    this.repository.eventContentUpdated.emit(response.response);
  }

  async reset() {
    this.repository.loadingEvent.emit(true);
    var data = await this.repository.getQuerybarStructure();
    this.structure = data.classes;
  }
}

interface entity {
  searchstring: string;
  narrativerole: string;
  persistentitem: string;
  owlHierarchy: any[];
  label?: string;
}
