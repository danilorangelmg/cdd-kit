import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs-extra";
import { generateOrchestrator } from "../../src/generators/orchestrator.js";
import { generateAllModules } from "../../src/generators/module.js";
import { generateClaudeInfra } from "../../src/generators/claude-infra.js";
import { generateDocs } from "../../src/generators/docs.js";
import { generateGit } from "../../src/generators/git.js";
import { getStacksForRole, getStackById } from "../../src/methodology/stacks.js";
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
      "tdd-sequential-enforcement": true,
      "execution-trace": false,
      "parallel-delegation": true,
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

    // Verify CLAUDE.md content (English)
    const claude = await fs.readFile(path.join(TEST_DIR, "CLAUDE.md"), "utf-8");
    expect(claude).toContain("test-project");
    expect(claude).toContain("frontend");
    expect(claude).toContain("api");
    expect(claude).toContain("database");
    expect(claude).toContain("You are the Orchestrator");
    expect(claude).toContain("Delegation Map");

    // Should use English paths
    expect(claude).toContain("docs/rules/");
    expect(claude).not.toContain("documentos/");

    // Phase 5: 3-layer orchestration (inline in "You are the Orchestrator" section)
    expect(claude).toContain("You are the Orchestrator");
    expect(claude).toContain("Orchestrator");
    expect(claude).toContain("Delegates");
    expect(claude).toContain("Validator");

    // Phase 5: Available Skills section
    expect(claude).toContain("Available Skills");
    expect(claude).toContain("/git-commit");
    expect(claude).toContain("/validate-all");
    expect(claude).toContain("/deploy-all");

    // Phase 5: Delegate Response Contract
    expect(claude).toContain("Delegate Response Contract");
    expect(claude).toContain("FILES_CHANGED");
    expect(claude).toContain("EXTERNAL_DEPENDENCIES");

    // Phase 5: Outside-In methodology (feature-planning-gate is enabled)
    expect(claude).toContain("Outside-In");

    // Phase 5: Enforcement Hooks section (TDD + planning enabled)
    expect(claude).toContain("Enforcement Hooks");
    expect(claude).toContain("pre-edit.sh");
    expect(claude).toContain("auto-test.sh");

    // Phase 5: Expanded Rule #5 with responsibility table
    expect(claude).toContain("CANNOT contain");

    // Phase 5: Expanded commands
    expect(claude).toContain("make verify");
    expect(claude).toContain("make validate-all");
    expect(claude).toContain("make lint-frontend");

    // Phase 9: Expanded Rule #1 (git-based changelog)
    expect(claude).toContain("Commit Format");
    expect(claude).toContain("Conventional Commits");
    expect(claude).toContain("Orchestrator's responsibility");

    // Phase 16/20: Expanded Rule #3 (planning gate auto-detection, SIMPLE criteria)
    expect(claude).toContain("Mandatory auto-detection");
    expect(claude).toContain("SIMPLE");
    expect(claude).toContain("NOT a feature");
    expect(claude).toContain("ABSOLUTE BLOCK");
    expect(claude).toContain("Pre-implementation checklist");
    expect(claude).toContain("Docs per module");

    // Phase 20: Expanded Rule #0 (absolute delegation emphasis)
    expect(claude).toContain("UNDER NO CIRCUMSTANCES");
    expect(claude).toContain("Violation = complete rework");
    expect(claude).toContain("Is the file inside a module?");

    // Phase 21: Expanded Rule #5 (auto-routing)
    expect(claude).toContain("Auto-routing");

    // Phase 20: Expanded Rule #8 (context isolation, compliance stats)
    expect(claude).toContain("Context Isolation");
    expect(claude).toContain("~84%");
    expect(claude).toContain("/tdd");

    // Phase 20: Expanded Rule #9 (TDD sequential enforcement)
    expect(claude).toContain("tdd-test-writer");
    expect(claude).toContain("tdd-implementer");
    expect(claude).toContain("Prohibitions");

    // Phase 9: Expanded Rule #4 (API envelope examples)
    expect(claude).toContain("VALIDATION_ERROR");
    expect(claude).toContain("No exceptions");

    // Phase 14: English rule descriptions (project.language = "en")
    expect(claude).toContain("Absolute Delegation");
    expect(claude).not.toContain("Delegacao Absoluta");

    // Phase 12: Per-Module skills section
    expect(claude).toContain("Per-Module");
    expect(claude).toContain("/adr");
    expect(claude).toContain("/diagram");
    expect(claude).toContain("Frontend");
    expect(claude).toContain("/component");
    expect(claude).toContain("Backend");
    expect(claude).toContain("/endpoint");

    // Phase 17: Make stop/clean/status commands
    expect(claude).toContain("make stop");
    expect(claude).toContain("make status");

    // Verify Makefile targets
    const makefile = await fs.readFile(path.join(TEST_DIR, "Makefile"), "utf-8");
    expect(makefile).toContain("test-frontend");
    expect(makefile).toContain("test-api");
    expect(makefile).toContain("test-database");
    expect(makefile).toContain("verify-frontend");
    expect(makefile).toContain("verify-api");
    expect(makefile).toContain("verify:");

    // Phase 17: Makefile stop/clean/status targets
    expect(makefile).toContain("stop:");
    expect(makefile).toContain("clean:");
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

    // Phase 6: Execution Protocol in all modules
    expect(frontClaude).toContain("Execution Protocol");
    expect(frontClaude).toContain("ANALYZE");
    expect(frontClaude).toContain("DECIDE");
    expect(frontClaude).toContain("EXECUTE");
    expect(frontClaude).toContain("VALIDATE");

    // Phase 6: Mandatory Validation chain
    expect(frontClaude).toContain("Mandatory Validation");

    // Phase 6: Expanded frontend checklist
    expect(frontClaude).toContain("Dark mode");
    expect(frontClaude).toContain("No unused imports");
    expect(frontClaude).toContain("No `any`");

    // Backend should have business logic scope
    const apiClaude = await fs.readFile(
      path.join(TEST_DIR, "api", "CLAUDE.md"),
      "utf-8"
    );
    expect(apiClaude).toContain("business logic");

    // Phase 6: Backend execution protocol and expanded checklist
    expect(apiClaude).toContain("Execution Protocol");
    expect(apiClaude).toContain("Mandatory Validation");
    expect(apiClaude).toContain("Layered architecture");
    expect(apiClaude).toContain("OpenAPI/Swagger");

    // Database should be DDL only
    const dbClaude = await fs.readFile(
      path.join(TEST_DIR, "database", "CLAUDE.md"),
      "utf-8"
    );
    expect(dbClaude).toContain("DDL");

    // Phase 6: Database execution protocol and checklist
    expect(dbClaude).toContain("Execution Protocol");
    expect(dbClaude).toContain("Mandatory Validation");
    expect(dbClaude).toContain("Reversible migrations");

    // Phase 10: Agents & Skills table in modules
    expect(frontClaude).toContain("Agents & Skills");
    expect(frontClaude).toContain("frontend-specialist");
    expect(frontClaude).toContain("software-architect");
    expect(frontClaude).toContain("product-owner");

    expect(apiClaude).toContain("Agents & Skills");
    expect(apiClaude).toContain("backend-specialist");
    expect(apiClaude).toContain("/endpoint");

    expect(dbClaude).toContain("Agents & Skills");
    expect(dbClaude).toContain("software-architect");

    // Phase 11: Rules reference table in modules
    expect(frontClaude).toContain("Rules");
    expect(frontClaude).toContain("guidelines.md");
    expect(frontClaude).toContain("patterns.md");
    expect(frontClaude).toContain("auto-invoke.md");
    expect(frontClaude).toContain("post-implementation.md");
    expect(frontClaude).toContain("requirements.md");

    expect(apiClaude).toContain("guidelines.md");
    expect(dbClaude).toContain("guidelines.md");
  });

  it("generates .claude/ infrastructure", async () => {
    const files = await generateClaudeInfra(TEST_DIR, standardConfig);

    // Settings
    expect(files).toContain(".claude/settings.json");
    const settings = await fs.readFile(
      path.join(TEST_DIR, ".claude", "settings.json"),
      "utf-8"
    );
    expect(settings).toContain("pre-edit");

    // Hooks (consolidated pre-edit + TDD enforcement enabled)
    expect(files).toContain(".claude/hooks/pre-edit.sh");
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
      path.join(TEST_DIR, ".claude", "hooks", "pre-edit.sh")
    );
    expect(hookStat.mode & 0o111).toBeGreaterThan(0);

    // Skills should use English paths
    const tddSkill = await fs.readFile(
      path.join(TEST_DIR, ".claude", "skills", "tdd", "SKILL.md"),
      "utf-8"
    );
    expect(tddSkill).toContain("docs/rules/");
    expect(tddSkill).toContain("business-rules");
    expect(tddSkill).not.toContain("documentos/");

    // Agents should use English paths
    const testWriter = await fs.readFile(
      path.join(TEST_DIR, ".claude", "agents", "tdd-test-writer.md"),
      "utf-8"
    );
    expect(testWriter).toContain("docs/rules/");
    expect(testWriter).not.toContain("documentos/regras/");

    // TDD agents should have access restrictions
    expect(testWriter).toContain("ALLOWED to read");
    expect(testWriter).toContain("PROHIBITED from reading");
    expect(testWriter).toContain("Anti-Patterns");

    const implementer = await fs.readFile(
      path.join(TEST_DIR, ".claude", "agents", "tdd-implementer.md"),
      "utf-8"
    );
    expect(implementer).toContain("ALLOWED to read");
    expect(implementer).toContain("PROHIBITED from reading");
    expect(implementer).toContain("CONTEXT CONTAMINATION");
    expect(implementer).toContain("Prohibitions");

    // Rule #9: TDD Sequential Enforcement
    expect(files).toContain(".claude/rules/tdd/sequential-enforcement.md");
    const seqEnforcement = await fs.readFile(
      path.join(TEST_DIR, ".claude", "rules", "tdd", "sequential-enforcement.md"),
      "utf-8"
    );
    expect(seqEnforcement).toContain("context isolation");
    expect(seqEnforcement).toContain("tdd-test-writer");
    expect(seqEnforcement).toContain("tdd-implementer");

    // Planning hooks (feature-planning-gate enabled in standard — consolidated in pre-edit)
    expect(files).toContain(".claude/hooks/planning-validator.sh");
    expect(files).toContain(".claude/hooks/planning-eval.sh");

    // Pre-edit (consolidated) should be executable
    const preEditStat = await fs.stat(
      path.join(TEST_DIR, ".claude", "hooks", "pre-edit.sh")
    );
    expect(preEditStat.mode & 0o111).toBeGreaterThan(0);

    // Settings should reference consolidated pre-edit and planning hooks
    expect(settings).toContain("pre-edit");
    expect(settings).toContain("planning-validator");
    expect(settings).toContain("planning-eval");

    // Pre-edit hook should use English paths
    const preEdit = await fs.readFile(
      path.join(TEST_DIR, ".claude", "hooks", "pre-edit.sh"),
      "utf-8"
    );
    expect(preEdit).toContain("docs/business-rules/");
    expect(preEdit).toContain("dev-plans");
    expect(preEdit).toContain("test-plans");

    // Shared test-finding library (TDD enabled)
    expect(files).toContain(".claude/hooks/lib/find-test.sh");
    const findTestLib = await fs.readFile(
      path.join(TEST_DIR, ".claude", "hooks", "lib", "find-test.sh"),
      "utf-8"
    );
    expect(findTestLib).toContain("find_python_test");
    expect(findTestLib).toContain("find_ts_test");
    expect(findTestLib).toContain("find_go_test");

    // Pre-edit (consolidated guard) should source the shared library
    expect(preEdit).toContain('source "$SCRIPT_DIR/lib/find-test.sh"');

    // Auto-test should source the shared library and run specific tests
    const autoTest = await fs.readFile(
      path.join(TEST_DIR, ".claude", "hooks", "auto-test.sh"),
      "utf-8"
    );
    expect(autoTest).toContain('source "$SCRIPT_DIR/lib/find-test.sh"');
    expect(autoTest).toContain("find_related_test");
    expect(autoTest).toContain("run_single_test");

    // Universal root skills (always generated)
    expect(files).toContain(".claude/skills/git-commit/SKILL.md");
    expect(files).toContain(".claude/skills/pr-create/SKILL.md");
    expect(files).toContain(".claude/skills/validate-all/SKILL.md");
    expect(files).toContain(".claude/skills/deploy-all/SKILL.md");

    // Conditional root skills
    // check-flow: generated when both frontend + backend exist
    expect(files).toContain(".claude/skills/check-flow/SKILL.md");
    // api-contract: generated when api-response-contract enabled
    expect(files).toContain(".claude/skills/api-contract/SKILL.md");

    // Settings should have allow permissions and additionalDirectories
    const settingsJson = JSON.parse(settings);
    expect(settingsJson.permissions.allow.length).toBeGreaterThan(0);
    expect(settingsJson.permissions.allow).toContain("Bash(docker compose *)");
    expect(settingsJson.permissions.allow).toContain("Bash(make test *)");
    expect(settingsJson.permissions.additionalDirectories).toContain(".claude/skills");

    // Verify pipeline
    expect(files).toContain(".claude/verify/pipeline.yaml");
    expect(files).toContain(".claude/verify/run.sh");
    expect(files).toContain(".claude/hooks/post-dev-verify.sh");

    // Verify runner should be executable
    const verifyRunnerStat = await fs.stat(
      path.join(TEST_DIR, ".claude", "verify", "run.sh")
    );
    expect(verifyRunnerStat.mode & 0o111).toBeGreaterThan(0);

    // Settings should reference post-dev-verify hook
    expect(settings).toContain("post-dev-verify");

    // Phase 7: delegation-protocol should have Response Contract
    const delegationProtocol = await fs.readFile(
      path.join(TEST_DIR, ".claude", "rules", "delegation-protocol.md"),
      "utf-8"
    );
    expect(delegationProtocol).toContain("Standard Response Contract");
    expect(delegationProtocol).toContain("FILES_CHANGED");
    expect(delegationProtocol).toContain("EXTERNAL_DEPENDENCIES");

    // Phase 7: anti-patterns should have impact and remediation
    const antiPatterns = await fs.readFile(
      path.join(TEST_DIR, ".claude", "rules", "anti-patterns.md"),
      "utf-8"
    );
    expect(antiPatterns).toContain("Impact");
    expect(antiPatterns).toContain("Remediation");

    // Phase 7: scope-responsibilities should have visual vs business distinction
    const scopeResp = await fs.readFile(
      path.join(TEST_DIR, ".claude", "rules", "scope-responsibilities.md"),
      "utf-8"
    );
    expect(scopeResp).toContain("Visual Rule");
    expect(scopeResp).toContain("Business Rule");
    expect(scopeResp).toContain("Violation Procedure");

    // Phase 7: feature-gate content
    const featureGate = await fs.readFile(
      path.join(TEST_DIR, ".claude", "rules", "feature-gate.md"),
      "utf-8"
    );
    expect(featureGate).toContain("Pre-Implementation Checklist");
  });

  it("generates English documentation structure", async () => {
    const files = await generateDocs(TEST_DIR, standardConfig);

    // English directory names (changelog is git-based, no dirs)
    expect(files).toContain("docs/rules/");
    expect(files).toContain("docs/templates/feature-planning.md");

    // Verify per-module doc structure with English names
    for (const mod of standardConfig.modules) {
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, "docs", "rules", mod.name, "business-rules")
        )
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, "docs", "rules", mod.name, "test-plans")
        )
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, "docs", "rules", mod.name, "dev-plans")
        )
      ).toBe(true);
    }

    // Should NOT have Portuguese directory names
    expect(
      await fs.pathExists(path.join(TEST_DIR, "documentos"))
    ).toBe(false);
  });
});

