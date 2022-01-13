import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCheck, faExclamationTriangle, faClock, faInfoCircle, faExclamation, faCaretDown, faChevronLeft, faEye, faArrowDown, faTimes, faPlus, faSync, faSearch, faRunning, faFolder, faChess, faProjectDiagram, faBrain, faShapes, faBookOpen, faImage, faCube, faUser as fasUser, faUsers, faDragon, faCrow, faGem, faMapMarkerAlt, faSquare, faPlayCircle, faBookmark, faHourglass, faThList, faHourglassHalf, faPlusCircle, faChevronRight, faExternalLinkAlt, faMinus, faCaretLeft, faCaretRight, faUndo, faDownload, faDice, faQuestion } from '@fortawesome/free-solid-svg-icons'
import { faCalendarAlt, faUser as farUser } from "@fortawesome/free-regular-svg-icons"
import * as _ from "lodash";

const onamaIcons = {
    "http://onama.sbg.ac.at/ontology#Action": faRunning,
    "http://onama.sbg.ac.at/ontology#Collection": faFolder,
    "http://onama.sbg.ac.at/ontology#EntityFunction": faChess,
    "http://onama.sbg.ac.at/ontology#Narrative": faProjectDiagram,
    "http://onama.sbg.ac.at/ontology#Concept": faBrain,
    "http://onama.sbg.ac.at/ontology#Realisation": faShapes,
    "http://onama.sbg.ac.at/ontology#TextualRealisation": faBookOpen,
    "http://onama.sbg.ac.at/ontology#VisualRealisation": faImage,
    "http://onama.sbg.ac.at/ontology#PersistentItem": faCube,
    "http://onama.sbg.ac.at/ontology#Actor": farUser,
    "http://onama.sbg.ac.at/ontology#Person": fasUser,
    "http://onama.sbg.ac.at/ontology#Group": faUsers,
    "http://onama.sbg.ac.at/ontology#MythicalBeing": faDragon,
    "http://onama.sbg.ac.at/ontology#Animal": faCrow,
    "http://onama.sbg.ac.at/ontology#Thing": faGem,
    "http://onama.sbg.ac.at/ontology#Place": faMapMarkerAlt,
    "http://onama.sbg.ac.at/ontology#SemanticRole": faSquare,
    "http://onama.sbg.ac.at/ontology#TemporalEntity": faPlayCircle,
    "http://onama.sbg.ac.at/ontology#TextPassage": faBookmark,
    "http://onama.sbg.ac.at/ontology#TimeSpan": faHourglassHalf,
    "http://onama.sbg.ac.at/ontology#Verb": faThList,
    "Link": faExternalLinkAlt
};

export const getOnamaIcon = (uri) => onamaIcons[uri] || faMinus;

export function setupFontAwesomeLibrary(library: FaIconLibrary) {

    var onama = _.values(onamaIcons);

    library.addIcons(
        faCheck,
        faExclamationTriangle,
        faClock,
        faCalendarAlt,
        faInfoCircle,
        faExclamation,
        faCaretDown,
        faCaretLeft,
        faCaretRight,
        faChevronLeft,
        faChevronRight,
        faEye,
        faArrowDown,
        faTimes,
        faPlus,
        faMinus,
        faSync,
        faSearch,
        faExternalLinkAlt,
        faMinus,
        faUndo,
        faDownload,
        faDice,
        faInfoCircle
    );
    library.addIcons(...onama);
}
