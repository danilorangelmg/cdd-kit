import path from "path";
import { renderTemplate, templateExists } from "../utils/template-engine.js";
import { writeFile, makeExecutable, ensureDir } from "../utils/fs.js";
import type { ProjectConfig, ModuleConfig } from "../utils/validation.js";
import { getActiveRules } from "../methodology/rules.js";
import { getRoleById } from "../methodology/roles.js";
import { getStackById } from "../methodology/stacks.js";
import { getPathMap } from "../utils/paths.js";

// Role-specific agents mapping (each role gets these specialist agents)
const ROLE_AGENTS: Record<string, string[]> = {
  backend: ["software-architect", "backend-specialist"],
  frontend: ["software-architect", "frontend-specialist"],
  "agent-ai": ["software-architect", "ai-engineer", "backend-specialist"],
  database: ["software-architect"],
  mobile: ["software-architect", "frontend-specialist"],
  e2e: [],
  generic: ["software-architect"],
};

// Common skills (all roles get these)
const COMMON_SKILLS = [
  "adr",
  "diagram",
  "backlog",
  "acceptance-criteria",
  "user-story",
  "tech-review",
];

// Role-specific skills mapping
const ROLE_SKILLS: Record<string, string[]> = {
  backend: ["endpoint", "service", "api-review"],
  frontend: ["component", "hook", "test", "ui-review", "accessibility"],
  "agent-ai": [
    "rule",
    "tool",
    "agent-create",
    "endpoint",
    "service",
    "api-review",
  ],
  database: [],
  mobile: ["component", "hook", "test", "ui-review", "accessibility"],
  e2e: ["test"],
  generic: [],
};

