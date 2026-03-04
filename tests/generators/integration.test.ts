import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs-extra";
import { generateOrchestrator } from "../../src/generators/orchestrator.js";
import { generateAllModules } from "../../src/generators/module.js";
import { generateClaudeInfra } from "../../src/generators/claude-infra.js";
import { generateDocs } from "../../src/generators/docs.js";
import type { ProjectConfig } from "../../src/utils/validation.js";

const TEST_DIR = path.join(process.cwd(), "tests", ".tmp-test-project");

const standardConfig: ProjectConfig = {
  version: "1.0.0",
  project: {
    name: "test-project",
    description: "A test project",
    language: "en",
  },
  modules: [
    { name: "frontend", role: "frontend", directory: "frontend" },
    { name: "api", role: "backend", directory: "api" },
    { name: "database", role: "database", directory: "database" },
  ],
  methodology: {
    preset: "standard",
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
    },
  },
};

describe("Project Generation (Standard preset, English)", () => {
  beforeEach(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it("generates orchestrator files", async () => {
    const files = await generateOrchestrator(TEST_DIR, standardConfig);

    expect(files).toContain("CLAUDE.md");
    expect(files).toContain("Makefile");
    expect(files).toContain("docker-compose.yml");
    expect(files).toContain(".env.example");
    expect(files).toContain("cdd.json");

    // Verify CLAUDE.md content
    const claude = await fs.readFile(path.join(TEST_DIR, "CLAUDE.md"), "utf-8");
    expect(claude).toContain("test-project");
    expect(claude).toContain("frontend");
    expect(claude).toContain("api");
    expect(claude).toContain("database");
    expect(claude).toContain("Delegation");

    // Verify Makefile targets
    const makefile = await fs.readFile(path.join(TEST_DIR, "Makefile"), "utf-8");
    expect(makefile).toContain("test-frontend");
    expect(makefile).toContain("test-api");
    expect(makefile).toContain("test-database");
  });

  it("generates module CLAUDE.md files", async () => {
    const files = await generateAllModules(TEST_DIR, standardConfig);

    expect(files).toContain("frontend/CLAUDE.md");
    expect(files).toContain("api/CLAUDE.md");
    expect(files).toContain("database/CLAUDE.md");

    // Frontend should be visual-only
    const frontClaude = await fs.readFile(
      path.join(TEST_DIR, "frontend", "CLAUDE.md"),
      "utf-8"
    );
    expect(frontClaude).toContain("frontend");
    expect(frontClaude).toContain("FORBIDDEN");

    // Backend should have business logic scope
    const apiClaude = await fs.readFile(
      path.join(TEST_DIR, "api", "CLAUDE.md"),
      "utf-8"
    );
    expect(apiClaude).toContain("business logic");

    // Database should be DDL only
    const dbClaude = await fs.readFile(
      path.join(TEST_DIR, "database", "CLAUDE.md"),
      "utf-8"
    );
    expect(dbClaude).toContain("DDL");
  });

  it("generates .claude/ infrastructure", async () => {
    const files = await generateClaudeInfra(TEST_DIR, standardConfig);

    // Settings
    expect(files).toContain(".claude/settings.json");
    const settings = await fs.readFile(
      path.join(TEST_DIR, ".claude", "settings.json"),
      "utf-8"
    );
    expect(settings).toContain("tdd-guard");

    // Hooks (TDD enforcement enabled)
    expect(files).toContain(".claude/hooks/tdd-guard.sh");
    expect(files).toContain(".claude/hooks/auto-test.sh");
    expect(files).toContain(".claude/hooks/tdd-eval.sh");

    // Delegate agents per module
    expect(files).toContain(".claude/agents/frontend-delegate.md");
    expect(files).toContain(".claude/agents/api-delegate.md");
    expect(files).toContain(".claude/agents/database-delegate.md");

    // Shared agents
    expect(files).toContain(".claude/agents/validator.md");
    expect(files).toContain(".claude/agents/tdd-test-writer.md");
    expect(files).toContain(".claude/agents/tdd-implementer.md");
    expect(files).toContain(".claude/agents/product-owner.md");

    // Skills
    expect(files).toContain(".claude/skills/tdd/SKILL.md");
    expect(files).toContain(".claude/skills/plan-feature/SKILL.md");

    // Rules
    expect(files).toContain(".claude/rules/delegation-protocol.md");
    expect(files).toContain(".claude/rules/scope-responsibilities.md");
    expect(files).toContain(".claude/rules/anti-patterns.md");
    expect(files).toContain(".claude/rules/feature-gate.md");

    // Hooks should be executable
    const hookStat = await fs.stat(
      path.join(TEST_DIR, ".claude", "hooks", "tdd-guard.sh")
    );
    expect(hookStat.mode & 0o111).toBeGreaterThan(0);
  });

  it("generates documentation structure", async () => {
    const files = await generateDocs(TEST_DIR, standardConfig);

    expect(files).toContain("documentos/change-log/");
    expect(files).toContain("documentos/regras/");
    expect(files).toContain("documentos/templates/feature-planning.md");
    expect(files).toContain("documentos/templates/changelog-entry.md");

    // Verify per-module doc structure
    for (const mod of standardConfig.modules) {
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, "documentos", "regras", mod.name, "regras-negocio")
        )
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, "documentos", "regras", mod.name, "plano-testes")
        )
      ).toBe(true);
    }
  });
});

describe("Project Generation (Minimal preset)", () => {
  const minimalConfig: ProjectConfig = {
    version: "1.0.0",
    project: {
      name: "minimal-project",
      description: "Minimal test",
      language: "pt-BR",
    },
    modules: [{ name: "app", role: "generic", directory: "app" }],
    methodology: {
      preset: "minimal",
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
      },
    },
  };

  beforeEach(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it("does NOT generate TDD hooks when disabled", async () => {
    const files = await generateClaudeInfra(TEST_DIR, minimalConfig);

    expect(files).not.toContain(".claude/hooks/tdd-guard.sh");
    expect(files).not.toContain(".claude/hooks/auto-test.sh");
    expect(files).not.toContain(".claude/skills/tdd/SKILL.md");
    expect(files).not.toContain(".claude/agents/tdd-test-writer.md");
    expect(files).not.toContain(".claude/agents/tdd-implementer.md");
  });

  it("does NOT generate feature gate when disabled", async () => {
    const files = await generateClaudeInfra(TEST_DIR, minimalConfig);

    expect(files).not.toContain(".claude/rules/feature-gate.md");
    expect(files).not.toContain(".claude/skills/plan-feature/SKILL.md");
    expect(files).not.toContain(".claude/agents/product-owner.md");
  });

  it("generates Portuguese content for pt-BR", async () => {
    await generateAllModules(TEST_DIR, minimalConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "app", "CLAUDE.md"),
      "utf-8"
    );
    expect(claude).toContain("Modulo customizado");
  });
});
