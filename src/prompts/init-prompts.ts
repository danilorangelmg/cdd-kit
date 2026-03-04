import * as p from "@clack/prompts";
import chalk from "chalk";
import { PRESETS } from "../methodology/presets.js";
import { ROLES } from "../methodology/roles.js";
import { RULES } from "../methodology/rules.js";
import type { ModuleConfig, ProjectConfig } from "../utils/validation.js";

export async function runInitPrompts(
  targetDir?: string
): Promise<ProjectConfig> {
  p.intro(chalk.bgCyan(" cdd ") + " Copilot-Driven Development");

  // Step 1: Project info
  const projectGroup = await p.group(
    {
      name: () =>
        p.text({
          message: "Project name:",
          placeholder: "my-project",
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
  let addMore = true;

  p.log.info(chalk.bold("Project modules"));
  p.log.message(
    "Add your project modules (sub-services). Each module gets its own CLAUDE.md and delegate agent."
  );

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

    modules.push({
      name: mod.name as string,
      role: mod.role as ModuleConfig["role"],
      directory: mod.name as string,
    });

    p.log.success(`Module ${chalk.bold(mod.name)} (${mod.role}) added.`);

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

  if (modules.length === 0) {
    p.log.warn("No modules added. Adding a generic module.");
    modules.push({ name: "app", role: "generic", directory: "app" });
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

  p.note(
    [
      `Project: ${chalk.bold(projectGroup.name)}`,
      `Modules: ${modules.map((m) => `${m.name} (${m.role})`).join(", ")}`,
      `Rules: ${activeRuleNames.join(", ")}`,
    ].join("\n"),
    "Summary"
  );

  const confirmed = await p.confirm({
    message: "Confirm and generate project?",
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
  };
}
