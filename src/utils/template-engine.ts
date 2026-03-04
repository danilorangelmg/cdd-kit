import Handlebars from "handlebars";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");

// Register custom helpers
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("ne", (a, b) => a !== b);
Handlebars.registerHelper("or", (...args) => {
  args.pop(); // remove Handlebars options
  return args.some(Boolean);
});
Handlebars.registerHelper("and", (...args) => {
  args.pop();
  return args.every(Boolean);
});
Handlebars.registerHelper("includes", (arr: string[], value: string) =>
  arr?.includes(value)
);
Handlebars.registerHelper("join", (arr: string[], separator: string) =>
  arr?.join(typeof separator === "string" ? separator : ", ")
);
Handlebars.registerHelper("uppercase", (str: string) => str?.toUpperCase());
Handlebars.registerHelper("lowercase", (str: string) => str?.toLowerCase());
Handlebars.registerHelper(
  "ifRule",
  function (this: unknown, ruleId: string, options: Handlebars.HelperOptions) {
    const rules = (options.data?.root?.methodology?.rules ?? {}) as Record<
      string,
      boolean
    >;
    if (rules[ruleId]) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
);
Handlebars.registerHelper(
  "eachModule",
  function (this: unknown, options: Handlebars.HelperOptions) {
    const modules = (options.data?.root?.modules ?? []) as Array<{
      name: string;
      role: string;
      directory: string;
    }>;
    let result = "";
    for (const mod of modules) {
      result += options.fn(mod);
    }
    return result;
  }
);
Handlebars.registerHelper(
  "modulesOfRole",
  function (
    this: unknown,
    role: string,
    options: Handlebars.HelperOptions
  ) {
    const modules = (options.data?.root?.modules ?? []) as Array<{
      name: string;
      role: string;
      directory: string;
    }>;
    const filtered = modules.filter((m) => m.role === role);
    let result = "";
    for (const mod of filtered) {
      result += options.fn(mod);
    }
    return result;
  }
);

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

export function renderTemplate(
  templatePath: string,
  context: Record<string, unknown>
): string {
  const fullPath = path.resolve(TEMPLATES_DIR, templatePath);

  if (!templateCache.has(fullPath)) {
    const source = fs.readFileSync(fullPath, "utf-8");
    templateCache.set(fullPath, Handlebars.compile(source, { noEscape: true }));
  }

  const template = templateCache.get(fullPath)!;
  return template(context);
}

export function renderTemplateString(
  source: string,
  context: Record<string, unknown>
): string {
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}

export function getTemplatesDir(): string {
  return TEMPLATES_DIR;
}
