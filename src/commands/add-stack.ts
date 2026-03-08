import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { getStacksForRole, getStackById } from "../methodology/stacks.js";
import { generateClaudeInfra } from "../generators/claude-infra.js";
import { generateModule } from "../generators/module.js";
import { readJson, writeJson, fileExists } from "../utils/fs.js";
import type { ModuleConfig } from "../utils/validation.js";
import { validateConfig } from "../utils/validation.js";

export async function addStackCommand(): Promise<void> {
  const projectDir = process.cwd();
  const configPath = path.join(projectDir, "cdd.json");

  if (!(await fileExists(configPath))) {
    p.log.error(
      `No cdd.json found in current directory. Run ${chalk.bold("cdd init")} first.`
    );
    process.exit(1);
  }

  const rawConfig = await readJson<unknown>(configPath);
  const config = validateConfig(rawConfig);

  p.intro(chalk.bgCyan(" cdd add-stack "));

  // Pick module
  const moduleChoice = await p.select({
    message: "Which module?",
    options: config.modules.map((m) => ({
      value: m.name,
      label: `${m.name} (${m.role})`,
      hint: m.stack
        ? `Current stack: ${m.stack}`
        : "No stack configured",
    })),
  });

  if (p.isCancel(moduleChoice)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  const mod = config.modules.find(
    (m) => m.name === moduleChoice
  ) as ModuleConfig;
  const stacksForRole = getStacksForRole(mod.role);

  if (stacksForRole.length === 0) {
    p.log.warn(
      `No stacks available for role "${mod.role}". Only these roles have stacks: frontend, backend, mobile, e2e, database, agent-ai.`
    );
    p.outro("Nothing to do.");
    return;
  }

  // Pick stack
  const stackChoice = await p.select({
    message: `Stack for ${mod.name} (${mod.role}):`,
    options: [
      ...stacksForRole.map((s) => ({
        value: s.id,
        label: s.label,
        hint: s.description,
      })),
      {
        value: "_none",
        label: "Remove stack",
        hint: "Remove stack-specific patterns",
      },
    ],
  });

  if (p.isCancel(stackChoice)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  // Update config
  if (stackChoice === "_none") {
    delete mod.stack;
  } else {
    mod.stack = stackChoice as string;
  }

  const spinner = p.spinner();

  // Regenerate .claude/ infrastructure (skills with supporting files)
  spinner.start("Regenerating skills with stack patterns...");
  await generateClaudeInfra(projectDir, config);
  spinner.stop("Skills regenerated");

  // Regenerate module CLAUDE.md
  spinner.start(`Updating ${mod.name} module...`);
  await generateModule(projectDir, config, mod);
  spinner.stop(`Module ${mod.name} updated`);

  // Save updated config
  await writeJson(configPath, config);

  const stackLabel =
    stackChoice === "_none"
      ? "removed"
      : getStackById(stackChoice as string)?.label ?? stackChoice;

  p.log.success(
    `Stack ${chalk.bold(stackLabel)} applied to module ${chalk.bold(mod.name)}.`
  );
  p.outro("All project files have been updated.");
}
