// Public API for cdd-kit — used by extensions and integrations
// Import via: import { RULES, generateClaudeInfra } from "cdd-kit/api"

// Methodology
export { RULES, getRuleById, getActiveRules } from "./methodology/rules.js";
export type { Rule } from "./methodology/rules.js";

export { ROLES, getRoleById } from "./methodology/roles.js";
export type { ModuleRole } from "./methodology/roles.js";

export { STACKS, getStacksForRole, getStackById } from "./methodology/stacks.js";
export type { StackDefinition } from "./methodology/stacks.js";

export { PRESETS, getPresetById } from "./methodology/presets.js";
export type { Preset } from "./methodology/presets.js";

// Validation & Types
export {
  validateConfig,
  ProjectConfigSchema,
  ModuleSchema,
  MethodologySchema,
  GitConfigSchema,
} from "./utils/validation.js";
export type {
  ProjectConfig,
  ModuleConfig,
  MethodologyConfig,
  GitConfig,
} from "./utils/validation.js";

// Generators
export { generateClaudeInfra } from "./generators/claude-infra.js";
export { generateModule, generateAllModules } from "./generators/module.js";
export { generateOrchestrator } from "./generators/orchestrator.js";
export { generateDocs } from "./generators/docs.js";
export { generateGit, getSubmoduleUrl } from "./generators/git.js";

// Template Engine
export {
  renderTemplate,
  renderTemplateString,
  templateExists,
  getTemplatesDir,
} from "./utils/template-engine.js";

// Paths
export { getPathMap } from "./utils/paths.js";
export type { PathMap } from "./utils/paths.js";

// File System Utilities
export {
  ensureDir,
  writeFile,
  makeExecutable,
  fileExists,
  readFile,
  readJson,
  writeJson,
  directoryHasContent,
} from "./utils/fs.js";

// Git Modules Parser
export {
  parseGitmodules,
  parseGitUrl,
  detectCommonPrefix,
} from "./utils/gitmodules-parser.js";
export type {
  GitmoduleEntry,
  ParsedGitUrl,
} from "./utils/gitmodules-parser.js";
