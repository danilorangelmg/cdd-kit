export interface StackDefinition {
  id: string;
  label: string;
  description: string;
  role: string;
  language: "typescript" | "python" | "dart" | "go";
  testRunner: string;
  testCommand: string;
  lintCommand: string;
  supportingFiles: string[];
}

export const STACKS: StackDefinition[] = [
  // Frontend
  {
    id: "react",
    label: "React",
    description: "React with TypeScript",
    role: "frontend",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "vue",
    label: "Vue",
    description: "Vue 3 with Composition API",
    role: "frontend",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "angular",
    label: "Angular",
    description: "Angular with TypeScript",
    role: "frontend",
    language: "typescript",
    testRunner: "jest",
    testCommand: "npx jest",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "svelte",
    label: "Svelte",
    description: "Svelte / SvelteKit",
    role: "frontend",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },

  // Backend
  {
    id: "nestjs",
    label: "NestJS",
    description: "NestJS with TypeScript",
    role: "backend",
    language: "typescript",
    testRunner: "jest",
    testCommand: "npx jest",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "express",
    label: "Express",
    description: "Express.js with TypeScript",
    role: "backend",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "fastify",
    label: "Fastify",
    description: "Fastify with TypeScript",
    role: "backend",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "fastapi",
    label: "FastAPI",
    description: "FastAPI with Python",
    role: "backend",
    language: "python",
    testRunner: "pytest",
    testCommand: "python3 -m pytest",
    lintCommand: "make lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "django",
    label: "Django",
    description: "Django with Python",
    role: "backend",
    language: "python",
    testRunner: "pytest",
    testCommand: "python3 -m pytest",
    lintCommand: "make lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "flask",
    label: "Flask",
    description: "Flask with Python",
    role: "backend",
    language: "python",
    testRunner: "pytest",
    testCommand: "python3 -m pytest",
    lintCommand: "make lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },

  // Mobile
  {
    id: "react-native",
    label: "React Native",
    description: "React Native with TypeScript",
    role: "mobile",
    language: "typescript",
    testRunner: "jest",
    testCommand: "npx jest",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "flutter",
    label: "Flutter",
    description: "Flutter with Dart",
    role: "mobile",
    language: "dart",
    testRunner: "flutter_test",
    testCommand: "flutter test",
    lintCommand: "dart analyze",
    supportingFiles: ["patterns.md", "testing.md"],
  },

  // E2E
  {
    id: "playwright",
    label: "Playwright",
    description: "Playwright E2E testing",
    role: "e2e",
    language: "typescript",
    testRunner: "playwright",
    testCommand: "npx playwright test",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md"],
  },
  {
    id: "cypress",
    label: "Cypress",
    description: "Cypress E2E testing",
    role: "e2e",
    language: "typescript",
    testRunner: "cypress",
    testCommand: "npx cypress run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md"],
  },
  {
    id: "cucumber",
    label: "Cucumber",
    description: "Cucumber BDD with step definitions",
    role: "e2e",
    language: "typescript",
    testRunner: "cucumber",
    testCommand: "npx cucumber-js",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md"],
  },

  // Database
  {
    id: "prisma",
    label: "Prisma",
    description: "Prisma ORM",
    role: "database",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md"],
  },
  {
    id: "drizzle",
    label: "Drizzle",
    description: "Drizzle ORM",
    role: "database",
    language: "typescript",
    testRunner: "vitest",
    testCommand: "npx vitest run",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md"],
  },
  {
    id: "typeorm",
    label: "TypeORM",
    description: "TypeORM",
    role: "database",
    language: "typescript",
    testRunner: "jest",
    testCommand: "npx jest",
    lintCommand: "npm run lint",
    supportingFiles: ["patterns.md"],
  },

  // Agent-AI
  {
    id: "langchain",
    label: "LangChain",
    description: "LangChain framework (Python)",
    role: "agent-ai",
    language: "python",
    testRunner: "pytest",
    testCommand: "python3 -m pytest",
    lintCommand: "make lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
  {
    id: "crewai",
    label: "CrewAI",
    description: "CrewAI multi-agent framework (Python)",
    role: "agent-ai",
    language: "python",
    testRunner: "pytest",
    testCommand: "python3 -m pytest",
    lintCommand: "make lint",
    supportingFiles: ["patterns.md", "testing.md"],
  },
];

export function getStacksForRole(role: string): StackDefinition[] {
  return STACKS.filter((s) => s.role === role);
}

export function getStackById(id: string): StackDefinition | undefined {
  return STACKS.find((s) => s.id === id);
}
