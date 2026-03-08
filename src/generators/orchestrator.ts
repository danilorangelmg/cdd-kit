import path from "path";
import { renderTemplate } from "../utils/template-engine.js";
import { writeFile } from "../utils/fs.js";
import type { ProjectConfig } from "../utils/validation.js";
import { getActiveRules } from "../methodology/rules.js";
import { getRoleById } from "../methodology/roles.js";
import { getPathMap } from "../utils/paths.js";
import { getSubmoduleUrl } from "./git.js";

export async function generateOrchestrator(
  projectDir: string,
  config: ProjectConfig
): Promise<string[]> {
  const generatedFiles: string[] = [];
  const context = buildContext(config);

  // Root CLAUDE.md
  const claudeMd = renderTemplate("root/CLAUDE.md.hbs", context);
  await writeFile(path.join(projectDir, "CLAUDE.md"), claudeMd);
  generatedFiles.push("CLAUDE.md");

  // Makefile
  const makefile = renderTemplate("root/Makefile.hbs", context);
  await writeFile(path.join(projectDir, "Makefile"), makefile);
  generatedFiles.push("Makefile");

  // docker-compose.yml
  const compose = renderTemplate("root/docker-compose.yml.hbs", context);
  await writeFile(path.join(projectDir, "docker-compose.yml"), compose);
  generatedFiles.push("docker-compose.yml");

  // .env.example
  const env = renderTemplate("root/.env.example.hbs", context);
  await writeFile(path.join(projectDir, ".env.example"), env);
  generatedFiles.push(".env.example");

  // cdd.json
  const { writeJson } = await import("../utils/fs.js");
  await writeJson(path.join(projectDir, "cdd.json"), config);
  generatedFiles.push("cdd.json");

  return generatedFiles;
}

function buildContext(config: ProjectConfig): Record<string, unknown> {
  const isPtBr = config.project.language === "pt-BR";
  const activeRules = getActiveRules(config.methodology.rules).map((rule) => ({
    ...rule,
    name: isPtBr ? rule.namePtBr : rule.name,
    description: isPtBr ? rule.descriptionPtBr : rule.description,
  }));
  const modulesWithRoles = config.modules.map((m) => ({
    ...m,
    roleInfo: getRoleById(m.role),
  }));
  const paths = getPathMap(config.project.language);

  // Compute submodule entries for templates
  const submoduleEntries = config.git?.submodules
    ? config.modules.map((m) => ({
        name: m.name,
        directory: m.directory,
        url: getSubmoduleUrl(
          config.git!.provider,
          config.git!.org,
          m.directory
        ),
      }))
    : [];

  return {
    ...config,
    activeRules,
    modulesWithRoles,
    paths,
    submoduleEntries,
    hasBackend: config.modules.some(
      (m) => m.role === "backend" || m.role === "agent-ai"
    ),
    hasFrontend: config.modules.some(
      (m) => m.role === "frontend" || m.role === "mobile"
    ),
    hasDatabase: config.modules.some((m) => m.role === "database"),
    hasE2e: config.modules.some((m) => m.role === "e2e"),
    hasAgent: config.modules.some((m) => m.role === "agent-ai"),
  };
}
