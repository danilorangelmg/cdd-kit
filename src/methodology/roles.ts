export interface ModuleRole {
  id: string;
  label: string;
  description: string;
  scope: {
    allowed: string[];
    forbidden: string[];
  };
  suggestedArchitecture: string;
  templateFile: string;
}

export const ROLES: ModuleRole[] = [
  {
    id: "frontend",
    label: "Frontend",
    description: "Camada visual (SPA, SSR, static site)",
    scope: {
      allowed: [
        "Layout, UX, formatacao de dados para exibicao",
        "Estados visuais (loading, error, empty)",
        "Interacao do usuario e navegacao",
        "Validacao de formato de input (mascara, campo obrigatorio)",
        "Ordenacao/filtragem local de dados ja processados",
        "Chamadas API ao backend",
      ],
      forbidden: [
        "Calculos de dominio e regras de negocio",
        "Validacoes que dependem de regras de dominio",
        "Transformacoes de dados com conhecimento do dominio",
        "Agregacoes e metricas de negocio",
        "Decisoes de workflow",
      ],
    },
    suggestedArchitecture: "MVVM: Pages (View) → Hooks (ViewModel) → Services (Model)",
    templateFile: "frontend.CLAUDE.md.hbs",
  },
  {
    id: "backend",
    label: "Backend / BFF",
    description: "Logica de negocio, APIs, agregacao de dados",
    scope: {
      allowed: [
        "Validacoes de dominio e regras de negocio",
        "Calculos, transformacoes e agregacoes",
        "Orquestracao de dados de multiplas fontes",
        "Autenticacao e autorizacao",
        "Decisoes de workflow",
        "APIs RESTful ou GraphQL",
      ],
      forbidden: [
        "Logica de apresentacao ou rendering de UI",
        "Logica de motor/pipeline/scheduler (pertence a agent-ai)",
        "Extracao de dados de sistemas externos (pertence a modulo dedicado)",
        "DDL ou schema de banco (pertence a database)",
      ],
    },
    suggestedArchitecture: "Layered: Routes → Services → Repositories",
    templateFile: "backend.CLAUDE.md.hbs",
  },
  {
    id: "database",
    label: "Database / Schema Registry",
    description: "DDL, migrations, schema definitions",
    scope: {
      allowed: [
        "Definicoes de tabelas e colunas (DDL)",
        "Migrations (up/down)",
        "Validacao de contratos entre servicos e schema",
        "Indices e constraints",
      ],
      forbidden: [
        "Logica de negocio ou codigo de aplicacao",
        "ORM models com metodos de negocio",
        "Seeds com dados de negocio (apenas dados de referencia)",
      ],
    },
    suggestedArchitecture: "Schema Registry: schema definitions → migration tool → validators",
    templateFile: "database.CLAUDE.md.hbs",
  },
  {
    id: "agent-ai",
    label: "Agent AI / Rules Engine",
    description: "Motor de regras, LLM, pipelines, schedulers",
    scope: {
      allowed: [
        "Regras deterministicas (engine sem LLM)",
        "Pipelines de processamento de dados",
        "Integracao com LLMs (classificacao, NLU, visao)",
        "Schedulers e jobs agendados",
        "Alertas e notificacoes automaticas",
      ],
      forbidden: [
        "Logica de API/frontend (pertence a backend/frontend)",
        "Extracao de dados de sistemas externos (modulo dedicado)",
        "Auditoria ou snapshots (modulo dedicado)",
      ],
    },
    suggestedArchitecture: "Namespaces isolados: engine/ (deterministico) → agent/ (LLM) → core/ (compartilhado)",
    templateFile: "agent-ai.CLAUDE.md.hbs",
  },
  {
    id: "mobile",
    label: "Mobile App",
    description: "App nativo ou hibrido (React Native, Flutter, etc.)",
    scope: {
      allowed: [
        "Layout, UX, navegacao nativa",
        "Captura de fotos, GPS, sensores",
        "Push notifications (recebimento)",
        "Armazenamento local (offline-first)",
        "Chamadas API ao backend",
      ],
      forbidden: [
        "Calculos de dominio e regras de negocio",
        "Validacoes que dependem de regras de dominio",
        "Logica de sincronizacao complexa (pertence ao backend)",
      ],
    },
    suggestedArchitecture: "MVVM: Screens (View) → Hooks (ViewModel) → Services (Model)",
    templateFile: "mobile.CLAUDE.md.hbs",
  },
  {
    id: "e2e",
    label: "E2E Tests",
    description: "Testes end-to-end (Cucumber, Playwright, Cypress, etc.)",
    scope: {
      allowed: [
        "Feature files (Gherkin/BDD)",
        "Step definitions",
        "Page Objects / fixtures",
        "Mock server para simular backend",
        "Screenshots e reports",
      ],
      forbidden: [
        "Codigo de aplicacao",
        "Logica de negocio",
        "Modificacao de testes para fazer codigo passar (o contrario e correto)",
      ],
    },
    suggestedArchitecture: "BDD: Features (Gherkin) → Step Definitions → Page Objects → Fixtures",
    templateFile: "e2e.CLAUDE.md.hbs",
  },
  {
    id: "generic",
    label: "Generic Module",
    description: "Modulo customizado sem role pre-definido",
    scope: {
      allowed: ["Definido pelo usuario no CLAUDE.md do modulo"],
      forbidden: ["Definido pelo usuario no CLAUDE.md do modulo"],
    },
    suggestedArchitecture: "Definida pelo usuario",
    templateFile: "generic.CLAUDE.md.hbs",
  },
];

export function getRoleById(id: string): ModuleRole | undefined {
  return ROLES.find((r) => r.id === id);
}
