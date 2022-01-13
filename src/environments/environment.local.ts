export const environment = {
  production: true,
  baseUrl: "http://localhost:5000/api/v1",
  reoBaseUrl: "https://realonline.imareal.sbg.ac.at",
  reoApiKey: "",
  showDebug: true,
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
