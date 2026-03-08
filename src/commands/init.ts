import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { runInitPrompts } from "../prompts/init-prompts.js";
import { generateOrchestrator } from "../generators/orchestrator.js";
import { generateAllModules } from "../generators/module.js";
import { generateClaudeInfra } from "../generators/claude-infra.js";
import { generateDocs } from "../generators/docs.js";
import { generateGit } from "../generators/git.js";
import { fileExists, readFile } from "../utils/fs.js";
import { parseGitmodules } from "../utils/gitmodules-parser.js";

export async function initCommand(directory?: string): Promise<void> {
  const projectDir = path.resolve(directory ?? process.cwd());

  // Check if directory already has cdd.json
  if (await fileExists(path.join(projectDir, "cdd.json"))) {
    p.log.error(
      `Directory ${projectDir} already contains a cdd.json. Use ${chalk.bold("cdd add-module")} to add modules.`
    );
    process.exit(1);
  }

  // Detect existing .gitmodules → adopt flow
  const gitmodulesPath = path.join(projectDir, ".gitmodules");
  const hasGitmodules = await fileExists(gitmodulesPath);
  let detectedModules;

  if (hasGitmodules) {
    const content = await readFile(gitmodulesPath);
    detectedModules = parseGitmodules(content);

    if (detectedModules.length > 0) {
      p.log.info(
        chalk.bgYellow(" adopt ") +
          ` Found .gitmodules with ${detectedModules.length} submodule(s)`
      );
    } else {
      detectedModules = undefined;
    }
  }

  const isAdopt = !!detectedModules;
  const config = await runInitPrompts(
    isAdopt ? projectDir : directory,
    detectedModules
  );

  // Resolve project dir (for normal init, use project name as dir)
  const outputDir = isAdopt
    ? projectDir
    : path.resolve(directory ?? config.project.name);

  const spinner = p.spinner();
  const allFiles: string[] = [];

  // Generate orchestrator files
  spinner.start("Generating orchestrator (CLAUDE.md, Makefile, docker-compose)...");
  const orchFiles = await generateOrchestrator(outputDir, config);
  allFiles.push(...orchFiles);
  spinner.stop("Orchestrator files generated");

  // Generate module files
  spinner.start("Generating module CLAUDE.md files...");
  const modFiles = await generateAllModules(outputDir, config);
  allFiles.push(...modFiles);
  spinner.stop("Module files generated");

  // Generate .claude/ infrastructure
  spinner.start("Generating .claude/ infrastructure (hooks, agents, skills, rules)...");
  const claudeFiles = await generateClaudeInfra(outputDir, config);
  allFiles.push(...claudeFiles);
  spinner.stop(".claude/ infrastructure generated");

  // Generate docs structure
  spinner.start("Generating documentation structure...");
  const docFiles = await generateDocs(outputDir, config);
  allFiles.push(...docFiles);
  spinner.stop("Documentation structure generated");

  // Generate git files
  if (config.git?.submodules) {
    if (isAdopt) {
      // Adopt: only generate .gitignore, preserve existing .gitmodules
      spinner.start("Generating .gitignore (preserving existing .gitmodules)...");
      const gitFiles = await generateGit(outputDir, config, { skipGitmodules: true });
      allFiles.push(...gitFiles);
      spinner.stop(".gitignore generated (existing .gitmodules preserved)");
    } else {
      spinner.start("Generating git submodule configuration...");
      const gitFiles = await generateGit(outputDir, config);
      allFiles.push(...gitFiles);
      spinner.stop("Git submodule configuration generated");
    }
  }

  // Summary
  p.log.success(
    chalk.bold(
      isAdopt
        ? `Project ${config.project.name} adopted into CDD!`
        : `Project ${config.project.name} created!`
    )
  );
  p.note(
    allFiles.map((f) => `  ${chalk.green("✓")} ${f}`).join("\n"),
    "Generated files"
  );

  const nextSteps: string[] = [];

  if (!isAdopt) {
    nextSteps.push(
      `cd ${config.project.name}`,
      `git init && git add -A && git commit -m "chore: init cdd project"`
    );
  } else {
    nextSteps.push(
      `git add -A && git commit -m "chore: adopt cdd methodology"`
    );
  }

  if (config.git?.submodules && !isAdopt) {
    nextSteps.push(
      `# Create repos for each submodule, then:`,
      `git submodule update --init --recursive`
    );
  }

  nextSteps.push(`claude  ${chalk.dim("# Open with Claude Code")}`);

  p.outro(
    `${chalk.bold("Next steps:")}\n` +
      nextSteps.map((s) => `  ${s}`).join("\n")
  );
}
