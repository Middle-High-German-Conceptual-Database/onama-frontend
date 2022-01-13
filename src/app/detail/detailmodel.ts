/**
 * detailmodel.ts
 *
 * Implements the DetailModel class
 */

import { Language, Node, ResultSOP } from '../repository/repository.service';
import * as lodash from "lodash";
import deepdash from "deepdash";
const _ = deepdash(lodash);
import { environment } from 'src/environments/environment';

const LABEL_PREDICATE = 'http://www.w3.org/2000/01/rdf-schema#label';
const TYPE_PREDICATE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const ONAMA_PREFIX = 'http://onama.sbg.ac.at/';
const ONAMA_ONTOLOGY = "ontology#";
const ONAMA_ONTOLOGY_PREFIX = ONAMA_PREFIX + ONAMA_ONTOLOGY;
const ONAMA_OBJECT_PREFIX = ONAMA_PREFIX + 'object/';
const REALISED_PREDICATE = ONAMA_ONTOLOGY_PREFIX + 'isRealisedBy';
const SEMANTIC_PREDICATE = ONAMA_ONTOLOGY_PREFIX + 'hasSemanticRole';
const SCENE_PREDICATE = ONAMA_ONTOLOGY_PREFIX + 'hasSceneNode';
const REALONLINE_PREFIX = "http://realonline.imareal.sbg.ac.at/"; // TODO -> Correct prefix

/**
 * Transforms the
 */
export class DetailModel {

  public detailLines: DetailLine[];

  public propertyList: DetailNode[];

  public labelDict: { [id: string]: string };

  private nodeDict: { [uri: string]: Node };

  private structMapProperties: { [uri: string]: { label: string, depth: number } };
  private structMapClasses: { [uri: string]: { label: string, depth: number } };

  public typeDict: { [uri: string]: { typeUri: string, name: string } };

  private objectDict: { [uri: string]: ResultSOP[] };

  private anonymousDict: { [uri: string]: string } = {};

  private anonymousCount = 0;

  /**
   *
   * @param nodes The list of nodes as returned from the API
   * @param currentNodeId The Id of the current node to be displayed  (e.g. "Q914")
   */
  constructor(private nodes: Node[], private triples: ResultSOP[], private currentNodeId: string, private currentLanguage: string, private structureMapProperties: { [uri: string]: { label: string, depth: number } }, private structureMapClasses: { [uri: string]: { label: string, depth: number } }) {
    this.structMapProperties = this.structureMapProperties;
    this.structMapClasses = this.structureMapClasses;
    this.transformNodes();
  }

  private transformNodes() {
    this.detailLines = [];

    this.buildLabelDict();
    this.buildTypeDict();
    this.buildNodeDict();
    this.buildObjectDict();

    let currentNode = this.findCurrentNode();
    this.detailLines.push(...this.buildDirectDetailLines(currentNode));
    this.detailLines.push(...this.buildIndirectDetailLines(currentNode));
    this.cleanIntermediateNodes(currentNode); // TODO: We need to remove anonymous nodes, that are part of inermediate nodes

    this.buildPropertyList(currentNode);

  }

  /**
   * Builds the dictionary with the labels for all node uris
   */
  private buildLabelDict() {
    this.labelDict = {};
    for (var node of this.nodes) {
      let label = _.find(node.predicateObjects, po => po.predicate == LABEL_PREDICATE && po.object.endsWith('@' + this.currentLanguage));
      if (label == null)
        label = _.find(node.predicateObjects, po => po.predicate == LABEL_PREDICATE);

      if (label)
        this.labelDict[node.uri] = label.object.substr(0, label.object.lastIndexOf('@'));
    }
  }

  private buildTypeDict() {
    this.typeDict = {};
    for (var node of this.nodes) {
      let types = _.filter(node.predicateObjects, po => po.predicate == TYPE_PREDICATE);

      var strClass = _.maxBy(types.map(t => {
        var c = this.structMapClasses[t.object];
        if (c)
          return {
            object: t.object,
            label: c.label,
            depth: c.depth
          };
        return null
      }), "depth");

      var strProp = _.maxBy(types.map(t => {
        var p = this.structMapProperties[t.object];
        if (p)
          return {
            object: t.object,
            label: p.label,
            depth: p.depth
          };
        return null;
      }), "depth");

      if (strClass) {
        this.typeDict[node.uri] = {
          name: strClass.label,
          typeUri: strClass.object
        };
      }
      else if (strProp) {
        this.typeDict[node.uri] = {
          name: strProp.label,
          typeUri: strProp.object
        };
      }
      else {
        var type = types[0];
        if (type != null) {
          this.typeDict[node.uri] = {
            name: this.labelDict[type.object] || type.object.replace(ONAMA_ONTOLOGY_PREFIX, ''),
            typeUri: type.object
          };
        }
      }
    }
  }