// Core rules for per-module .claude/ (all roles get these)
const CORE_RULES = [
  "architecture/patterns",
  "code/guidelines",
  "skills/auto-invoke",
  "validation/post-implementation",
];

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

  // Hooks (TDD enforcement)
  if (config.methodology.rules["tdd-enforcement"]) {
    // Shared test-finding library
    const findTestLib = renderTemplate(
      "claude/hooks/lib/find-test.sh.hbs",
      context
    );
    const findTestPath = path.join(claudeDir, "hooks", "lib", "find-test.sh");
    await writeFile(findTestPath, findTestLib);
    await makeExecutable(findTestPath);
    generatedFiles.push(".claude/hooks/lib/find-test.sh");

    const hooks = ["tdd-guard.sh", "auto-test.sh", "tdd-eval.sh"];
    for (const hook of hooks) {
      const content = renderTemplate(`claude/hooks/${hook}.hbs`, context);
      const hookPath = path.join(claudeDir, "hooks", hook);
      await writeFile(hookPath, content);
      await makeExecutable(hookPath);
      generatedFiles.push(`.claude/hooks/${hook}`);
    }
  }

  // Hooks (Planning enforcement — Rule #3)
  if (config.methodology.rules["feature-planning-gate"]) {
    const hooks = [
      "planning-gate.sh",
      "planning-validator.sh",
      "planning-eval.sh",
    ];
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

  if (config.methodology.rules["tdd-sequential-enforcement"]) {
    ruleFiles.push("tdd/sequential-enforcement.md");
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
      stack: mod.stack ? getStackById(mod.stack) : undefined,
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
    const skillDir = path.join(claudeDir, "skills", "tdd");
    const sf = await generateSkillWithStack(skillDir, "tdd", context);
    generatedFiles.push(...sf.map((f) => `.claude/skills/tdd/${f}`));
  }

  if (config.methodology.rules["feature-planning-gate"]) {
    const skillDir = path.join(claudeDir, "skills", "plan-feature");
    const sf = await generateSkillWithStack(skillDir, "plan-feature", context);
    generatedFiles.push(...sf.map((f) => `.claude/skills/plan-feature/${f}`));
  }

  // Universal root skills (always generated)
  const universalRootSkills = [
    "git-commit",
    "pr-create",
    "validate-all",
    "deploy-all",
  ];
  for (const skill of universalRootSkills) {
    const skillDir = path.join(claudeDir, "skills", skill);
    const sf = await generateSkillWithStack(skillDir, skill, context);
    generatedFiles.push(...sf.map((f) => `.claude/skills/${skill}/${f}`));
  }

  // Conditional root skills
  const hasFrontend = config.modules.some((m) => m.role === "frontend");
  const hasBackend = config.modules.some(
    (m) => m.role === "backend" || m.role === "agent-ai"
  );

  if (hasFrontend && hasBackend) {
    const skillDir = path.join(claudeDir, "skills", "check-flow");
    const sf = await generateSkillWithStack(skillDir, "check-flow", context);
    generatedFiles.push(...sf.map((f) => `.claude/skills/check-flow/${f}`));
  }

  if (config.methodology.rules["api-response-contract"]) {
    const skillDir = path.join(claudeDir, "skills", "api-contract");
    const sf = await generateSkillWithStack(skillDir, "api-contract", context);
    generatedFiles.push(...sf.map((f) => `.claude/skills/api-contract/${f}`));
  }

  // Verify pipeline
  const verifyPipeline = renderTemplate(
    "claude/verify/pipeline.yaml.hbs",
    context
  );
  await writeFile(
    path.join(claudeDir, "verify", "pipeline.yaml"),
    verifyPipeline
  );
  generatedFiles.push(".claude/verify/pipeline.yaml");

  const verifyRunner = renderTemplate("claude/verify/run.sh.hbs", context);
  const runnerPath = path.join(claudeDir, "verify", "run.sh");
  await writeFile(runnerPath, verifyRunner);
  await makeExecutable(runnerPath);
  generatedFiles.push(".claude/verify/run.sh");

  // Post-dev verify hook
  const postDevVerify = renderTemplate(
    "claude/hooks/post-dev-verify.sh.hbs",
    context
  );
  const postDevPath = path.join(claudeDir, "hooks", "post-dev-verify.sh");
  await writeFile(postDevPath, postDevVerify);
  await makeExecutable(postDevPath);
  generatedFiles.push(".claude/hooks/post-dev-verify.sh");

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

    const stackDef = mod.stack ? getStackById(mod.stack) : undefined;
    const modContext = {
      ...context,
      module: mod,
      role,
      ...(stackDef ? { stack: stackDef } : {}),
    };

    // settings.json (with hooks pointing to module's own .claude/hooks/)
    const settings = renderTemplate("claude/settings.json.hbs", modContext);
    await writeFile(path.join(modClaudeDir, "settings.json"), settings);
    generatedFiles.push(`${prefix}/settings.json`);

    // Hooks (if TDD enabled)
    if (config.methodology.rules["tdd-enforcement"]) {
      // Shared test-finding library
      const findTestLib = renderTemplate(
        "claude/hooks/lib/find-test.sh.hbs",
        modContext
      );
      const findTestPath = path.join(modClaudeDir, "hooks", "lib", "find-test.sh");
      await writeFile(findTestPath, findTestLib);
      await makeExecutable(findTestPath);
      generatedFiles.push(`${prefix}/hooks/lib/find-test.sh`);

      const hooks = ["tdd-guard.sh", "auto-test.sh", "tdd-eval.sh"];
      for (const hook of hooks) {
        const content = renderTemplate(`claude/hooks/${hook}.hbs`, modContext);
        const hookPath = path.join(modClaudeDir, "hooks", hook);
        await writeFile(hookPath, content);
        await makeExecutable(hookPath);
        generatedFiles.push(`${prefix}/hooks/${hook}`);
      }
    }

    // Hooks (Planning enforcement — Rule #3)
    if (config.methodology.rules["feature-planning-gate"]) {
      const hooks = [
        "planning-gate.sh",
        "planning-validator.sh",
        "planning-eval.sh",
      ];
      for (const hook of hooks) {
        const content = renderTemplate(`claude/hooks/${hook}.hbs`, modContext);
        const hookPath = path.join(modClaudeDir, "hooks", hook);
        await writeFile(hookPath, content);
        await makeExecutable(hookPath);
        generatedFiles.push(`${prefix}/hooks/${hook}`);
      }
    }

    // Rules — base rules
    const ruleFiles = ["anti-patterns.md", "scope-responsibilities.md"];
    for (const ruleFile of ruleFiles) {
      const content = renderTemplate(`claude/rules/${ruleFile}.hbs`, modContext);
      await writeFile(path.join(modClaudeDir, "rules", ruleFile), content);
      generatedFiles.push(`${prefix}/rules/${ruleFile}`);
    }

    // Rules — TDD sequential enforcement (if enabled)
    if (config.methodology.rules["tdd-sequential-enforcement"]) {
      const content = renderTemplate(
        "claude/rules/tdd/sequential-enforcement.md.hbs",
        modContext
      );
      await ensureDir(path.join(modClaudeDir, "rules", "tdd"));
      await writeFile(
        path.join(modClaudeDir, "rules", "tdd", "sequential-enforcement.md"),
        content
      );
      generatedFiles.push(`${prefix}/rules/tdd/sequential-enforcement.md`);
    }

    // Rules — core rules (architecture, code, auto-invoke, post-implementation)
    for (const coreRule of CORE_RULES) {
      const content = renderTemplate(
        `claude/rules/${coreRule}.md.hbs`,
        modContext
      );
      const rulePath = `${coreRule}.md`;
      await writeFile(path.join(modClaudeDir, "rules", rulePath), content);
      generatedFiles.push(`${prefix}/rules/${rulePath}`);
    }

    // Rules — PO requirements (when feature-planning-gate enabled)
    if (config.methodology.rules["feature-planning-gate"]) {
      const poRule = renderTemplate(
        "claude/rules/po/requirements.md.hbs",
        modContext
      );
      await writeFile(
        path.join(modClaudeDir, "rules", "po", "requirements.md"),
        poRule
      );
      generatedFiles.push(`${prefix}/rules/po/requirements.md`);
    }

    // Agents — module delegate
    const delegateContent = renderTemplate(
      "claude/agents/delegate.md.hbs",
      modContext
    );
    await writeFile(
      path.join(modClaudeDir, "agents", `${mod.name}-delegate.md`),
      delegateContent
    );
    generatedFiles.push(`${prefix}/agents/${mod.name}-delegate.md`);

    // Agents — role-specific specialists
    const roleAgents = ROLE_AGENTS[mod.role] ?? [];
    for (const agent of roleAgents) {
      const content = renderTemplate(
        `claude/agents/${agent}.md.hbs`,
        modContext
      );
      await writeFile(
        path.join(modClaudeDir, "agents", `${agent}.md`),
        content
      );
      generatedFiles.push(`${prefix}/agents/${agent}.md`);
    }

    // Agents — TDD agents (if enabled)
    if (config.methodology.rules["tdd-enforcement"]) {
      for (const agent of ["tdd-test-writer.md", "tdd-implementer.md"]) {
        const content = renderTemplate(`claude/agents/${agent}.hbs`, modContext);
        await writeFile(path.join(modClaudeDir, "agents", agent), content);
        generatedFiles.push(`${prefix}/agents/${agent}`);
      }
    }

    // Agents — product-owner (if feature gate enabled)
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

    // Skills — common skills (all roles)
    for (const skill of COMMON_SKILLS) {
      const skillDir = path.join(modClaudeDir, "skills", skill);
      const sf = await generateSkillWithStack(skillDir, skill, modContext, mod);
      generatedFiles.push(...sf.map((f) => `${prefix}/skills/${skill}/${f}`));
    }

    // Skills — role-specific skills
    const roleSkills = ROLE_SKILLS[mod.role] ?? [];
    for (const skill of roleSkills) {
      const skillDir = path.join(modClaudeDir, "skills", skill);
      const sf = await generateSkillWithStack(skillDir, skill, modContext, mod);
      generatedFiles.push(...sf.map((f) => `${prefix}/skills/${skill}/${f}`));
    }

    // Skills — TDD (if enabled)
    if (config.methodology.rules["tdd-enforcement"]) {
      const skillDir = path.join(modClaudeDir, "skills", "tdd");
      const sf = await generateSkillWithStack(skillDir, "tdd", modContext, mod);
      generatedFiles.push(...sf.map((f) => `${prefix}/skills/tdd/${f}`));
    }

    // Skills — plan-feature (if feature gate enabled)
    if (config.methodology.rules["feature-planning-gate"]) {
      const skillDir = path.join(modClaudeDir, "skills", "plan-feature");
      const sf = await generateSkillWithStack(
        skillDir,
        "plan-feature",
        modContext,
        mod
      );
      generatedFiles.push(
        ...sf.map((f) => `${prefix}/skills/plan-feature/${f}`)
      );
    }

    // Agent memory
    await ensureDir(path.join(modClaudeDir, "agent-memory"));
  }

  return generatedFiles;
}