describe("Project Generation (Minimal preset, PT-BR)", () => {
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
        "tdd-sequential-enforcement": false,
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

    expect(files).not.toContain(".claude/hooks/pre-edit.sh");
    expect(files).not.toContain(".claude/hooks/auto-test.sh");
    expect(files).not.toContain(".claude/hooks/lib/find-test.sh");
    expect(files).not.toContain(".claude/skills/tdd/SKILL.md");
    expect(files).not.toContain(".claude/agents/tdd-test-writer.md");
    expect(files).not.toContain(".claude/agents/tdd-implementer.md");
    expect(files).not.toContain(".claude/rules/tdd/sequential-enforcement.md");
  });

  it("generates universal root skills even for minimal preset", async () => {
    const files = await generateClaudeInfra(TEST_DIR, minimalConfig);

    // Universal skills always generated
    expect(files).toContain(".claude/skills/git-commit/SKILL.md");
    expect(files).toContain(".claude/skills/pr-create/SKILL.md");
    expect(files).toContain(".claude/skills/validate-all/SKILL.md");
    expect(files).toContain(".claude/skills/deploy-all/SKILL.md");

    // Conditional skills NOT generated for minimal/single-role
    expect(files).not.toContain(".claude/skills/check-flow/SKILL.md");
    expect(files).not.toContain(".claude/skills/api-contract/SKILL.md");
  });

  it("does NOT generate feature gate when disabled", async () => {
    const files = await generateClaudeInfra(TEST_DIR, minimalConfig);

    expect(files).not.toContain(".claude/rules/feature-gate.md");
    expect(files).not.toContain(".claude/skills/plan-feature/SKILL.md");
    expect(files).not.toContain(".claude/agents/product-owner.md");
    expect(files).not.toContain(".claude/hooks/planning-validator.sh");
    expect(files).not.toContain(".claude/hooks/planning-eval.sh");
  });

  it("generates Portuguese content for pt-BR", async () => {
    await generateAllModules(TEST_DIR, minimalConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "app", "CLAUDE.md"),
      "utf-8"
    );
    expect(claude).toContain("Modulo customizado");

    // Phase 6: Even generic modules should have Execution Protocol
    expect(claude).toContain("Protocolo de Execucao");
    expect(claude).toContain("Validacao Obrigatoria");

    // Phase 10-11: Generic modules have Agents & Skills and Rules
    expect(claude).toContain("Agents & Skills");
    expect(claude).toContain("software-architect");
    expect(claude).toContain("guidelines.md");
    // Generic with planning disabled should NOT have product-owner or requirements
    expect(claude).not.toContain("product-owner");
    expect(claude).not.toContain("requirements.md");
  });

  it("minimal CLAUDE.md does NOT have hooks or outside-in sections", async () => {
    await generateOrchestrator(TEST_DIR, minimalConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf-8"
    );

    // Should NOT have enforcement hooks (TDD/planning disabled)
    expect(claude).not.toContain("Enforcement Hooks");
    expect(claude).not.toContain("pre-edit.sh");
    expect(claude).not.toContain("Outside-In");

    // Should still have orchestration table and skills
    expect(claude).toContain("Voce e o Orquestrador");
    expect(claude).toContain("Skills Disponiveis");
    expect(claude).toContain("/git-commit");
    expect(claude).toContain("Contrato de Resposta dos Delegates");

    // Phase 9: Minimal should NOT have conditional expanded rules
    expect(claude).not.toContain("Diagramas Mermaid");
    expect(claude).not.toContain("Protecao E2E");
    expect(claude).not.toContain("Validacao E2E Pos-Dev");
    expect(claude).not.toContain("Formato de Entrada");

    // Phase 22: Minimal should NOT have deep rule content (TDD/E2E/planning disabled)
    expect(claude).not.toContain("BLOQUEIO ABSOLUTO");
    expect(claude).not.toContain("Context Isolation");
    expect(claude).not.toContain("INTOCAVEL");
  });

  it("generates Portuguese directory names for pt-BR", async () => {
    const ptBrFullConfig: ProjectConfig = {
      ...minimalConfig,
      methodology: {
        preset: "standard",
        rules: {
          ...minimalConfig.methodology.rules,
          "changelog-by-date": true,
          "feature-planning-gate": true,
        },
      },
    };

    const files = await generateDocs(TEST_DIR, ptBrFullConfig);

    // Portuguese directory names (changelog is git-based, no dirs)
    expect(files).toContain("documentos/regras/");

    // Verify Portuguese sub-dir names
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, "documentos", "regras", "app", "regras-negocio")
      )
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, "documentos", "regras", "app", "plano-testes")
      )
    ).toBe(true);

    // Should NOT have English directory names
    expect(await fs.pathExists(path.join(TEST_DIR, "docs"))).toBe(false);
  });

  it("generates Portuguese CLAUDE.md for pt-BR orchestrator", async () => {
    const ptBrConfig: ProjectConfig = {
      ...minimalConfig,
    };

    await generateOrchestrator(TEST_DIR, ptBrConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf-8"
    );
    expect(claude).toContain("Voce e o Orquestrador");
    expect(claude).not.toContain("You are the Orchestrator");

    // Phase 14: PT-BR rule descriptions (alwaysActive rules present in minimal)
    expect(claude).toContain("Delegacao Absoluta");
    expect(claude).not.toContain("Absolute Delegation");
    expect(claude).toContain("Escopo de Responsabilidade");
  });

  it("generates Portuguese expanded rules for pt-BR standard config", async () => {
    const ptBrStandardConfig: ProjectConfig = {
      ...minimalConfig,
      modules: [
        { name: "frontend", role: "frontend", directory: "frontend" },
        { name: "api", role: "backend", directory: "api" },
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
          "tdd-sequential-enforcement": true,
        },
      },
    };

    await generateOrchestrator(TEST_DIR, ptBrStandardConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf-8"
    );

    // Phase 15: PT-BR git-based changelog
    expect(claude).toContain("Conventional Commits");
    expect(claude).toContain("Responsabilidade do orquestrador");

    // Phase 16/20: PT-BR planning gate expansion
    expect(claude).toContain("Auto-deteccao obrigatoria");
    expect(claude).toContain("SIMPLES");
    expect(claude).toContain("NAO e feature");
    expect(claude).toContain("BLOQUEIO ABSOLUTO");
    expect(claude).toContain("Checklist pre-implementacao");

    // Phase 20: PT-BR Rule #0 expansion
    expect(claude).toContain("EM HIPOTESE ALGUMA");
    expect(claude).toContain("retrabalho completo");

    // Phase 21: PT-BR Rule #5 expansion
    expect(claude).toContain("Auto-roteamento");

    // Phase 20: PT-BR Rule #8 expansion
    expect(claude).toContain("~84%");

    // Phase 20: PT-BR Rule #9 expansion
    expect(claude).toContain("Proibicoes");
  });
});

