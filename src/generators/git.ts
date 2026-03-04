import path from "path";
import { renderTemplate } from "../utils/template-engine.js";
import { writeFile } from "../utils/fs.js";
import type { ProjectConfig } from "../utils/validation.js";

function getProviderDomain(provider: string): string {
  switch (provider) {
    case "gitlab":
      return "gitlab.com";
    case "bitbucket":
      return "bitbucket.org";
    default:
      return "github.com";
  }
}

export function getSubmoduleUrl(
  provider: string,
  org: string,
  directory: string
): string {
  return `git@${getProviderDomain(provider)}:${org}/${directory}.git`;
}

export async function generateGit(
  projectDir: string,
  config: ProjectConfig
): Promise<string[]> {
  const generatedFiles: string[] = [];

  if (!config.git?.submodules) {
    return generatedFiles;
  }

  // Generate .gitmodules
  const entries = config.modules.map((mod) => ({
    name: mod.directory,
    path: mod.directory,
    url: getSubmoduleUrl(config.git!.provider, config.git!.org, mod.directory),
  }));

  let gitmodulesContent = "";
  for (const entry of entries) {
    gitmodulesContent += `[submodule "${entry.name}"]\n`;
    gitmodulesContent += `\tpath = ${entry.path}\n`;
    gitmodulesContent += `\turl = ${entry.url}\n`;
  }

  await writeFile(path.join(projectDir, ".gitmodules"), gitmodulesContent);
  generatedFiles.push(".gitmodules");

  // Generate .gitignore
  const gitignore = renderTemplate("root/.gitignore.hbs", config);
  await writeFile(path.join(projectDir, ".gitignore"), gitignore);
  generatedFiles.push(".gitignore");

  return generatedFiles;
}
