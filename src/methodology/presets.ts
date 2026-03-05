export interface Preset {
  id: string;
  label: string;
  description: string;
  rules: Record<string, boolean>;
}

export const PRESETS: Preset[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Apenas orquestracao + delegacao (Regras #0, #5)",
    rules: {
      "absolute-delegation": true,
      "changelog-by-date": false,
      "conditional-mermaid": false,
      "feature-planning-gate": false,
      "api-response-contract": false,
      "scope-of-responsibility": true,
      "e2e-test-protection": false,
      "post-dev-e2e-validation": false,
      "tdd-enforcement": false,
      "tdd-sequential-enforcement": false,
    },
  },
  {
    id: "standard",
    label: "Standard (Recomendado)",
    description: "Regras core + TDD + Feature Gate + Changelog",
    rules: {
      "absolute-delegation": true,
      "changelog-by-date": true,
      "conditional-mermaid": false,
      "feature-planning-gate": true,
      "api-response-contract": true,
      "scope-of-responsibility": true,
      "e2e-test-protection": false,
      "post-dev-e2e-validation": false,
      "tdd-enforcement": true,
      "tdd-sequential-enforcement": true,
    },
  },
  {
    id: "full",
    label: "Full",
    description: "Tudo: TDD enforced com hooks, E2E protection, Mermaid obrigatorio",
    rules: {
      "absolute-delegation": true,
      "changelog-by-date": true,
      "conditional-mermaid": true,
      "feature-planning-gate": true,
      "api-response-contract": true,
      "scope-of-responsibility": true,
      "e2e-test-protection": true,
      "post-dev-e2e-validation": true,
      "tdd-enforcement": true,
      "tdd-sequential-enforcement": true,
    },
  },
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
