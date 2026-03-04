import path from "path";
import { renderTemplate } from "../utils/template-engine.js";
import { writeFile, makeExecutable, ensureDir } from "../utils/fs.js";
import type { ProjectConfig } from "../utils/validation.js";
import { getActiveRules } from "../methodology/rules.js";
import { getRoleById } from "../methodology/roles.js";
import { getPathMap } from "../utils/paths.js";

export async function generateClaudeInfra(
  projectDir: string,
  config: ProjectConfig
): Promise<string[]> {
  const generatedFiles: string[] = [];
  const claudeDir = path.join(projectDir, ".claude");
  const context = buildContext(config);

  // .claude/settings.json
  const settings = renderTemplate("claude/settings.json.hbs", context);
  await writeFile(path.join(claudeDir, "settings.json"), settings);
  generatedFiles.push(".claude/settings.json");

  // Hooks (only if TDD enforcement is enabled)
  if (config.methodology.rules["tdd-enforcement"]) {
    const hooks = ["tdd-guard.sh", "auto-test.sh", "tdd-eval.sh"];
    for (const hook of hooks) {
      const content = renderTemplate(`claude/hooks/${hook}.hbs`, context);
      const hookPath = path.join(claudeDir, "hooks", hook);
      await writeFile(hookPath, content);
      await makeExecutable(hookPath);
      generatedFiles.push(`.claude/hooks/${hook}`);
    }
  }

  // Rules
  const ruleFiles = [
    "delegation-protocol.md",
    "anti-patterns.md",
    "scope-responsibilities.md",
  ];

  if (config.methodology.rules["feature-planning-gate"]) {
    ruleFiles.push("feature-gate.md");
  }

  for (const ruleFile of ruleFiles) {
    const content = renderTemplate(`claude/rules/${ruleFile}.hbs`, context);
    await writeFile(path.join(claudeDir, "rules", ruleFile), content);
    generatedFiles.push(`.claude/rules/${ruleFile}`);
  }

  // Agents
  // Per-module delegates
  for (const mod of config.modules) {
    const delegateContext = {
      ...context,
      module: mod,
      role: getRoleById(mod.role),
    };
    const content = renderTemplate("claude/agents/delegate.md.hbs", delegateContext);
    await writeFile(
      path.join(claudeDir, "agents", `${mod.name}-delegate.md`),
      content
    );
    generatedFiles.push(`.claude/agents/${mod.name}-delegate.md`);
  }

  // Shared agents
  const sharedAgents = [
    "validator.md",
    "tdd-test-writer.md",
    "tdd-implementer.md",
    "product-owner.md",
  ];

  for (const agent of sharedAgents) {
    // Skip TDD agents if TDD not enabled
    if (
      !config.methodology.rules["tdd-enforcement"] &&
      agent.startsWith("tdd-")
    ) {
      continue;
    }
    // Skip product-owner if feature gate not enabled
    if (
      !config.methodology.rules["feature-planning-gate"] &&
      agent === "product-owner.md"
    ) {
      continue;
    }

    const content = renderTemplate(`claude/agents/${agent}.hbs`, context);
    await writeFile(path.join(claudeDir, "agents", agent), content);
    generatedFiles.push(`.claude/agents/${agent}`);
  }

  // Skills
  if (config.methodology.rules["tdd-enforcement"]) {
    const tddSkill = renderTemplate("claude/skills/tdd/SKILL.md.hbs", context);
    await writeFile(
      path.join(claudeDir, "skills", "tdd", "SKILL.md"),
      tddSkill
    );
    generatedFiles.push(".claude/skills/tdd/SKILL.md");
  }

  if (config.methodology.rules["feature-planning-gate"]) {
    const planSkill = renderTemplate(
      "claude/skills/plan-feature/SKILL.md.hbs",
      context
    );
    await writeFile(
      path.join(claudeDir, "skills", "plan-feature", "SKILL.md"),
      planSkill
    );
    generatedFiles.push(".claude/skills/plan-feature/SKILL.md");
  }

  // Agent memory directories
  await ensureDir(path.join(claudeDir, "agent-memory"));
  await ensureDir(path.join(claudeDir, "project-memory"));

  // Per-module .claude/ infrastructure (for submodules — each is an independent repo)
  if (config.git?.submodules) {
    const moduleFiles = await generatePerModuleClaudeInfra(
      projectDir,
      config,
      context
    );
    generatedFiles.push(...moduleFiles);
  }

  return generatedFiles;
}

