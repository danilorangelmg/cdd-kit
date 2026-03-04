import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { readJson, fileExists } from "../utils/fs.js";
import { validateConfig } from "../utils/validation.js";
import type { ProjectConfig } from "../utils/validation.js";

interface Check {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

export async function doctorCommand(): Promise<void> {
  const projectDir = process.cwd();
  const configPath = path.join(projectDir, "cdd.json");

  p.intro(chalk.bgCyan(" cdd doctor "));

  const checks: Check[] = [];

  // 1. cdd.json exists and is valid
  if (!(await fileExists(configPath))) {
    p.log.error(
      `No cdd.json found. Run ${chalk.bold("cdd init")} to create a project.`
    );
    process.exit(1);
  }

  let config: ProjectConfig;
  try {
    const rawConfig = await readJson<unknown>(configPath);
    config = validateConfig(rawConfig);
    checks.push({ name: "cdd.json", status: "pass", message: "Valid" });
  } catch (e) {
    checks.push({
      name: "cdd.json",
      status: "fail",
      message: `Invalid: ${(e as Error).message}`,
    });
    printResults(checks);
    return;
  }

  // 2. Root CLAUDE.md
  checks.push(
    await checkFile(projectDir, "CLAUDE.md", "Root CLAUDE.md")
  );

  // 3. Makefile
  checks.push(await checkFile(projectDir, "Makefile", "Makefile"));

  // 4. Module CLAUDE.md files
  for (const mod of config.modules) {
    checks.push(
      await checkFile(
        projectDir,
        path.join(mod.directory, "CLAUDE.md"),
        `${mod.name}/CLAUDE.md`
      )
    );
  }

  // 5. Module delegate agents
  for (const mod of config.modules) {
    checks.push(
      await checkFile(
        projectDir,
        path.join(".claude", "agents", `${mod.name}-delegate.md`),
        `Agent: ${mod.name}-delegate`
      )
    );
  }

  // 6. Hooks (if TDD enabled)
  if (config.methodology.rules["tdd-enforcement"]) {
    const hooks = ["tdd-guard.sh", "auto-test.sh", "tdd-eval.sh"];
    for (const hook of hooks) {
      checks.push(
        await checkFile(
          projectDir,
          path.join(".claude", "hooks", hook),
          `Hook: ${hook}`
        )
      );
    }
  }

  // 7. Rules
  const rules = ["delegation-protocol.md", "scope-responsibilities.md", "anti-patterns.md"];
  for (const rule of rules) {
    checks.push(
      await checkFile(
        projectDir,
        path.join(".claude", "rules", rule),
        `Rule: ${rule}`
      )
    );
  }

  if (config.methodology.rules["feature-planning-gate"]) {
    checks.push(
      await checkFile(
        projectDir,
        path.join(".claude", "rules", "feature-gate.md"),
        "Rule: feature-gate.md"
      )
    );
  }

  // 8. Skills
  if (config.methodology.rules["tdd-enforcement"]) {
    checks.push(
      await checkFile(
        projectDir,
        path.join(".claude", "skills", "tdd", "SKILL.md"),
        "Skill: /tdd"
      )
    );
  }

  if (config.methodology.rules["feature-planning-gate"]) {
    checks.push(
      await checkFile(
        projectDir,
        path.join(".claude", "skills", "plan-feature", "SKILL.md"),
        "Skill: /plan-feature"
      )
    );
  }

  // 9. Shared agents
  checks.push(
    await checkFile(
      projectDir,
      path.join(".claude", "agents", "validator.md"),
      "Agent: validator"
    )
  );

  printResults(checks);
}

async function checkFile(
  projectDir: string,
  relativePath: string,
  label: string
): Promise<Check> {
  const exists = await fileExists(path.join(projectDir, relativePath));
  return {
    name: label,
    status: exists ? "pass" : "fail",
    message: exists ? "OK" : `Missing: ${relativePath}`,
  };
}

function printResults(checks: Check[]): void {
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;

  const lines = checks.map((c) => {
    const icon =
      c.status === "pass" ? chalk.green("✓") :
      c.status === "warn" ? chalk.yellow("⚠") :
      chalk.red("✗");
    const msg =
      c.status === "pass" ? chalk.dim(c.message) :
      c.status === "warn" ? chalk.yellow(c.message) :
      chalk.red(c.message);
    return `  ${icon} ${c.name}: ${msg}`;
  });

  p.note(lines.join("\n"), "Health Check");

  if (failed === 0) {
    p.outro(chalk.green(`All ${passed} checks passed!`));
  } else {
    p.outro(
      chalk.red(`${failed} check(s) failed`) +
        (warned > 0 ? `, ${warned} warning(s)` : "") +
        `. Run ${chalk.bold("cdd init")} or ${chalk.bold("cdd add-module")} to fix.`
    );
    process.exit(1);
  }
}
