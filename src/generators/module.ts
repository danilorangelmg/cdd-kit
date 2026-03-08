import path from "path";
import { renderTemplate } from "../utils/template-engine.js";
import { writeFile, ensureDir, directoryHasContent } from "../utils/fs.js";
import type { ProjectConfig, ModuleConfig } from "../utils/validation.js";
import { getRoleById } from "../methodology/roles.js";
import { getPathMap } from "../utils/paths.js";

export async function generateModule(
  projectDir: string,
  config: ProjectConfig,
  mod: ModuleConfig
): Promise<string[]> {
  const generatedFiles: string[] = [];
  const role = getRoleById(mod.role);

  const paths = getPathMap(config.project.language);
  const context = {
    ...config,
    module: mod,
    role,
    paths,
  };

  // Module directory
  const moduleDir = path.join(projectDir, mod.directory);
  await ensureDir(moduleDir);

  // Module CLAUDE.md
  const templateFile = role?.templateFile ?? "generic.CLAUDE.md.hbs";
  const claudeMd = renderTemplate(`modules/${templateFile}`, context);
  await writeFile(path.join(moduleDir, "CLAUDE.md"), claudeMd);
  generatedFiles.push(`${mod.directory}/CLAUDE.md`);

  // Module src/ and tests/ directories (skip for submodules or existing dirs with content)
  if (!config.git?.submodules && !(await directoryHasContent(moduleDir))) {
    await ensureDir(path.join(moduleDir, "src"));
    await ensureDir(path.join(moduleDir, "tests"));
    await writeFile(path.join(moduleDir, "src", ".gitkeep"), "");
    await writeFile(path.join(moduleDir, "tests", ".gitkeep"), "");
  }

  return generatedFiles;
}

export async function generateAllModules(
  projectDir: string,
  config: ProjectConfig
): Promise<string[]> {
  const allFiles: string[] = [];
  for (const mod of config.modules) {
    const files = await generateModule(projectDir, config, mod);
    allFiles.push(...files);
  }
  return allFiles;
}