describe("Project Generation (Full preset with E2E rules)", () => {
  const fullConfig: ProjectConfig = {
    version: "1.0.0",
    project: {
      name: "full-project",
      description: "Full test",
      language: "en",
    },
    modules: [
      { name: "web", role: "frontend", directory: "web" },
      { name: "api", role: "backend", directory: "api" },
      { name: "e2e", role: "e2e", directory: "e2e" },
    ],
    methodology: {
      preset: "full",
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
  };

  beforeEach(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it("generates expanded conditional rules in root CLAUDE.md", async () => {
    await generateOrchestrator(TEST_DIR, fullConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf-8"
    );

    // Phase 9: Mermaid diagram types (conditional-mermaid enabled)
    expect(claude).toContain("Mermaid Diagrams");
    expect(claude).toContain("sequenceDiagram");
    expect(claude).toContain("erDiagram");
    expect(claude).toContain("flowchart LR");

    // Phase 9: E2E Protection (e2e-test-protection enabled)
    expect(claude).toContain("E2E Protection");
    expect(claude).toContain("chmod 555/444");
    expect(claude).toContain("features/");
    expect(claude).toContain("step-definitions/");

    // Phase 9/21: Post-Dev E2E Validation (post-dev-e2e-validation enabled)
    expect(claude).toContain("Post-Dev E2E Validation");
    expect(claude).toContain("UNTOUCHABLE");
    expect(claude).toContain("NEVER modify E2E tests");
    expect(claude).toContain("Reinforces Rule #6");
    expect(claude).toContain("BFF changes");
    expect(claude).toContain("Root cause hypothesis");

    // Phase 20: E2E Protection expansion (Rule #6)
    expect(claude).toContain("TWO layers");
    expect(claude).toContain("features/**/*.feature");
    expect(claude).toContain("Safety net");
    expect(claude).toContain("Red phase");
    expect(claude).toContain("Green phase");
    expect(claude).toContain("orchestrator NEVER executes");

    // Phase 17: E2E make commands (e2e-test-protection enabled)
    expect(claude).toContain("make test-e2e");
    expect(claude).toContain("make test-e2e-report");

    // Phase 17: Full preset Makefile should have E2E targets
    const makefile = await fs.readFile(
      path.join(TEST_DIR, "Makefile"),
      "utf-8"
    );
    expect(makefile).toContain("test-e2e:");
    expect(makefile).toContain("test-e2e-report:");
    expect(makefile).toContain("stop:");
    expect(makefile).toContain("clean:");
  });
});

describe("Project Generation (with git submodules)", () => {
  const submoduleConfig: ProjectConfig = {
    version: "1.0.0",
    project: {
      name: "my-app",
      description: "App with submodules",
      language: "en",
    },
    modules: [
      { name: "front", role: "frontend", directory: "my-app-front" },
      { name: "bff", role: "backend", directory: "my-app-bff" },
      { name: "db", role: "database", directory: "my-app-db" },
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
        "tdd-sequential-enforcement": true,
      },
    },
    git: {
      submodules: true,
      org: "myorg",
      provider: "github",
      prefix: "my-app-",
    },
  };

  beforeEach(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it("generates .gitmodules with correct URLs", async () => {
    const files = await generateGit(TEST_DIR, submoduleConfig);

    expect(files).toContain(".gitmodules");
    expect(files).toContain(".gitignore");

    const gitmodules = await fs.readFile(
      path.join(TEST_DIR, ".gitmodules"),
      "utf-8"
    );
    expect(gitmodules).toContain('[submodule "my-app-front"]');
    expect(gitmodules).toContain("path = my-app-front");
    expect(gitmodules).toContain(
      "url = git@github.com:myorg/my-app-front.git"
    );
    expect(gitmodules).toContain('[submodule "my-app-bff"]');
    expect(gitmodules).toContain(
      "url = git@github.com:myorg/my-app-bff.git"
    );
    expect(gitmodules).toContain('[submodule "my-app-db"]');
  });

  it("does NOT generate .gitmodules without git config", async () => {
    const noGitConfig: ProjectConfig = {
      ...submoduleConfig,
      git: undefined,
    };
    const files = await generateGit(TEST_DIR, noGitConfig);
    expect(files).toHaveLength(0);
    expect(
      await fs.pathExists(path.join(TEST_DIR, ".gitmodules"))
    ).toBe(false);
  });

  it("generates Makefile with submodule targets", async () => {
    await generateOrchestrator(TEST_DIR, submoduleConfig);
    const makefile = await fs.readFile(
      path.join(TEST_DIR, "Makefile"),
      "utf-8"
    );
    expect(makefile).toContain("git submodule update --init --recursive");
    expect(makefile).toContain("submodule-status");
    expect(makefile).toContain("submodule-pull");
  });

  it("generates CLAUDE.md with submodule section", async () => {
    await generateOrchestrator(TEST_DIR, submoduleConfig);
    const claude = await fs.readFile(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf-8"
    );
    expect(claude).toContain("Git Submodules");
    expect(claude).toContain("git@github.com:myorg/my-app-front.git");
    expect(claude).toContain("git@github.com:myorg/my-app-bff.git");
    expect(claude).toContain("git submodule update --init --recursive");
  });

  it("skips src/ and tests/ dirs for submodule modules", async () => {
    await generateAllModules(TEST_DIR, submoduleConfig);

    // CLAUDE.md should still be created
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, "my-app-front", "CLAUDE.md")
      )
    ).toBe(true);

    // src/ and tests/ should NOT be created
    expect(
      await fs.pathExists(path.join(TEST_DIR, "my-app-front", "src"))
    ).toBe(false);
    expect(
      await fs.pathExists(path.join(TEST_DIR, "my-app-front", "tests"))
    ).toBe(false);
  });

  it("Makefile has NO submodule targets without git config", async () => {
    const noGitConfig: ProjectConfig = {
      ...submoduleConfig,
      git: undefined,
    };
    await generateOrchestrator(TEST_DIR, noGitConfig);
    const makefile = await fs.readFile(
      path.join(TEST_DIR, "Makefile"),
      "utf-8"
    );
    expect(makefile).not.toContain("submodule-status");
    expect(makefile).not.toContain("submodule-pull");
  });

  it("generates per-module .claude/ infrastructure", async () => {
    const files = await generateClaudeInfra(TEST_DIR, submoduleConfig);

    // Each module should have its own .claude/ with settings, hooks, agents, skills
    for (const mod of submoduleConfig.modules) {
      const dir = mod.directory;

      // Settings
      expect(files).toContain(`${dir}/.claude/settings.json`);
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, dir, ".claude", "settings.json")
        )
      ).toBe(true);

      // Consolidated pre-edit hook (TDD + Planning in one process)
      expect(files).toContain(`${dir}/.claude/hooks/pre-edit.sh`);
      expect(files).toContain(`${dir}/.claude/hooks/lib/find-test.sh`);
      expect(files).toContain(`${dir}/.claude/hooks/auto-test.sh`);
      expect(files).toContain(`${dir}/.claude/hooks/tdd-eval.sh`);

      // Planning hooks (feature-planning-gate enabled in submoduleConfig)
      expect(files).toContain(`${dir}/.claude/hooks/planning-validator.sh`);
      expect(files).toContain(`${dir}/.claude/hooks/planning-eval.sh`);

      // Hooks should be executable
      const hookStat = await fs.stat(
        path.join(TEST_DIR, dir, ".claude", "hooks", "pre-edit.sh")
      );
      expect(hookStat.mode & 0o111).toBeGreaterThan(0);

      // Rules
      expect(files).toContain(`${dir}/.claude/rules/anti-patterns.md`);
      expect(files).toContain(`${dir}/.claude/rules/scope-responsibilities.md`);

      // Agents
      expect(files).toContain(`${dir}/.claude/agents/${mod.name}-delegate.md`);
      expect(files).toContain(`${dir}/.claude/agents/tdd-test-writer.md`);
      expect(files).toContain(`${dir}/.claude/agents/tdd-implementer.md`);
      expect(files).toContain(`${dir}/.claude/agents/product-owner.md`);

      // Skills
      expect(files).toContain(`${dir}/.claude/skills/tdd/SKILL.md`);
      expect(files).toContain(`${dir}/.claude/skills/plan-feature/SKILL.md`);

      // Agent memory dir
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, dir, ".claude", "agent-memory")
        )
      ).toBe(true);

      // Rule #9: TDD Sequential Enforcement per module
      expect(files).toContain(`${dir}/.claude/rules/tdd/sequential-enforcement.md`);
      expect(
        await fs.pathExists(
          path.join(TEST_DIR, dir, ".claude", "rules", "tdd", "sequential-enforcement.md")
        )
      ).toBe(true);
    }
  });

  it("generates role-specific agents per module", async () => {
    const files = await generateClaudeInfra(TEST_DIR, submoduleConfig);

    // Frontend module should have frontend-specialist and software-architect
    expect(files).toContain("my-app-front/.claude/agents/software-architect.md");
    expect(files).toContain("my-app-front/.claude/agents/frontend-specialist.md");
    // Frontend should NOT have backend-specialist or ai-engineer
    expect(files).not.toContain("my-app-front/.claude/agents/backend-specialist.md");
    expect(files).not.toContain("my-app-front/.claude/agents/ai-engineer.md");

    // Backend module should have backend-specialist and software-architect
    expect(files).toContain("my-app-bff/.claude/agents/software-architect.md");
    expect(files).toContain("my-app-bff/.claude/agents/backend-specialist.md");
    // Backend should NOT have frontend-specialist
    expect(files).not.toContain("my-app-bff/.claude/agents/frontend-specialist.md");

    // Database module should have software-architect only
    expect(files).toContain("my-app-db/.claude/agents/software-architect.md");
    expect(files).not.toContain("my-app-db/.claude/agents/backend-specialist.md");
    expect(files).not.toContain("my-app-db/.claude/agents/frontend-specialist.md");

    // Verify agent file content
    const architect = await fs.readFile(
      path.join(TEST_DIR, "my-app-front", ".claude", "agents", "software-architect.md"),
      "utf-8"
    );
    expect(architect).toContain("Software Architect");
    expect(architect).toContain("front");
  });

  it("generates common skills for all module roles", async () => {
    const files = await generateClaudeInfra(TEST_DIR, submoduleConfig);

    const commonSkills = ["adr", "diagram", "backlog", "acceptance-criteria", "user-story", "tech-review"];

    for (const mod of submoduleConfig.modules) {
      for (const skill of commonSkills) {
        expect(files).toContain(`${mod.directory}/.claude/skills/${skill}/SKILL.md`);
        expect(
          await fs.pathExists(
            path.join(TEST_DIR, mod.directory, ".claude", "skills", skill, "SKILL.md")
          )
        ).toBe(true);
      }
    }
  });

  it("generates role-specific skills per module", async () => {
    const files = await generateClaudeInfra(TEST_DIR, submoduleConfig);

    // Frontend should have component, hook, test, ui-review, accessibility
    expect(files).toContain("my-app-front/.claude/skills/component/SKILL.md");
    expect(files).toContain("my-app-front/.claude/skills/hook/SKILL.md");
    expect(files).toContain("my-app-front/.claude/skills/test/SKILL.md");
    expect(files).toContain("my-app-front/.claude/skills/ui-review/SKILL.md");
    expect(files).toContain("my-app-front/.claude/skills/accessibility/SKILL.md");
    // Frontend should NOT have backend skills
    expect(files).not.toContain("my-app-front/.claude/skills/endpoint/SKILL.md");
    expect(files).not.toContain("my-app-front/.claude/skills/api-review/SKILL.md");

    // Backend should have endpoint, service, api-review
    expect(files).toContain("my-app-bff/.claude/skills/endpoint/SKILL.md");
    expect(files).toContain("my-app-bff/.claude/skills/service/SKILL.md");
    expect(files).toContain("my-app-bff/.claude/skills/api-review/SKILL.md");
    // Backend should NOT have frontend skills
    expect(files).not.toContain("my-app-bff/.claude/skills/component/SKILL.md");
    expect(files).not.toContain("my-app-bff/.claude/skills/hook/SKILL.md");

    // Database has no role-specific skills
    expect(files).not.toContain("my-app-db/.claude/skills/endpoint/SKILL.md");
    expect(files).not.toContain("my-app-db/.claude/skills/component/SKILL.md");
  });

  it("generates core rules for all modules", async () => {
    const files = await generateClaudeInfra(TEST_DIR, submoduleConfig);

    const coreRules = [
      "architecture/patterns.md",
      "code/guidelines.md",
      "skills/auto-invoke.md",
      "validation/post-implementation.md",
    ];

    for (const mod of submoduleConfig.modules) {
      for (const rule of coreRules) {
        expect(files).toContain(`${mod.directory}/.claude/rules/${rule}`);
        expect(
          await fs.pathExists(
            path.join(TEST_DIR, mod.directory, ".claude", "rules", rule)
          )
        ).toBe(true);
      }
    }

    // PO requirements should be generated (feature-planning-gate is enabled)
    expect(files).toContain("my-app-front/.claude/rules/po/requirements.md");
    expect(files).toContain("my-app-bff/.claude/rules/po/requirements.md");
  });

  it("generates agent-ai specific skills for agent role", async () => {
    const agentConfig: ProjectConfig = {
      ...submoduleConfig,
      modules: [
        { name: "agent", role: "agent-ai", directory: "my-app-agent" },
      ],
    };

    const files = await generateClaudeInfra(TEST_DIR, agentConfig);

    // Agent-AI should have rule, tool, agent-create + backend skills
    expect(files).toContain("my-app-agent/.claude/skills/rule/SKILL.md");
    expect(files).toContain("my-app-agent/.claude/skills/tool/SKILL.md");
    expect(files).toContain("my-app-agent/.claude/skills/agent-create/SKILL.md");
    expect(files).toContain("my-app-agent/.claude/skills/endpoint/SKILL.md");
    expect(files).toContain("my-app-agent/.claude/skills/service/SKILL.md");

    // Agent-AI should have ai-engineer and backend-specialist
    expect(files).toContain("my-app-agent/.claude/agents/ai-engineer.md");
    expect(files).toContain("my-app-agent/.claude/agents/backend-specialist.md");
    expect(files).toContain("my-app-agent/.claude/agents/software-architect.md");
  });

  it("does NOT generate per-module .claude/ without submodules", async () => {
    const noGitConfig: ProjectConfig = {
      ...submoduleConfig,
      git: undefined,
    };
    const files = await generateClaudeInfra(TEST_DIR, noGitConfig);

    // Root .claude/ should exist
    expect(files).toContain(".claude/settings.json");

    // Module .claude/ should NOT exist
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, "my-app-front", ".claude")
      )
    ).toBe(false);
  });
});

