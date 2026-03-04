import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { ROLES } from "../methodology/roles.js";
import { generateModule } from "../generators/module.js";
import { generateClaudeInfra } from "../generators/claude-infra.js";
import { generateOrchestrator } from "../generators/orchestrator.js";
import { generateDocs } from "../generators/docs.js";
import { readJson, writeJson, fileExists } from "../utils/fs.js";
import type { ProjectConfig, ModuleConfig } from "../utils/validation.js";
import { validateConfig } from "../utils/validation.js";

export async function addModuleCommand(): Promise<void> {
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

  p.intro(chalk.bgCyan(" cdd add-module "));

  const mod = await p.group(
    {
      name: () =>
        p.text({
          message: "Module name:",
          placeholder: "new-module",
          validate: (v) => {
            if (!v.trim()) return "Name required";
            if (config.modules.some((m) => m.name === v))
              return "Module already exists";
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
        p.cancel("Cancelled.");
        process.exit(0);
      },
    }
  );

  const newModule: ModuleConfig = {
    name: mod.name as string,
    role: mod.role as ModuleConfig["role"],
    directory: mod.name as string,
  };

  // Add to config
  config.modules.push(newModule);

  const spinner = p.spinner();

  // Regenerate module
  spinner.start(`Generating ${newModule.name} module...`);
  await generateModule(projectDir, config, newModule);
  spinner.stop(`Module ${newModule.name} generated`);

  // Regenerate root files (CLAUDE.md, Makefile, etc.)
  spinner.start("Updating orchestrator files...");
  await generateOrchestrator(projectDir, config);
  spinner.stop("Orchestrator files updated");

  // Regenerate .claude/ (new delegate agent, updated settings)
  spinner.start("Updating .claude/ infrastructure...");
  await generateClaudeInfra(projectDir, config);
  spinner.stop(".claude/ infrastructure updated");

  // Update docs structure
  spinner.start("Updating documentation structure...");
  await generateDocs(projectDir, config);
  spinner.stop("Documentation structure updated");

  // Save updated config
  await writeJson(configPath, config);

  p.log.success(
    `Module ${chalk.bold(newModule.name)} (${newModule.role}) added successfully.`
  );
  p.outro("All project files have been updated.");
}