  /**
   * Builds the node dictionary from the node list (there's probably a lodash function for doing this...)
   */
  private buildNodeDict() {
    this.nodeDict = {};
    for (let node of this.nodes)
      this.nodeDict[node.uri] = node;
  }

  /**
   * Builds the object dictionary from the results (only for URIs)
   */
  private buildObjectDict() {
    this.objectDict = {};
    for (let triple of _.filter(this.triples, t => t.object.startsWith(ONAMA_PREFIX))) {
      if (this.objectDict[triple.object] == null) {
        this.objectDict[triple.object] = [triple];
      } else {
        this.objectDict[triple.object].push(triple);
      }
    }
  }

  private findCurrentNode(): Node {
    return this.nodeDict[ONAMA_OBJECT_PREFIX + this.currentNodeId];
  }

  private buildDirectDetailLines(currentNode: Node): DetailLine[] {
    var result: DetailLine[] = [];
    // Find lines, where currentNode is subject
    for (let predicate of _.filter(currentNode.predicateObjects, p => p.predicate.startsWith(ONAMA_PREFIX) && (this.labelDict[p.object] != null || p.object.startsWith(REALONLINE_PREFIX)))) {
      result.push({
        subject: this.mkDetailNode(currentNode.uri),
        object: this.mkDetailNode(predicate.object),
        predicateLabel: this.mkPredicateLabel(predicate.predicate), // TODO -> get predicate label
        intermediateNode: null
      })
    }

    // Construct lines, where current node is object
    for (let node of this.nodes) {
      for (let predicate of _.filter(node.predicateObjects, p => p.object == currentNode.uri)) {
        result.push({
          object: this.mkDetailNode(currentNode.uri),
          subject: this.mkDetailNode(node.uri),
          predicateLabel: this.mkPredicateLabel(predicate.predicate), // TODO -> get predicate label
          intermediateNode: null
        })
      }
    }
    return result;
  }

  private buildIndirectDetailLines(currentNode: Node): DetailLine[] {
    var result: DetailLine[] = [];

    result.push(...this.buildIndirectSubjectLines(currentNode));
    result.push(...this.buildIndirectObjectLines(currentNode));

    return result;
  }

  private buildIndirectSubjectLines(currentNode: Node): DetailLine[] {
    var result: DetailLine[] = [];

    for (var predicate of _.filter(currentNode.predicateObjects, p => this.labelDict[p.object] == null && this.nodeDict[p.object] != null)) { // All intermediateNodes
      let intermediateNode = this.nodeDict[predicate.object];

      for (var secondPredicate of _.filter(intermediateNode.predicateObjects, p => p.predicate.startsWith(ONAMA_PREFIX) && (this.labelDict[p.object] != null || p.object.startsWith(REALONLINE_PREFIX)))) {
        result.push({
          subject: this.mkDetailNode(currentNode.uri),
          object: this.mkDetailNode(secondPredicate.object),
          predicateLabel: this.mkPredicateLabel(predicate.predicate),
          intermediatePredicate: this.mkPredicateLabel(secondPredicate.predicate),
          intermediateNode: this.mkDetailNode(intermediateNode.uri)
        })
      }
    }
    return result;
  }

  private buildIndirectObjectLines(currentNode: Node): DetailLine[] {
    var result: DetailLine[] = [];

    for (let node of _.filter(this.nodes, n => this.labelDict[n.uri] == null || this.anonymousDict[n.uri] != null)) {
      // this will *not* find lines where the currentNode is an intermediate node :/
      // for the moment, we will keep anonymous node names
      for (let predicate of _.filter(node.predicateObjects, p => p.object == currentNode.uri)) {
        for (let triple of this.objectDict[node.uri]) {
          result.push({
            subject: this.mkDetailNode(triple.subject),
            object: this.mkDetailNode(currentNode.uri),
            predicateLabel: this.mkPredicateLabel(triple.predicate),
            intermediatePredicate: this.mkPredicateLabel(predicate.predicate),
            intermediateNode: this.mkDetailNode(node.uri)
          });
        }
      }
    }

    return result;
  }