describe("Stack Registry", () => {
  it("returns correct stacks for each role", () => {
    const frontendStacks = getStacksForRole("frontend");
    expect(frontendStacks).toHaveLength(4);
    expect(frontendStacks.map((s) => s.id)).toEqual([
      "react",
      "vue",
      "angular",
      "svelte",
    ]);

    const backendStacks = getStacksForRole("backend");
    expect(backendStacks).toHaveLength(6);
    expect(backendStacks.map((s) => s.id)).toEqual([
      "nestjs",
      "express",
      "fastify",
      "fastapi",
      "django",
      "flask",
    ]);

    const e2eStacks = getStacksForRole("e2e");
    expect(e2eStacks).toHaveLength(3);

    const dbStacks = getStacksForRole("database");
    expect(dbStacks).toHaveLength(3);

    const aiStacks = getStacksForRole("agent-ai");
    expect(aiStacks).toHaveLength(2);

    const mobileStacks = getStacksForRole("mobile");
    expect(mobileStacks).toHaveLength(2);
  });

  it("returns empty array for roles without stacks", () => {
    expect(getStacksForRole("generic")).toHaveLength(0);
    expect(getStacksForRole("nonexistent")).toHaveLength(0);
  });

  it("finds stack by ID with correct metadata", () => {
    const react = getStackById("react");
    expect(react).toBeDefined();
    expect(react!.label).toBe("React");
    expect(react!.role).toBe("frontend");
    expect(react!.testCommand).toBe("npx vitest run");
    expect(react!.supportingFiles).toEqual(["patterns.md", "testing.md"]);

    const nestjs = getStackById("nestjs");
    expect(nestjs).toBeDefined();
    expect(nestjs!.role).toBe("backend");
    expect(nestjs!.testCommand).toBe("npx jest");

    expect(getStackById("nonexistent")).toBeUndefined();
  });
});

