import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { runInitPrompts } from "../prompts/init-prompts.js";
import { generateOrchestrator } from "../generators/orchestrator.js";
import { generateAllModules } from "../generators/module.js";
import { generateClaudeInfra } from "../generators/claude-infra.js";
import { generateDocs } from "../generators/docs.js";
import { fileExists } from "../utils/fs.js";

export async function initCommand(directory?: string): Promise<void> {
  const config = await runInitPrompts(directory);

  const projectDir = path.resolve(
    directory ?? config.project.name
  );

  // Check if directory already has cdd.json
  if (await fileExists(path.join(projectDir, "cdd.json"))) {
    p.log.error(
      `Directory ${projectDir} already contains a cdd.json. Use ${chalk.bold("cdd add-module")} to add modules.`
    );
    process.exit(1);
  }

  const spinner = p.spinner();
  const allFiles: string[] = [];

  // Generate orchestrator files
  spinner.start("Generating orchestrator (CLAUDE.md, Makefile, docker-compose)...");
  const orchFiles = await generateOrchestrator(projectDir, config);
  allFiles.push(...orchFiles);
  spinner.stop("Orchestrator files generated");

  // Generate module files
  spinner.start("Generating module CLAUDE.md files...");
  const modFiles = await generateAllModules(projectDir, config);
  allFiles.push(...modFiles);
  spinner.stop("Module files generated");

  // Generate .claude/ infrastructure
  spinner.start("Generating .claude/ infrastructure (hooks, agents, skills, rules)...");
  const claudeFiles = await generateClaudeInfra(projectDir, config);
  allFiles.push(...claudeFiles);
  spinner.stop(".claude/ infrastructure generated");

  // Generate docs structure
  spinner.start("Generating documentation structure...");
  const docFiles = await generateDocs(projectDir, config);
  allFiles.push(...docFiles);
  spinner.stop("Documentation structure generated");

  // Summary
  p.log.success(chalk.bold(`Project ${config.project.name} created!`));
  p.note(
    allFiles.map((f) => `  ${chalk.green("✓")} ${f}`).join("\n"),
    "Generated files"
  );

  p.outro(
    `${chalk.bold("Next steps:")}\n` +
      `  cd ${config.project.name}\n` +
      `  git init && git add -A && git commit -m "chore: init cdd project"\n` +
      `  claude  ${chalk.dim("# Open with Claude Code")}`
  );
}
