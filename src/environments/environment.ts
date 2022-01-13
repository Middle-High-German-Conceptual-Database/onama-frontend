// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: "http://onama.sbg.ac.at/api/v1",
  reoBaseUrl: "https://realonline.imareal.sbg.ac.at",
  reoApiKey: "",
  showDebug: false,
  linkUrls:[
    "hasUrl",
    "hasRoWorkURL",
    "depictedIn",
    "hasWikiDataEquivalent",
    "hasRelatedWikiDataEntry",
    "hasGNDEquivalent",
    "XMLSchema#string",
    "hasMhdbdbSigilURL",
    "fromToken",
    "toToken",
    "hasCidocEquivalent",
    "hasCidocSuperclass",
    "hasRelatedIconClassEntry",
    "hasIconClassEquivalent",
    "core#closeMatch"
  ],
  objectPropertyPredicates: [
    "hasUrl",
    "hasRoWorkURL",
    "hasMhdbdbSigilURL",
    "depictedIn",
    "hasWikiDataEquivalent",
    "hasRelatedWikiDataEntry",
    "hasGNDEquivalent",
    "fromToken",
    "toToken",
    "hasRelatedIconClassEntry",
    "hasIconClassEquivalent"
  ]

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
