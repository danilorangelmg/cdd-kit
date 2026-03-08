import * as p from "@clack/prompts";
import chalk from "chalk";
import { PRESETS } from "../methodology/presets.js";
import { ROLES } from "../methodology/roles.js";
import { RULES } from "../methodology/rules.js";
import { getStacksForRole } from "../methodology/stacks.js";
import type {
  ModuleConfig,
  GitConfig,
  ProjectConfig,
} from "../utils/validation.js";
import type { GitmoduleEntry } from "../utils/gitmodules-parser.js";
import { parseGitUrl, detectCommonPrefix } from "../utils/gitmodules-parser.js";

async function promptStackForRole(
  moduleName: string,
  roleId: string
): Promise<string | undefined> {
  const stacksForRole = getStacksForRole(roleId);
  if (stacksForRole.length === 0) return undefined;

  const stackChoice = await p.select({
    message: `Stack for ${moduleName}:`,
    options: [
      ...stacksForRole.map((s) => ({
        value: s.id,
        label: s.label,
        hint: s.description,
      })),
      {
        value: "_none",
        label: "None / Custom",
        hint: "No stack-specific patterns",
      },
    ],
  });

  if (p.isCancel(stackChoice)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return stackChoice !== "_none" ? (stackChoice as string) : undefined;
}

export async function runInitPrompts(
  targetDir?: string,
  detectedModules?: GitmoduleEntry[]
): Promise<ProjectConfig> {
  const isAdopt = detectedModules && detectedModules.length > 0;

  p.intro(
    chalk.bgCyan(" cdd ") +
      (isAdopt
        ? " Adopting existing project into CDD"
        : " Copilot-Driven Development")
  );

  // Step 1: Project info
  const projectGroup = await p.group(
    {
      name: () =>
        p.text({
          message: "Project name:",
          placeholder: "my-project",
          ...(isAdopt && targetDir
            ? { initialValue: targetDir.split("/").pop() || "" }
            : {}),
          validate: (v) => {
            if (!v.trim()) return "Name is required";
            if (!/^[a-z0-9-]+$/.test(v))
              return "Use only lowercase letters, numbers and hyphens";
          },
        }),
      description: () =>
        p.text({
          message: "Short description:",
          placeholder: "Order management system",
        }),
      language: () =>
        p.select({
          message: "Documentation language:",
          options: [
            { value: "en", label: "English (default)" },
            { value: "pt-BR", label: "Portugues BR" },
            { value: "es", label: "Español" },
          ],
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  // Step 2: Modules
  const modules: ModuleConfig[] = [];
  let gitConfig: GitConfig | undefined;

  if (isAdopt) {
    // --- ADOPT FLOW: detected submodules ---
    p.log.info(chalk.bold(`Detected ${detectedModules.length} submodule(s):`));
    for (const entry of detectedModules) {
      p.log.message(`  ${chalk.cyan(entry.name)} → ${entry.path} (${entry.url})`);
    }

    // Assign role and stack for each detected submodule
    for (const entry of detectedModules) {
      p.log.info(chalk.bold(`Module: ${entry.name}`));

      const role = await p.select({
        message: `Role for ${entry.name}:`,
        options: ROLES.map((r) => ({
          value: r.id,
          label: r.label,
          hint: r.description,
        })),
      });

      if (p.isCancel(role)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      const stack = await promptStackForRole(entry.name, role as string);

      modules.push({
        name: entry.name,
        role: role as ModuleConfig["role"],
        directory: entry.path,
        ...(stack ? { stack } : {}),
      });

      p.log.success(
        `Module ${chalk.bold(entry.name)} (${role}${stack ? ` / ${stack}` : ""}) configured.`
      );
    }

    // Ask to add extra modules
    const addExtra = await p.confirm({
      message: "Add extra modules (non-submodule)?",
      initialValue: false,
    });

    if (p.isCancel(addExtra)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (addExtra) {
      await collectModulesLoop(modules);
    }

    // Auto-extract GitConfig from submodule URLs
    gitConfig = extractGitConfig(detectedModules) ?? undefined;

    if (!gitConfig) {
      // Fallback: ask manually
      p.log.warn("Could not auto-detect git configuration from submodule URLs.");
      gitConfig = await promptGitConfig(projectGroup.name as string);
    } else {
      p.log.success(
        `Git config detected: ${gitConfig.provider}, org: ${chalk.bold(gitConfig.org)}, prefix: "${gitConfig.prefix}"`
      );
    }
  } else {
    // --- NORMAL INIT FLOW ---
    p.log.info(chalk.bold("Project modules"));
    p.log.message(
      "Add your project modules (sub-services). Each module gets its own CLAUDE.md and delegate agent."
    );

    await collectModulesLoop(modules);

    if (modules.length === 0) {
      p.log.warn("No modules added. Adding a generic module.");
      modules.push({ name: "app", role: "generic", directory: "app" });
    }

    // Step 2.5: Git submodules
    const useSubmodules = await p.confirm({
      message: "Use git submodules? (each module as independent repo)",
      initialValue: false,
    });

    if (p.isCancel(useSubmodules)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (useSubmodules) {
      gitConfig = await promptGitConfig(projectGroup.name as string);

      // Override module directories with prefix
      for (const mod of modules) {
        mod.directory = `${gitConfig.prefix}${mod.name}`;
      }

      // Show computed repos
      const providerDomain =
        gitConfig.provider === "github"
          ? "github.com"
          : gitConfig.provider === "gitlab"
            ? "gitlab.com"
            : "bitbucket.org";

      p.log.info(chalk.bold("Submodule repositories:"));
      for (const mod of modules) {
        p.log.message(
          `  ${mod.name} → git@${providerDomain}:${gitConfig.org}/${mod.directory}.git`
        );
      }
    }
  }

  // Step 3: Methodology preset
  const presetChoice = await p.select({
    message: "Methodology preset:",
    options: [
      ...PRESETS.map((preset) => ({
        value: preset.id,
        label: preset.label,
        hint: preset.description,
      })),
      {
        value: "custom",
        label: "Custom",
        hint: "Pick rules individually",
      },
    ],
  });

  if (p.isCancel(presetChoice)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let rules: Record<string, boolean>;
  let presetId: string;

  if (presetChoice === "custom") {
    presetId = "custom";
    const customizableRules = RULES.filter((r) => !r.alwaysActive);

    const selectedRules = await p.multiselect({
      message: "Which methodology components to enable?",
      options: customizableRules.map((r) => ({
        value: r.id,
        label: `Rule #${r.number} — ${r.name}`,
        hint: r.description,
      })),
      required: false,
    });

    if (p.isCancel(selectedRules)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    const selected = selectedRules as string[];
    rules = {};
    for (const rule of RULES) {
      rules[rule.id] = rule.alwaysActive || selected.includes(rule.id);
    }
  } else {
    presetId = presetChoice as string;
    const preset = PRESETS.find((p) => p.id === presetChoice)!;
    rules = { ...preset.rules };
  }

  // Summary
  const activeRuleNames = RULES.filter(
    (r) => r.alwaysActive || rules[r.id]
  ).map((r) => `#${r.number} ${r.name}`);

  const summaryLines = [
    `Project: ${chalk.bold(projectGroup.name)}`,
    `Modules: ${modules.map((m) => `${m.name} (${m.role})`).join(", ")}`,
    `Rules: ${activeRuleNames.join(", ")}`,
  ];

  if (gitConfig) {
    summaryLines.push(`Git: submodules (${gitConfig.provider}, org: ${gitConfig.org})`);
  }

  if (isAdopt) {
    summaryLines.push(chalk.yellow("Mode: adopt (existing project, .gitmodules preserved)"));
  }

  p.note(summaryLines.join("\n"), "Summary");

  const confirmed = await p.confirm({
    message: isAdopt ? "Confirm and generate CDD infrastructure?" : "Confirm and generate project?",
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return {
    version: "1.0.0",
    project: {
      name: projectGroup.name as string,
      description: (projectGroup.description as string) || "",
      language: projectGroup.language as string,
    },
    modules,
    methodology: {
      preset: presetId,
      rules,
    },
    ...(gitConfig ? { git: gitConfig } : {}),
  };
}

// --- Helper functions ---

async function collectModulesLoop(modules: ModuleConfig[]): Promise<void> {
  let addMore = true;

  while (addMore) {
    const mod = await p.group(
      {
        name: () =>
          p.text({
            message: `Module ${modules.length + 1} name:`,
            placeholder: "frontend",
            validate: (v) => {
              if (!v.trim()) return "Name is required";
              if (modules.some((m) => m.name === v))
                return "A module with this name already exists";
            },
          }),
        role: () =>
          p.select({
            message: "Module role:",
            options: ROLES.map((r) => ({
              value: r.id,
              label: r.label,
              hint: r.description,
            })),
          }),
      },
      {
        onCancel: () => {
          p.cancel("Operation cancelled.");
          process.exit(0);
        },
      }
    );

    const stack = await promptStackForRole(mod.name as string, mod.role as string);

    modules.push({
      name: mod.name as string,
      role: mod.role as ModuleConfig["role"],
      directory: mod.name as string,
      ...(stack ? { stack } : {}),
    });

    p.log.success(
      `Module ${chalk.bold(mod.name)} (${mod.role}${stack ? ` / ${stack}` : ""}) added.`
    );

    const continueAdding = await p.confirm({
      message: "Add another module?",
      initialValue: modules.length < 2,
    });

    if (p.isCancel(continueAdding)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    addMore = continueAdding as boolean;
  }
}

async function promptGitConfig(projectName: string): Promise<GitConfig> {
  const gitGroup = await p.group(
    {
      org: () =>
        p.text({
          message: "Git organization/owner:",
          placeholder: "my-org",
          validate: (v) => {
            if (!v.trim()) return "Organization is required";
          },
        }),
      provider: () =>
        p.select({
          message: "Git provider:",
          options: [
            { value: "github", label: "GitHub" },
            { value: "gitlab", label: "GitLab" },
            { value: "bitbucket", label: "Bitbucket" },
          ],
        }),
      prefix: () =>
        p.text({
          message: "Repository prefix (leave blank for none):",
          placeholder: `${projectName}-`,
          initialValue: `${projectName}-`,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  return {
    submodules: true,
    org: gitGroup.org as string,
    provider: gitGroup.provider as GitConfig["provider"],
    prefix: (gitGroup.prefix as string) || "",
  };
}

function extractGitConfig(entries: GitmoduleEntry[]): GitConfig | null {
  if (entries.length === 0) return null;

  // Parse first URL to get provider and org
  const parsed = parseGitUrl(entries[0].url);
  if (!parsed) return null;

  // Detect common prefix from repo names
  const repoNames = entries
    .map((e) => {
      const p = parseGitUrl(e.url);
      return p?.repo ?? e.path;
    });

  const prefix = detectCommonPrefix(repoNames);

  return {
    submodules: true,
    org: parsed.org,
    provider: parsed.provider,
    prefix,
  };
}
