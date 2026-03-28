export interface Rule {
  id: string;
  number: number;
  name: string;
  namePtBr: string;
  description: string;
  descriptionPtBr: string;
  alwaysActive: boolean;
  requires: string[];
  category: "core" | "documentation" | "testing" | "quality";
}

export const RULES: Rule[] = [
  {
    id: "absolute-delegation",
    number: 0,
    name: "Absolute Delegation",
    namePtBr: "Delegacao Absoluta",
    description:
      "The orchestrator NEVER edits files inside modules. All implementation is delegated to specialized sub-agents via Task tool.",
    descriptionPtBr:
      "O orquestrador NUNCA edita arquivos dentro dos modulos. Toda implementacao e delegada a sub-agentes especializados via Task tool.",
    alwaysActive: true,
    requires: [],
    category: "core",
  },
  {
    id: "changelog-by-date",
    number: 1,
    name: "Changelog by Date",
    namePtBr: "Changelog por Data",
    description:
      "Every completed delegation generates a structured git commit per submodule with title, agent, status, decision, changes, and Mermaid diagram (if applicable). History lives in git log, not in files.",
    descriptionPtBr:
      "Toda delegacao concluida gera um commit git estruturado por submodulo com titulo, agente, status, decisao, alteracoes e diagrama Mermaid (se aplicavel). Historico vive no git log, nao em arquivos.",
    alwaysActive: false,
    requires: [],
    category: "documentation",
  },
  {
    id: "conditional-mermaid",
    number: 2,
    name: "Conditional Mermaid Diagrams",
    namePtBr: "Diagramas Mermaid Condicionais",
    description:
      "Mermaid diagrams are mandatory ONLY for: new endpoint (sequenceDiagram), schema change (erDiagram), new integration (flowchart). NOT for: bug fixes, config, refactoring, basic CRUD.",
    descriptionPtBr:
      "Diagramas Mermaid obrigatorios APENAS para: novo endpoint (sequenceDiagram), mudanca de schema (erDiagram), nova integracao (flowchart). NAO para: bug fixes, config, refactoring, CRUD basico.",
    alwaysActive: false,
    requires: ["changelog-by-date"],
    category: "documentation",
  },
  {
    id: "feature-planning-gate",
    number: 3,
    name: "Feature Planning Gate",
    namePtBr: "Gate de Planejamento de Feature",
    description:
      "Auto-detects new features (implement, create, add, new module). Classifies as SIMPLE or COMPLEX. Complex features require per-module documentation (business rules, test plans, dev plans) BEFORE implementation.",
    descriptionPtBr:
      "Auto-detecta features novas (implementar, criar, adicionar, novo modulo). Classifica como SIMPLES ou COMPLEXA. Features complexas requerem documentacao por modulo (regras de negocio, plano de testes, plano de desenvolvimento) ANTES da implementacao.",
    alwaysActive: false,
    requires: [],
    category: "quality",
  },
  {
    id: "api-response-contract",
    number: 4,
    name: "API Response Contract",
    namePtBr: "Contrato de Resposta API",
    description:
      'All APIs follow a standard envelope: success {"data": {...}}, error {"error": {"message": "...", "code": "..."}}. No loose JSON at root.',
    descriptionPtBr:
      'Todas as APIs seguem envelope padrao: sucesso {"data": {...}}, erro {"error": {"message": "...", "code": "..."}}. Sem JSON solto na raiz.',
    alwaysActive: false,
    requires: [],
    category: "quality",
  },
  {
    id: "scope-of-responsibility",
    number: 5,
    name: "Scope of Responsibility",
    namePtBr: "Escopo de Responsabilidade",
    description:
      "Each module has well-defined responsibility. Frontends are pure visual layer (zero business logic). Backends contain all business logic. Each role has a CAN/CANNOT map.",
    descriptionPtBr:
      "Cada modulo tem responsabilidade bem definida. Frontends sao camada visual pura (zero logica de negocio). Backends contem toda logica de negocio. Cada role tem mapa PODE/NAO PODE.",
    alwaysActive: true,
    requires: [],
    category: "core",
  },
  {
    id: "e2e-test-protection",
    number: 6,
    name: "E2E Protection",
    namePtBr: "Protecao E2E",
    description:
      "E2E tests are protected by chmod 555 (dirs) / 444 (files). Only unlocked in Red phase (make e2e-unlock). Auto-locked after dev/test. Features/step definitions NEVER modified in Green phase.",
    descriptionPtBr:
      "Testes E2E sao protegidos por chmod 555 (dirs) / 444 (arquivos). Apenas desbloqueados na fase Red (make e2e-unlock). Auto-bloqueados apos dev/test. Features/step definitions NUNCA modificados na fase Green.",
    alwaysActive: false,
    requires: ["tdd-enforcement"],
    category: "testing",
  },
  {
    id: "post-dev-e2e-validation",
    number: 7,
    name: "Post-dev E2E Validation",
    namePtBr: "Validacao E2E Pos-Dev",
    description:
      "After ANY frontend or backend change: run E2E tests. Diagnostic loop max 3 iterations without success → report to user. NEVER modify tests to pass — fix application code.",
    descriptionPtBr:
      "Apos QUALQUER mudanca em frontend ou backend: executar testes E2E. Loop diagnostico max 3 iteracoes sem sucesso → reportar ao usuario. NUNCA modificar testes para passar — corrigir codigo da aplicacao.",
    alwaysActive: false,
    requires: ["e2e-test-protection"],
    category: "testing",
  },
  {
    id: "tdd-enforcement",
    number: 8,
    name: "TDD Enforcement",
    namePtBr: "TDD Enforcement",
    description:
      "4 automatic hooks protect TDD workflow: PreToolUse (blocks src/ edits without tests), PostToolUse (runs tests after edits), UserPromptSubmit (injects TDD eval), Stop (verifies tests before exit).",
    descriptionPtBr:
      "4 hooks automaticos protegem workflow TDD: PreToolUse (bloqueia src/ sem teste), PostToolUse (roda testes apos edicao), UserPromptSubmit (injeta avaliacao TDD), Stop (verifica testes antes de encerrar).",
    alwaysActive: false,
    requires: [],
    category: "testing",
  },
  {
    id: "tdd-sequential-enforcement",
    number: 9,
    name: "TDD Sequential Enforcement",
    namePtBr: "TDD Sequential Enforcement",
    description:
      "Delegates CANNOT write tests AND implementation in the same invocation. Red phase (tdd-test-writer) and Green phase (tdd-implementer) must be separate invocations with context isolation. Exceptions: bug fix < 3 files, refactoring with existing tests, config without business logic.",
    descriptionPtBr:
      "Delegates NAO podem escrever testes E implementacao na mesma invocacao. Fase Red (tdd-test-writer) e fase Green (tdd-implementer) devem ser invocacoes separadas com context isolation. Excecoes: bug fix < 3 arquivos, refactoring com testes existentes, config sem logica de negocio.",
    alwaysActive: false,
    requires: ["tdd-enforcement"],
    category: "testing",
  },
  {
    id: "execution-trace",
    number: 10,
    name: "Execution Trace",
    namePtBr: "Observabilidade de Execucao",
    description:
      "Three observability mechanisms: (1) Plan Checkpoint before delegation (user approval required for features), (2) Mandatory Spec-Validate after Green phase, (3) Persistent Trace File recording every delegation with results. Trace dir: docs/trace/{feature}-{date}.md",
    descriptionPtBr:
      "Tres mecanismos de observabilidade: (1) Checkpoint de Plano antes de delegar (aprovacao do usuario para features), (2) Spec-Validate obrigatorio apos fase Green, (3) Trace File persistente registrando cada delegacao com resultados. Dir: documentos/trace/{feature}-{data}.md",
    alwaysActive: false,
    requires: ["feature-planning-gate"],
    category: "quality",
  },
  {
    id: "parallel-delegation",
    number: 11,
    name: "Parallel Delegation",
    namePtBr: "Delegacao Paralela",
    description:
      "Independent delegates MUST run in parallel via multiple Agent tool calls in the same message. Uses dependency graph (db → backend/agent → frontend/mobile) to group into waves. Sequential execution of independent modules is an anti-pattern.",
    descriptionPtBr:
      "Delegates independentes DEVEM rodar em paralelo via multiplas chamadas Agent tool na mesma mensagem. Usa grafo de dependencias (db → backend/agent → frontend/mobile) para agrupar em waves. Execucao sequencial de modulos independentes e anti-pattern.",
    alwaysActive: false,
    requires: [],
    category: "core",
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