async function generateSkillWithStack(
  skillDir: string,
  skill: string,
  context: Record<string, unknown>,
  mod?: ModuleConfig
): Promise<string[]> {
  const files: string[] = [];
  const stackDef = mod?.stack ? getStackById(mod.stack) : undefined;

  const skillContext = {
    ...context,
    ...(mod ? { module: mod } : {}),
    ...(stackDef
      ? { stack: stackDef, stackFiles: stackDef.supportingFiles }
      : {}),
  };

  // 1. Render SKILL.md
  const content = renderTemplate(
    `claude/skills/${skill}/SKILL.md.hbs`,
    skillContext
  );
  await writeFile(path.join(skillDir, "SKILL.md"), content);
  files.push("SKILL.md");

  // 2. Render stack-specific supporting files
  if (mod?.stack && stackDef) {
    for (const sf of stackDef.supportingFiles) {
      const tplPath = `claude/skills/${skill}/stacks/${mod.stack}/${sf}.hbs`;
      if (templateExists(tplPath)) {
        const supportContent = renderTemplate(tplPath, skillContext);
        await writeFile(path.join(skillDir, sf), supportContent);
        files.push(sf);
      }
    }
  }

  return files;
}

function buildAllowPermissions(config: ProjectConfig): string[] {
  const perms = ["Bash(docker compose *)"];
  const roles = new Set(config.modules.map((m) => m.role));

  // Stack-specific test commands
  const addedCommands = new Set<string>();
  for (const mod of config.modules) {
    if (mod.stack) {
      const stackDef = getStackById(mod.stack);
      if (stackDef) {
        const cmd = `Bash(${stackDef.testCommand} *)`;
        if (!addedCommands.has(cmd)) {
          perms.push(cmd);
          addedCommands.add(cmd);
        }
        continue;
      }
    }
    // Fallback: role-based defaults for modules without stack
    if (mod.role === "frontend" || mod.role === "mobile") {
      for (const cmd of [
        "Bash(npx vitest run *)",
        "Bash(npm test *)",
        "Bash(npm run typecheck)",
      ]) {
        if (!addedCommands.has(cmd)) {
          perms.push(cmd);
          addedCommands.add(cmd);
        }
      }
    }
    if (mod.role === "backend" || mod.role === "agent-ai") {
      for (const cmd of ["Bash(python3 -m pytest *)", "Bash(make lint)"]) {
        if (!addedCommands.has(cmd)) {
          perms.push(cmd);
          addedCommands.add(cmd);
        }
      }
    }
  }

  perms.push("Bash(make test *)", "Bash(make verify *)");
  return perms;
}

function buildContext(config: ProjectConfig): Record<string, unknown> {
  const activeRules = getActiveRules(config.methodology.rules);
  const paths = getPathMap(config.project.language);
  return {
    ...config,
    activeRules,
    paths,
    allowPermissions: buildAllowPermissions(config),
    modulesWithRoles: config.modules.map((m) => ({
      ...m,
      roleInfo: getRoleById(m.role),
      stackInfo: m.stack ? getStackById(m.stack) : undefined,
    })),
  };
}
