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
    name: "Absolute Delegation",
    description:
      "The orchestrator NEVER edits files inside modules. All implementation is delegated to specialized sub-agents via Task tool.",
    alwaysActive: true,
    requires: [],
    category: "core",
  },
  {
    id: "changelog-by-date",
    number: 1,
    name: "Changelog by Date",
    description:
      "Every completed delegation generates a changelog entry per module per day with title, agent, status, decision, changes, and Mermaid diagram (if applicable).",
    alwaysActive: false,
    requires: [],
    category: "documentation",
  },
  {
    id: "conditional-mermaid",
    number: 2,
    name: "Conditional Mermaid Diagrams",
    description:
      "Mermaid diagrams are mandatory ONLY for: new endpoint (sequenceDiagram), schema change (erDiagram), new integration (flowchart). NOT for: bug fixes, config, refactoring, basic CRUD.",
    alwaysActive: false,
    requires: ["changelog-by-date"],
    category: "documentation",
  },
  {
    id: "feature-planning-gate",
    number: 3,
    name: "Feature Planning Gate",
    description:
      "Auto-detects new features (implement, create, add, new module). Classifies as SIMPLE or COMPLEX. Complex features require per-module documentation (business rules, test plans, dev plans) BEFORE implementation.",
    alwaysActive: false,
    requires: [],
    category: "quality",
  },
  {
    id: "api-response-contract",
    number: 4,
    name: "API Response Contract",
    description:
      'All APIs follow a standard envelope: success {"data": {...}}, error {"error": {"message": "...", "code": "..."}}. No loose JSON at root.',
    alwaysActive: false,
    requires: [],
    category: "quality",
  },
  {
    id: "scope-of-responsibility",
    number: 5,
    name: "Scope of Responsibility",
    description:
      "Each module has well-defined responsibility. Frontends are pure visual layer (zero business logic). Backends contain all business logic. Each role has a CAN/CANNOT map.",
    alwaysActive: true,
    requires: [],
    category: "core",
  },
  {
    id: "e2e-test-protection",
    number: 6,
    name: "E2E Protection",
    description:
      "E2E tests are protected by chmod 555 (dirs) / 444 (files). Only unlocked in Red phase (make e2e-unlock). Auto-locked after dev/test. Features/step definitions NEVER modified in Green phase.",
    alwaysActive: false,
    requires: ["tdd-enforcement"],
    category: "testing",
  },
  {
    id: "post-dev-e2e-validation",
    number: 7,
    name: "Post-dev E2E Validation",
    description:
      "After ANY frontend or backend change: run E2E tests. Diagnostic loop max 3 iterations without success → report to user. NEVER modify tests to pass — fix application code.",
    alwaysActive: false,
    requires: ["e2e-test-protection"],
    category: "testing",
  },
  {
    id: "tdd-enforcement",
    number: 8,
    name: "TDD Enforcement",
    description:
      "4 automatic hooks protect TDD workflow: PreToolUse (blocks src/ edits without tests), PostToolUse (runs tests after edits), UserPromptSubmit (injects TDD eval), Stop (verifies tests before exit).",
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
