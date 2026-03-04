# cdd-kit

**Copilot-Driven Development** — A methodology framework for AI-augmented software development with Claude Code.

cdd-kit extracts proven governance patterns from enterprise AI-assisted projects into a stack-agnostic CLI that scaffolds methodology infrastructure for any project.

## What it does

cdd-kit generates the **governance layer** for Claude Code projects:

- **CLAUDE.md files** — Orchestrator and per-module governance contracts
- **Multi-agent orchestration** — Delegate agents per module, validators, TDD agents
- **TDD enforcement** — Hooks that block implementation without tests (Red → Green → Refactor)
- **Feature planning gates** — Mandatory documentation before implementation
- **Documentation structure** — Changelogs, business rules, test plans per module
- **Scope boundaries** — Clear responsibility maps preventing logic leaks between modules

## Quick Start

```bash
npx cdd-kit init
```

The CLI walks you through:
1. **Project info** — name, description, language (PT-BR or English)
2. **Modules** — add as many as you need, each with a role (frontend, backend, database, agent-ai, mobile, e2e, generic)
3. **Methodology preset** — Minimal, Standard (recommended), Full, or Custom

## Generated Structure

```
my-project/
├── CLAUDE.md                    # Orchestrator governance
├── Makefile                     # Cross-module commands
├── docker-compose.yml           # Service orchestration
├── .env.example                 # Environment template
├── cdd.json                     # Framework config
├── .claude/
│   ├── settings.json            # Hooks configuration
│   ├── hooks/
│   │   ├── tdd-guard.sh         # Blocks src/ edits without tests
│   │   ├── auto-test.sh         # Auto-runs tests after edits
│   │   └── tdd-eval.sh          # TDD reminder injection
│   ├── agents/
│   │   ├── {module}-delegate.md # Per-module specialist agents
│   │   ├── validator.md         # Cross-project validation
│   │   ├── tdd-test-writer.md   # Red phase (context isolated)
│   │   ├── tdd-implementer.md   # Green phase (context isolated)
│   │   └── product-owner.md     # Business rules documentation
│   ├── skills/
│   │   ├── tdd/SKILL.md         # /tdd command
│   │   └── plan-feature/SKILL.md # /plan-feature command
│   └── rules/
│       ├── delegation-protocol.md
│       ├── scope-responsibilities.md
│       ├── feature-gate.md
│       └── anti-patterns.md
├── frontend/
│   └── CLAUDE.md                # Module governance (visual layer)
├── api/
│   └── CLAUDE.md                # Module governance (business logic)
├── database/
│   └── CLAUDE.md                # Module governance (DDL only)
└── documentos/
    ├── change-log/{module}/     # Daily changelogs per module
    ├── regras/{module}/         # Business rules, test plans, dev plans
    └── templates/               # Document templates
```

## Commands

| Command | Description |
|---------|-------------|
| `cdd init [dir]` | Initialize a new CDD project |
| `cdd add-module` | Add a module to an existing project |
| `cdd doctor` | Validate project structure |

## Methodology Presets

| Preset | Rules | Best for |
|--------|-------|----------|
| **Minimal** | #0 Delegation, #5 Scope | Quick prototypes, small teams |
| **Standard** | + TDD, Feature Gate, Changelog, API Contract | Most projects (recommended) |
| **Full** | + E2E Protection, Mermaid, Post-dev E2E | Enterprise, strict quality |
| **Custom** | Pick rules individually | Specific needs |

## The 9 Rules

| # | Rule | Category | Always Active |
|---|------|----------|:---:|
| 0 | Absolute Delegation | Core | Yes |
| 1 | Changelog by Date | Documentation | No |
| 2 | Conditional Mermaid Diagrams | Documentation | No |
| 3 | Feature Planning Gate | Quality | No |
| 4 | API Response Contract | Quality | No |
| 5 | Scope of Responsibility | Core | Yes |
| 6 | E2E Test Protection | Testing | No |
| 7 | Post-dev E2E Validation | Testing | No |
| 8 | TDD Enforcement | Testing | No |

## Module Roles

| Role | Scope | Example |
|------|-------|---------|
| `frontend` | Visual layer only, zero business logic | React, Vue, Svelte |
| `backend` | Business logic, APIs, validation | FastAPI, NestJS, Go |
| `database` | DDL, migrations, schema registry | Alembic, Prisma, Flyway |
| `agent-ai` | Rules engine, LLM, pipelines, schedulers | LangChain, custom engine |
| `mobile` | Native/hybrid app, visual layer | React Native, Flutter |
| `e2e` | End-to-end tests, BDD | Playwright, Cypress |
| `generic` | Custom module | Anything |

## Stack Agnostic

cdd-kit generates **methodology**, not code. The CLAUDE.md files describe roles, responsibilities, and governance patterns — you fill in your tech stack. Works with any combination of languages and frameworks.

## Why

"Vibe coding" (AI writes code, you accept without review) is fast but chaotic. Traditional software engineering is rigorous but slow. cdd-kit bridges the gap:

- AI writes the code (speed of vibe coding)
- Governance rules prevent chaos (rigor of engineering)
- TDD enforcement ensures correctness
- Multi-agent orchestration scales to enterprise projects

## License

MIT