describe("Stack-Aware Skill Generation", () => {
  const stackConfig: ProjectConfig = {
    version: "1.0.0",
    project: {
      name: "stack-test",
      description: "Stack test",
      language: "en",
    },
    modules: [
      { name: "web", role: "frontend", directory: "web", stack: "react" },
      { name: "api", role: "backend", directory: "api", stack: "nestjs" },
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
        "tdd-sequential-enforcement": true,
      },
    },
    git: {
      submodules: true,
      org: "testorg",
      provider: "github",
      prefix: "",
    },
  };

  beforeEach(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it("generates supporting files for modules with stack", async () => {
    const files = await generateClaudeInfra(TEST_DIR, stackConfig);

    // Frontend with React stack should have supporting files
    expect(files).toContain("web/.claude/skills/component/SKILL.md");
    expect(files).toContain("web/.claude/skills/component/patterns.md");
    expect(files).toContain("web/.claude/skills/component/testing.md");

    // Backend with NestJS stack should have supporting files
    expect(files).toContain("api/.claude/skills/endpoint/SKILL.md");
    expect(files).toContain("api/.claude/skills/endpoint/patterns.md");
    expect(files).toContain("api/.claude/skills/endpoint/testing.md");

    // Verify files exist on disk
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, "web", ".claude", "skills", "component", "patterns.md")
      )
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, "api", ".claude", "skills", "endpoint", "patterns.md")
      )
    ).toBe(true);
  });

  it("SKILL.md is stack-agnostic (no hardcoded React)", async () => {
    await generateClaudeInfra(TEST_DIR, stackConfig);
    const skillMd = await fs.readFile(
      path.join(TEST_DIR, "web", ".claude", "skills", "component", "SKILL.md"),
      "utf-8"
    );

    // Should NOT contain React-specific content (moved to patterns.md)
    expect(skillMd).not.toContain("forwardRef");
    expect(skillMd).not.toContain("displayName");

    // Should reference supporting files
    expect(skillMd).toContain("patterns.md");
    expect(skillMd).toContain("React");
  });

  it("patterns.md contains stack-specific content", async () => {
    await generateClaudeInfra(TEST_DIR, stackConfig);
    const patterns = await fs.readFile(
      path.join(TEST_DIR, "web", ".claude", "skills", "component", "patterns.md"),
      "utf-8"
    );

    // React-specific content should be in patterns.md
    expect(patterns).toContain("forwardRef");
    expect(patterns).toContain("cn()");
  });

  it("does NOT generate supporting files without stack (backward compat)", async () => {
    const noStackConfig: ProjectConfig = {
      ...stackConfig,
      modules: [
        { name: "web", role: "frontend", directory: "web" },
        { name: "api", role: "backend", directory: "api" },
      ],
    };
    const files = await generateClaudeInfra(TEST_DIR, noStackConfig);

    // SKILL.md should exist
    expect(files).toContain("web/.claude/skills/component/SKILL.md");

    // Supporting files should NOT exist
    expect(files).not.toContain("web/.claude/skills/component/patterns.md");
    expect(files).not.toContain("web/.claude/skills/component/testing.md");
  });

  it("stack-agnostic skills do NOT get supporting files", async () => {
    const files = await generateClaudeInfra(TEST_DIR, stackConfig);

    // adr, diagram etc are stack-agnostic — no supporting files even with stack
    expect(files).toContain("web/.claude/skills/adr/SKILL.md");
    expect(files).not.toContain("web/.claude/skills/adr/patterns.md");
  });
});
