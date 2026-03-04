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
});

export const MethodologySchema = z.object({
  preset: z.string(),
  rules: z.record(z.string(), z.boolean()),
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
});

export type ModuleConfig = z.infer<typeof ModuleSchema>;
export type MethodologyConfig = z.infer<typeof MethodologySchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export function validateConfig(data: unknown): ProjectConfig {
  return ProjectConfigSchema.parse(data);
}
