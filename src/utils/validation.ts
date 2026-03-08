import { z } from "zod";

export const ModuleSchema = z.object({
  name: z.string().min(1),
  role: z.enum([
    "frontend",
    "backend",
    "database",
    "agent-ai",
    "mobile",
    "e2e",
    "generic",
  ]),
  directory: z.string().min(1),
  stack: z.string().optional(),
});

export const MethodologySchema = z.object({
  preset: z.string(),
  rules: z.record(z.string(), z.boolean()),
});

export const GitConfigSchema = z.object({
  submodules: z.boolean(),
  org: z.string().min(1),
  provider: z.enum(["github", "gitlab", "bitbucket"]),
  prefix: z.string(),
});

export const ProjectConfigSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string().min(1),
    description: z.string(),
    language: z.string().min(2),
  }),
  modules: z.array(ModuleSchema),
  methodology: MethodologySchema,
  git: GitConfigSchema.optional(),
});

export type ModuleConfig = z.infer<typeof ModuleSchema>;
export type MethodologyConfig = z.infer<typeof MethodologySchema>;
export type GitConfig = z.infer<typeof GitConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export function validateConfig(data: unknown): ProjectConfig {
  return ProjectConfigSchema.parse(data);
}
