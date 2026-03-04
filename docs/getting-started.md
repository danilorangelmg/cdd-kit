# Getting Started with cdd-kit

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and configured

## Installation

```bash
npx cdd-kit init
```

Or install globally:

```bash
npm install -g cdd-kit
cdd init
```

## Creating a Project

Run `cdd init` in an empty or existing directory:

```bash
mkdir my-project && cd my-project
cdd init
```

The CLI will walk you through 3 steps:

### Step 1: Project Info

```
? Project name: my-saas-app
? Description: A multi-tenant SaaS application
? Language: English
```

Language affects generated documentation and directory names:
- **English** — `docs/rules/`, `docs/changelog/`
- **PT-BR** — `documentos/regras/`, `documentos/change-log/`

### Step 2: Modules

Add each module with a name, role, and directory:

```
? Module name: frontend
? Module role: frontend
? Module directory: frontend

? Module name: api
? Module role: backend
? Module directory: api

? Module name: database
? Module role: database
? Module directory: database

? Add another module? No
```

Available roles: `frontend`, `backend`, `database`, `agent-ai`, `mobile`, `e2e`, `generic`.

### Step 3: Methodology Preset

```
? Choose a methodology preset:
  > Standard (Recommended) — Core + TDD + Feature Gate + Changelog
    Minimal — Orchestration + delegation only
    Full — Everything: TDD hooks, E2E protection, Mermaid
    Custom — Pick rules individually
```

See [Rules Reference](rules-reference.md) for what each rule does.

## Generated Files

After running `cdd init`, your project will have:

```
my-saas-app/
├── CLAUDE.md                          # Orchestrator — your AI project manager
├── Makefile                           # Cross-module commands
├── docker-compose.yml                 # Service definitions
├── .env.example                       # Environment variables template
├── cdd.json                           # CDD configuration
│
├── .claude/
│   ├── settings.json                  # Hook configuration
│   ├── hooks/                         # TDD enforcement (if enabled)
│   │   ├── tdd-guard.sh
│   │   ├── auto-test.sh
│   │   └── tdd-eval.sh
│   ├── agents/                        # Specialized sub-agents
│   │   ├── frontend-delegate.md
│   │   ├── api-delegate.md
│   │   ├── database-delegate.md
│   │   ├── validator.md
│   │   ├── tdd-test-writer.md         # (if TDD enabled)
│   │   ├── tdd-implementer.md         # (if TDD enabled)
│   │   └── product-owner.md           # (if Feature Gate enabled)
│   ├── skills/
│   │   ├── tdd/SKILL.md              # /tdd command (if TDD enabled)
│   │   └── plan-feature/SKILL.md     # /plan-feature command (if Feature Gate enabled)
│   └── rules/
│       ├── delegation-protocol.md
│       ├── scope-responsibilities.md
│       ├── anti-patterns.md
│       └── feature-gate.md            # (if Feature Gate enabled)
│
├── frontend/
│   └── CLAUDE.md                      # Frontend governance
├── api/
│   └── CLAUDE.md                      # Backend governance
├── database/
│   └── CLAUDE.md                      # Database governance
│
└── docs/
    ├── changelog/                     # Daily changelogs per module
    ├── rules/                         # Business rules, test plans, dev plans
    │   ├── frontend/
    │   │   ├── business-rules/
    │   │   ├── test-plans/
    │   │   └── dev-plans/
    │   ├── api/
    │   │   ├── business-rules/
    │   │   ├── test-plans/
    │   │   └── dev-plans/
    │   └── database/
    │       ├── business-rules/
    │       ├── test-plans/
    │       └── dev-plans/
    └── templates/
        ├── feature-planning.md
        └── changelog-entry.md
```

## Using It with Claude Code

After scaffolding, open the project in Claude Code:

```bash
cd my-saas-app
claude
```

Claude Code will automatically read the root `CLAUDE.md` and operate as the Orchestrator — analyzing requests, delegating to sub-agents, and enforcing the methodology rules.

### Example Commands

**Implement a feature** (with Feature Gate enabled):

```
> Add user authentication with JWT
```

The orchestrator will:
1. Classify as COMPLEX (touches backend + frontend + database)
2. Invoke `/plan-feature authentication` to generate docs
3. Run TDD cycle per module
4. Validate all tests pass

**Quick fix**:

```
> Fix the 404 error on the /users endpoint
```

The orchestrator will:
1. Classify as SIMPLE (single module)
2. Delegate directly to `api-delegate`
3. Validate tests pass

**Plan a feature explicitly**:

```
> /plan-feature payment-integration
```

Runs the planning skill to generate business rules, test plans, and dev plans per module.

**Run TDD cycle explicitly**:

```
> /tdd api user-registration
```

Runs the full Red → Green → Validate cycle for the `api` module.

## Adding Modules Later

```bash
cdd add-module
```

This adds a new module to `cdd.json`, generates its `CLAUDE.md`, delegate agent, and documentation structure.

## Validating Your Setup

```bash
cdd doctor
```

Checks that all expected files exist, hooks are executable, and configuration is consistent.

## Configuration

The `cdd.json` file stores your project configuration:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-saas-app",
    "description": "A multi-tenant SaaS application",
    "language": "en"
  },
  "modules": [
    { "name": "frontend", "role": "frontend", "directory": "frontend" },
    { "name": "api", "role": "backend", "directory": "api" },
    { "name": "database", "role": "database", "directory": "database" }
  ],
  "methodology": {
    "preset": "standard",
    "rules": {
      "absolute-delegation": true,
      "changelog-by-date": true,
      "conditional-mermaid": false,
      "feature-planning-gate": true,
      "api-response-contract": true,
      "scope-of-responsibility": true,
      "e2e-test-protection": false,
      "post-dev-e2e-validation": false,
      "tdd-enforcement": true
    }
  }
}
```

## Next Steps

- Read the [Methodology](methodology.md) to understand the concepts behind CDD
- Review the [Rules Reference](rules-reference.md) for detailed rule descriptions
- Customize your `Makefile` targets for your actual tech stack
- Fill in `docker-compose.yml` with your service definitions
- Start building with Claude Code
