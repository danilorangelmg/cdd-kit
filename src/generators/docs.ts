import path from "path";
import { renderTemplate } from "../utils/template-engine.js";
import { writeFile, ensureDir } from "../utils/fs.js";
import type { ProjectConfig } from "../utils/validation.js";

export async function generateDocs(
  projectDir: string,
  config: ProjectConfig
): Promise<string[]> {
  const generatedFiles: string[] = [];
  const docsDir = path.join(projectDir, "documentos");

  // Change log directories per module
  if (config.methodology.rules["changelog-by-date"]) {
    for (const mod of config.modules) {
      await ensureDir(path.join(docsDir, "change-log", mod.name));
      await writeFile(
        path.join(docsDir, "change-log", mod.name, ".gitkeep"),
        ""
      );
    }
    generatedFiles.push("documentos/change-log/");
  }

  // Feature planning directories per module
  if (config.methodology.rules["feature-planning-gate"]) {
    for (const mod of config.modules) {
      await ensureDir(
        path.join(docsDir, "regras", mod.name, "regras-negocio")
      );
      await ensureDir(path.join(docsDir, "regras", mod.name, "plano-testes"));
      await ensureDir(
        path.join(docsDir, "regras", mod.name, "plano-desenvolvimento")
      );
      await writeFile(
        path.join(docsDir, "regras", mod.name, "regras-negocio", ".gitkeep"),
        ""
      );
      await writeFile(
        path.join(docsDir, "regras", mod.name, "plano-testes", ".gitkeep"),
        ""
      );
      await writeFile(
        path.join(
          docsDir,
          "regras",
          mod.name,
          "plano-desenvolvimento",
          ".gitkeep"
        ),
        ""
      );
    }
    generatedFiles.push("documentos/regras/");
  }

  // Templates directory
  const context = { ...config };

  const featurePlanning = renderTemplate(
    "docs/feature-planning.md.hbs",
    context
  );
  await writeFile(
    path.join(docsDir, "templates", "feature-planning.md"),
    featurePlanning
  );
  generatedFiles.push("documentos/templates/feature-planning.md");

  if (config.methodology.rules["conditional-mermaid"]) {
    const mermaid = renderTemplate("docs/mermaid-reference.md.hbs", context);
    await writeFile(
      path.join(docsDir, "templates", "mermaid-reference.md"),
      mermaid
    );
    generatedFiles.push("documentos/templates/mermaid-reference.md");
  }

  if (config.methodology.rules["changelog-by-date"]) {
    const changelog = renderTemplate("docs/changelog-entry.md.hbs", context);
    await writeFile(
      path.join(docsDir, "templates", "changelog-entry.md"),
      changelog
    );
    generatedFiles.push("documentos/templates/changelog-entry.md");
  }

  return generatedFiles;
}