async function generatePerModuleClaudeInfra(
  projectDir: string,
  config: ProjectConfig,
  context: Record<string, unknown>
): Promise<string[]> {
  const generatedFiles: string[] = [];

  for (const mod of config.modules) {
    const modClaudeDir = path.join(projectDir, mod.directory, ".claude");
    const prefix = `${mod.directory}/.claude`;
    const role = getRoleById(mod.role);

    const modContext = {
      ...context,
      module: mod,
      role,
    };

    // settings.json (with hooks pointing to module's own .claude/hooks/)
    const settings = renderTemplate("claude/settings.json.hbs", modContext);
    await writeFile(path.join(modClaudeDir, "settings.json"), settings);
    generatedFiles.push(`${prefix}/settings.json`);

    // Hooks (if TDD enabled)
    if (config.methodology.rules["tdd-enforcement"]) {
      const hooks = ["tdd-guard.sh", "auto-test.sh", "tdd-eval.sh"];
      for (const hook of hooks) {
        const content = renderTemplate(`claude/hooks/${hook}.hbs`, modContext);
        const hookPath = path.join(modClaudeDir, "hooks", hook);
        await writeFile(hookPath, content);
        await makeExecutable(hookPath);
        generatedFiles.push(`${prefix}/hooks/${hook}`);
      }
    }

    // Rules
    const ruleFiles = ["anti-patterns.md", "scope-responsibilities.md"];
    for (const ruleFile of ruleFiles) {
      const content = renderTemplate(`claude/rules/${ruleFile}.hbs`, modContext);
      await writeFile(path.join(modClaudeDir, "rules", ruleFile), content);
      generatedFiles.push(`${prefix}/rules/${ruleFile}`);
    }

    // Agents — module delegate + shared agents
    const delegateContent = renderTemplate(
      "claude/agents/delegate.md.hbs",
      modContext
    );
    await writeFile(
      path.join(modClaudeDir, "agents", `${mod.name}-delegate.md`),
      delegateContent
    );
    generatedFiles.push(`${prefix}/agents/${mod.name}-delegate.md`);

    if (config.methodology.rules["tdd-enforcement"]) {
      for (const agent of ["tdd-test-writer.md", "tdd-implementer.md"]) {
        const content = renderTemplate(`claude/agents/${agent}.hbs`, modContext);
        await writeFile(path.join(modClaudeDir, "agents", agent), content);
        generatedFiles.push(`${prefix}/agents/${agent}`);
      }
    }

    if (config.methodology.rules["feature-planning-gate"]) {
      const poContent = renderTemplate(
        "claude/agents/product-owner.md.hbs",
        modContext
      );
      await writeFile(
        path.join(modClaudeDir, "agents", "product-owner.md"),
        poContent
      );
      generatedFiles.push(`${prefix}/agents/product-owner.md`);
    }

    // Skills
    if (config.methodology.rules["tdd-enforcement"]) {
      const tddSkill = renderTemplate(
        "claude/skills/tdd/SKILL.md.hbs",
        modContext
      );
      await writeFile(
        path.join(modClaudeDir, "skills", "tdd", "SKILL.md"),
        tddSkill
      );
      generatedFiles.push(`${prefix}/skills/tdd/SKILL.md`);
    }

    if (config.methodology.rules["feature-planning-gate"]) {
      const planSkill = renderTemplate(
        "claude/skills/plan-feature/SKILL.md.hbs",
        modContext
      );
      await writeFile(
        path.join(modClaudeDir, "skills", "plan-feature", "SKILL.md"),
        planSkill
      );
      generatedFiles.push(`${prefix}/skills/plan-feature/SKILL.md`);
    }

    // Agent memory
    await ensureDir(path.join(modClaudeDir, "agent-memory"));
  }

  return generatedFiles;
}

function buildContext(config: ProjectConfig): Record<string, unknown> {
  const activeRules = getActiveRules(config.methodology.rules);
  const paths = getPathMap(config.project.language);
  return {
    ...config,
    activeRules,
    paths,
    modulesWithRoles: config.modules.map((m) => ({
      ...m,
      roleInfo: getRoleById(m.role),
    })),
  };
}
