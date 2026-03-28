import path from "path";
import { renderTemplate } from "../utils/template-engine.js";
import { writeFile, ensureDir } from "../utils/fs.js";
import type { ProjectConfig } from "../utils/validation.js";
import { getPathMap } from "../utils/paths.js";

export async function generateDocs(
  projectDir: string,
  config: ProjectConfig
): Promise<string[]> {
  const generatedFiles: string[] = [];
  const paths = getPathMap(config.project.language);
  const docsDir = path.join(projectDir, paths.docsRoot);

  // Feature planning directories per module
  if (config.methodology.rules["feature-planning-gate"]) {
    for (const mod of config.modules) {
      await ensureDir(
        path.join(docsDir, paths.rules, mod.name, paths.businessRules)
      );
      await ensureDir(
        path.join(docsDir, paths.rules, mod.name, paths.testPlans)
      );
      await ensureDir(
        path.join(docsDir, paths.rules, mod.name, paths.devPlans)
      );
      await writeFile(
        path.join(
          docsDir,
          paths.rules,
          mod.name,
          paths.businessRules,
          ".gitkeep"
        ),
        ""
      );
      await writeFile(
        path.join(
          docsDir,
          paths.rules,
          mod.name,
          paths.testPlans,
          ".gitkeep"
        ),
        ""
      );
      await writeFile(
        path.join(
          docsDir,
          paths.rules,
          mod.name,
          paths.devPlans,
          ".gitkeep"
        ),
        ""
      );
    }
    generatedFiles.push(`${paths.docsRoot}/${paths.rules}/`);
  }

  // Templates directory
  const context = { ...config, paths };

  const featurePlanning = renderTemplate(
    "docs/feature-planning.md.hbs",
    context
  );
  await writeFile(
    path.join(docsDir, paths.templates, "feature-planning.md"),
    featurePlanning
  );
  generatedFiles.push(
    `${paths.docsRoot}/${paths.templates}/feature-planning.md`
  );

  if (config.methodology.rules["conditional-mermaid"]) {
    const mermaid = renderTemplate("docs/mermaid-reference.md.hbs", context);
    await writeFile(
      path.join(docsDir, paths.templates, "mermaid-reference.md"),
      mermaid
    );
    generatedFiles.push(
      `${paths.docsRoot}/${paths.templates}/mermaid-reference.md`
    );
  }

  return generatedFiles;
}
