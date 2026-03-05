import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs-extra";
import { generateOrchestrator } from "../../src/generators/orchestrator.js";
import { generateAllModules } from "../../src/generators/module.js";
import { generateClaudeInfra } from "../../src/generators/claude-infra.js";
import { generateDocs } from "../../src/generators/docs.js";
import { generateGit } from "../../src/generators/git.js";
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
  });

  it("generates English documentation structure", async () => {
    const files = await generateDocs(TEST_DIR, standardConfig);

    // English directory names
    expect(files).toContain("docs/changelog/");
    expect(files).toContain("docs/rules/");
    expect(files).toContain("docs/templates/feature-planning.md");
    expect(files).toContain("docs/templates/changelog-entry.md");

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

    expect(files).not.toContain(".claude/hooks/tdd-guard.sh");
    expect(files).not.toContain(".claude/hooks/auto-test.sh");
    expect(files).not.toContain(".claude/skills/tdd/SKILL.md");
    expect(files).not.toContain(".claude/agents/tdd-test-writer.md");
    expect(files).not.toContain(".claude/agents/tdd-implementer.md");
    expect(files).not.toContain(".claude/rules/tdd/sequential-enforcement.md");
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

    // Portuguese directory names
    expect(files).toContain("documentos/change-log/");
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

      // TDD hooks (TDD is enabled in submoduleConfig)
      expect(files).toContain(`${dir}/.claude/hooks/tdd-guard.sh`);
      expect(files).toContain(`${dir}/.claude/hooks/auto-test.sh`);
      expect(files).toContain(`${dir}/.claude/hooks/tdd-eval.sh`);

      // Hooks should be executable
      const hookStat = await fs.stat(
        path.join(TEST_DIR, dir, ".claude", "hooks", "tdd-guard.sh")
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
