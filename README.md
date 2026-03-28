# cdd-kit

**Copilot-Driven Development** — A methodology framework for AI-augmented software development with Claude Code.

cdd-kit extracts proven governance patterns from enterprise AI-assisted projects into a stack-aware CLI that scaffolds methodology infrastructure for any project.

## What it does

cdd-kit generates the **governance layer** for Claude Code projects:

- **CLAUDE.md files** — Orchestrator and per-module governance contracts
- **Multi-agent orchestration** — Delegate agents per module, validators, TDD agents with context isolation
- **TDD enforcement** — Hooks that block implementation without tests (Red → Green → Refactor)
- **5-phase feature planning** — Discovery → Business Refinement → Technical Design → Tasks → Implementation, with mandatory gates
- **12 governance rules** — From absolute delegation (#0) to parallel delegation (#11)
- **Stack-aware skills** — 20 stacks across 7 roles with framework-specific patterns
- **Bilingual** — Full Portuguese (PT-BR) and English support

## Quick Start

```bash
npx cdd-kit init
```

The CLI walks you through:
1. **Project info** — name, description, language (PT-BR or English)
2. **Modules** — add as many as you need, each with a role and optional stack
3. **Methodology preset** — Minimal, Standard (recommended), Full, or Custom

## Generated Structure

```
my-project/
├── CLAUDE.md                    # Orchestrator governance (5-phase methodology)
├── Makefile                     # Cross-module commands
├── docker-compose.yml           # Service orchestration
├── .env.example                 # Environment template
├── cdd.json                     # Framework config
├── .claude/
│   ├── settings.json            # Hooks + permissions
│   ├── hooks/
│   │   ├── pre-edit.sh          # Consolidated guard (TDD + Planning Gate)
│   │   ├── auto-test.sh         # Auto-runs related test after edits
│   │   ├── tdd-eval.sh          # TDD phase reminder (bilingual)
│   │   ├── planning-eval.sh     # Planning state injection
│   │   ├── planning-validator.sh # Doc quality validation
│   │   ├── post-dev-verify.sh   # Final verification pipeline
│   │   └── lib/find-test.sh     # Shared test-finding library
│   ├── agents/
│   │   ├── {module}-delegate.md # Per-module specialist agents (stack-aware)
│   │   ├── validator.md         # Cross-project read-only validation
│   │   ├── tdd-test-writer.md   # Red phase (context isolated — sees only specs)
│   │   ├── tdd-implementer.md   # Green phase (context isolated — sees only tests)
│   │   └── product-owner.md     # Business rules with questioning gate
│   ├── skills/
│   │   ├── tdd/SKILL.md         # /tdd — TDD cycle orchestration
│   │   ├── plan-feature/SKILL.md # /plan-feature — 5-phase planning
│   │   ├── git-commit/SKILL.md  # /git-commit — Conventional Commits
│   │   ├── pr-create/SKILL.md   # /pr-create — PR with template
│   │   ├── validate-all/SKILL.md # /validate-all — 3-level validation
│   │   └── deploy-all/SKILL.md  # /deploy-all — Docker orchestration
│   ├── rules/
│   │   ├── delegation-protocol.md
│   │   ├── scope-responsibilities.md
│   │   ├── feature-gate.md
│   │   ├── anti-patterns.md
│   │   ├── tdd/sequential-enforcement.md
│   │   ├── observability/execution-trace.md
│   │   └── orchestration/parallel-delegation.md
│   └── verify/
│       ├── pipeline.yaml        # Verification stages per role
│       └── run.sh               # Pipeline runner with auto-fix
├── frontend/
│   └── CLAUDE.md                # Module governance (visual layer)
├── api/
│   └── CLAUDE.md                # Module governance (business logic)
└── docs/                        # (or documentos/ for PT-BR)
    ├── rules/{module}/          # Business rules, test plans, dev plans
    └── templates/               # Feature planning reference
```

## Commands

| Command | Description |
|---------|-------------|
| `cdd init [dir]` | Initialize a new CDD project |
| `cdd add-module` | Add a module to an existing project |
| `cdd doctor` | Validate project structure |

## 5-Phase Feature Planning

When Rule #3 (Feature Planning Gate) is active, `/plan-feature` enforces:

| Phase | Name | Gate |
|-------|------|------|
| 1 | **Discovery** | Agent asks 10-20 business questions. User confirms all answered |
| 2 | **Business Refinement** | Rules in Given-When-Then per module. Marks `[NEEDS CLARIFICATION]`. User approves |
| 3 | **Technical Design** | Contract-First: API + schema before code. Mandatory reuse check. User approves |
| 4 | **Tasks** | Atomic breakdown with rule traceability. User approves |
| 5 | **Implementation** | TDD per task (Red → Green) with context isolation |

## Methodology Presets

| Preset | Rules | Best for |
|--------|-------|----------|
| **Minimal** | #0 Delegation, #5 Scope | Quick prototypes, small teams |
| **Standard** | + TDD, Feature Gate, Changelog, API Contract, Parallel Delegation | Most projects (recommended) |
| **Full** | + E2E Protection, Mermaid, Post-dev E2E, Execution Trace | Enterprise, strict quality |
| **Custom** | Pick rules individually | Specific needs |

## The 12 Rules

| # | Rule | Category | Always Active |
|---|------|----------|:---:|
| 0 | Absolute Delegation | Core | Yes |
| 1 | Changelog (git-based) | Documentation | No |
| 2 | Conditional Mermaid Diagrams | Documentation | No |
| 3 | Feature Planning Gate (5 phases) | Quality | No |
| 4 | API Response Contract | Quality | No |
| 5 | Scope of Responsibility | Core | Yes |
| 6 | E2E Test Protection | Testing | No |
| 7 | Post-dev E2E Validation | Testing | No |
| 8 | TDD Enforcement (hooks) | Testing | No |
| 9 | TDD Sequential Enforcement | Testing | No |
| 10 | Execution Trace / Observability | Quality | No |
| 11 | Parallel Delegation (waves) | Core | No |

## Module Roles & Stacks

| Role | Scope | Supported Stacks |
|------|-------|-----------------|
| `frontend` | Visual layer only, zero business logic | React, Vue, Angular, Svelte |
| `backend` | Business logic, APIs, validation | NestJS, Express, Fastify, FastAPI, Django, Flask |
| `database` | DDL, migrations, schema registry | — |
| `agent-ai` | Rules engine, LLM, pipelines | LangChain, CrewAI |
| `mobile` | Native/hybrid app, visual layer | React Native, Flutter |
| `e2e` | End-to-end tests, BDD | Playwright, Cypress, Cucumber |
| `generic` | Custom module | — |

Each stack gets **framework-specific patterns and testing guidelines** in the generated skills.

## TDD Context Isolation

For features, TDD uses two separate agents with isolated context:

- **`tdd-test-writer`** (Red phase): Sees specs + tests. **Cannot read** `src/` implementation.
- **`tdd-implementer`** (Green phase): Sees failing tests + code. **Cannot read** business specs.

This prevents contamination — tests reflect requirements, implementation reflects tests. Compliance: ~84% (vs ~20% without enforcement).

## Why

41% of code in 2025 was AI-generated. 66% of devs spent more time fixing it than they saved.

The bottleneck isn't generating code — it's the quality of what goes in. cdd-kit solves this:

- AI writes the code (speed)
- Governance rules prevent chaos (rigor)
- 5-phase planning ensures correct understanding before implementation
- TDD enforcement ensures correctness
- Multi-agent orchestration scales to enterprise projects

## Related

- [cdd-skills](https://github.com/danilorangelmg/cdd-skills) — Extracted skills, rules, hooks, and agents from the reference implementation

## License

MIT
