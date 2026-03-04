export interface PathMap {
  docsRoot: string;
  changelog: string;
  rules: string;
  businessRules: string;
  testPlans: string;
  devPlans: string;
  templates: string;
}

export function getPathMap(language: string): PathMap {
  if (language === "pt-BR") {
    return {
      docsRoot: "documentos",
      changelog: "change-log",
      rules: "regras",
      businessRules: "regras-negocio",
      testPlans: "plano-testes",
      devPlans: "plano-desenvolvimento",
      templates: "templates",
    };
  }
  return {
    docsRoot: "docs",
    changelog: "changelog",
    rules: "rules",
    businessRules: "business-rules",
    testPlans: "test-plans",
    devPlans: "dev-plans",
    templates: "templates",
  };
}