  private cleanIntermediateNodes(currentNode: Node) {
    let subjects = [];
    subjects = _.filter(this.detailLines, d => d.intermediateNode != null).map(e => e.intermediateNode?.uri);

    _.remove(this.detailLines, d =>
      d.subject.uri != currentNode.uri &&
      d.intermediateNode === null &&
      this.anonymousDict[d.subject.uri] != null &&
      subjects.indexOf(d.subject.uri) !== -1);
  }

  private buildPropertyList(currentNode: Node) {
    this.propertyList = [];
    // Find lines, where currentNode is subject
    for (let predicate of _.filter(currentNode.predicateObjects, p => environment.objectPropertyPredicates.some(o => ONAMA_ONTOLOGY_PREFIX + o == p.predicate))) {
      this.propertyList.push({
        label: this.mkPredicateLabel(predicate.predicate),
        uri: predicate.object,
        type: { typeUri: predicate.predicate, name: predicate.predicate },
        isCurrent: false,
        tooltip: null
      });
    }
  }

  private mkDetailNode(nodeUri: string): DetailNode {
    return {
      isCurrent: nodeUri == ONAMA_OBJECT_PREFIX + this.currentNodeId,
      label: this.labelForNode(nodeUri),
      uri: nodeUri,
      type: (nodeUri.startsWith(REALONLINE_PREFIX) ? { typeUri: 'Link', name: 'RO-Entity' } : this.typeDict[nodeUri] || { typeUri: '', name: '' }),
      tooltip: this.tooltipForNode(nodeUri)
    };
  }

  private mkPredicateLabel(predicateUri: string) {
    if(predicateUri in this.structMapProperties) {
      return this.structMapProperties[predicateUri].label;
    } else {
      return predicateUri.replace(ONAMA_ONTOLOGY_PREFIX, '');
    }
  }

  private mkAnonymousLabel(uri: string) {
    let label = this.anonymousDict[uri];
    if (label == null) {
      label = this.typeDict[uri]?.name;
      if (label == null) {
        label = "A" + (++this.anonymousCount);
      }
      this.anonymousDict[uri] = label;
    }
    return label;
  }


  private labelForNode(nodeUri: string): string {
    var ld = this.labelDict[nodeUri];
    if (ld) {
      return ld;
    }
    else {
      if (nodeUri.startsWith(REALONLINE_PREFIX)) {
        if (nodeUri.includes("work")) {
          return "RO " + nodeUri.split("/").pop();
        }
        else if (nodeUri.includes("entity")) {
          return "RO " + nodeUri.split("/").pop().split("_").join("/");
        }
      }
      else
        return this.mkAnonymousLabel(nodeUri);
    }
  }

  private tooltipForNode(nodeUri: string): string {
    if (nodeUri.startsWith(REALONLINE_PREFIX)) {
      if (nodeUri.includes("work")) {
        if (this.currentLanguage == Language.de) {
          return "REALOnline Werk " + nodeUri.split("/").pop();
        }
        else if (this.currentLanguage == Language.en) {
          return "REALOnline Work " + nodeUri.split("/").pop();
        }
        else
          return null;
      }
      else if (nodeUri.includes("entity")) {
        if (this.currentLanguage == Language.de) {
          return "REALOnline Entität " + nodeUri.split("/").pop().split("_").join("/");
        }
        else if (this.currentLanguage == Language.en) {
          return "REALOnline Entity " + nodeUri.split("/").pop().split("_").join("/");
        }
        else
          return null;
      }
      else
        return "RO-Entity " + nodeUri;
    }
    else {
      var td = this.typeDict[nodeUri];
      if (td) {
        return td.name;
      }
      else {
        return null;
      }
    }
  }

}


/**
 * The data structure to be displayed in each row of the detail view
 */
export interface DetailNode {
  label: string;
  uri: string;
  type: { typeUri: string, name: string };
  isCurrent: boolean;
  tooltip: string;
}

/**
 * Defines the data for a single line in the detail view
 */
export interface DetailLine {
  /** The subject of the sentence (left side) */
  subject: DetailNode;

  /** The object of the sentence (right side) */
  object: DetailNode;

  // Information about the edge/arrow
  predicateLabel: string;

  intermediateNode?: DetailNode;

  intermediatePredicate?: string;
}
