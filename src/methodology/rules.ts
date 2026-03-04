export interface Rule {
  id: string;
  number: number;
  name: string;
  description: string;
  alwaysActive: boolean;
  requires: string[];
  category: "core" | "documentation" | "testing" | "quality";
}

export const RULES: Rule[] = [
  {
    id: "absolute-delegation",
    number: 0,
    name: "Delegacao Absoluta",
    description:
      "O orquestrador NUNCA edita arquivos dentro de modulos. Toda implementacao e delegada a sub-agentes especializados via Task tool.",
    alwaysActive: true,
    requires: [],
    category: "core",
  },
  {
    id: "changelog-by-date",
    number: 1,
    name: "Changelog por Data",
    description:
      "Toda delegacao concluida gera uma entrada em documentos/change-log/{modulo}/{YYYY-MM-DD}.md com titulo, agente, status, decisao, alteracoes e diagrama Mermaid (se aplicavel).",
    alwaysActive: false,
    requires: [],
    category: "documentation",
  },
  {
    id: "conditional-mermaid",
    number: 2,
    name: "Diagramas Mermaid Condicionais",
    description:
      "Diagramas Mermaid sao obrigatorios APENAS para: novo endpoint (sequenceDiagram), mudanca de schema (erDiagram), nova integracao (flowchart). NAO para: bug fixes, config, refactoring, CRUD basico.",
    alwaysActive: false,
    requires: ["changelog-by-date"],
    category: "documentation",
  },
  {
    id: "feature-planning-gate",
    number: 3,
    name: "Feature Planning Gate",
    description:
      "Auto-detecta features novas (implementar, criar, adicionar, novo modulo). Classifica como SIMPLES ou COMPLEXA. Features complexas exigem documentos (regras-negocio, plano-testes, plano-desenvolvimento) por modulo ANTES da implementacao.",
    alwaysActive: false,
    requires: [],
    category: "quality",
  },
  {
    id: "api-response-contract",
    number: 4,
    name: "Contrato de Resposta API",
    description:
      'Todas as APIs seguem envelope padrao: sucesso {"data": {...}}, erro {"error": {"message": "...", "code": "..."}}. Sem JSON solto na raiz.',
    alwaysActive: false,
    requires: [],
    category: "quality",
  },
  {
    id: "scope-of-responsibility",
    number: 5,
    name: "Escopo de Responsabilidade",
    description:
      "Cada modulo tem responsabilidade bem definida. Frontends sao camada visual pura (zero logica de negocio). Backends contem toda logica de negocio. Cada role tem mapa de PODE/NAO PODE.",
    alwaysActive: true,
    requires: [],
    category: "core",
  },
  {
    id: "e2e-test-protection",
    number: 6,
    name: "Protecao E2E",
    description:
      "Testes E2E sao protegidos por chmod 555 (dirs) / 444 (files). So desbloqueados na fase Red (make e2e-unlock). Auto-bloqueados apos dev/test. Features/step definitions NUNCA modificados na fase Green.",
    alwaysActive: false,
    requires: ["tdd-enforcement"],
    category: "testing",
  },
  {
    id: "post-dev-e2e-validation",
    number: 7,
    name: "Validacao E2E Pos-Implementacao",
    description:
      "Apos QUALQUER mudanca em frontend ou backend: rodar testes E2E. Loop de diagnostico max 3 iteracoes sem sucesso → reportar ao usuario. NUNCA modificar testes para passar — corrigir codigo da aplicacao.",
    alwaysActive: false,
    requires: ["e2e-test-protection"],
    category: "testing",
  },
  {
    id: "tdd-enforcement",
    number: 8,
    name: "TDD Enforcement",
    description:
      "4 hooks automaticos protegem o workflow TDD: PreToolUse (bloqueia edicao de src/ sem teste), PostToolUse (roda testes apos edicao), UserPromptSubmit (injeta avaliacao TDD), Stop (verifica testes antes de encerrar).",
    alwaysActive: false,
    requires: [],
    category: "testing",
  },
];

export function getRuleById(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id);
}

export function getActiveRules(
  config: Record<string, boolean>
): Rule[] {
  return RULES.filter((r) => r.alwaysActive || config[r.id]);
}
