# CDD — Copilot-Driven Development

CDD is a governance methodology for AI-augmented software development. It defines how AI coding agents (specifically Claude Code) should operate within a project: who decides, who implements, what boundaries exist, and how quality is enforced.

## The Problem

AI coding assistants are powerful but undisciplined by default. Without governance:

- **Logic leaks** — business rules end up in the frontend, UI logic in the backend
- **No traceability** — changes happen without documentation or context
- **Test erosion** — AI modifies tests to make them pass instead of fixing code
- **Scope creep** — a simple fix cascades into unplanned refactors across modules
- **No separation of concerns** — a single AI session touches every part of the codebase

CDD solves this by introducing an **orchestration layer** — a set of rules, agents, and boundaries that govern how AI operates in your project.

## Core Concepts

### The Orchestrator

The root `CLAUDE.md` file turns Claude Code into an **Orchestrator** — a project manager that never writes implementation code directly. Instead, it:

1. **Analyzes** the request
2. **Plans** the approach
3. **Delegates** to specialized sub-agents
4. **Validates** the results

This mirrors how senior engineers work: understanding the full picture, then directing specialists to implement.

### Modules

A CDD project is divided into **modules** — self-contained directories, each with its own `CLAUDE.md` governance file. Each module has a **role** that defines what it can and cannot do:

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| `frontend` | UI components, styles, state, routing | Business logic, direct DB access, API validation |
| `backend` | Business logic, API endpoints, validation | Database DDL, UI rendering |
| `database` | DDL, migrations, schema registry | Business logic, API endpoints |
| `agent-ai` | ML pipelines, LLM orchestration, rules engine | UI rendering, direct DB access |
| `mobile` | Native UI, navigation, local storage | Business logic, server-side logic |
| `e2e` | Integration tests, BDD scenarios | Implementation code |
| `generic` | Defined per project | Defined per project |

### Multi-Agent Orchestration

CDD uses Claude Code's Task tool to create **isolated sub-agents**:

```
Orchestrator (root CLAUDE.md)
  ├── frontend-delegate    → only touches frontend/
  ├── api-delegate         → only touches api/
  ├── database-delegate    → only touches database/
  ├── validator            → cross-module validation
  ├── tdd-test-writer      → writes tests (Red phase)
  ├── tdd-implementer      → writes implementation (Green phase)
  └── product-owner        → generates business rules documentation
```

Each sub-agent:
- Has its own `CLAUDE.md` with scope restrictions
- Can only modify files within its module directory
- Receives a specific, bounded task from the orchestrator
- Returns structured results

### Rules

CDD defines **9 governance rules** organized in 4 categories:

| Category | Rules |
|----------|-------|
| **Core** | #0 Absolute Delegation, #5 Scope of Responsibility |
| **Documentation** | #1 Changelog by Date, #2 Conditional Mermaid |
| **Quality** | #3 Feature Planning Gate, #4 API Response Contract |
| **Testing** | #6 E2E Protection, #7 Post-dev E2E Validation, #8 TDD Enforcement |

Rules #0 and #5 are always active. The rest are opt-in via presets or custom configuration. See [rules-reference.md](rules-reference.md) for detailed descriptions.

### Presets

Presets are pre-configured rule combinations for common needs:

| Preset | Active Rules | Use Case |
|--------|-------------|----------|
| **Minimal** | #0, #5 | Prototypes, solo projects, learning |
| **Standard** | #0, #1, #3, #4, #5, #8 | Most teams (recommended) |
| **Full** | All 9 rules | Enterprise, regulated environments |
| **Custom** | Pick individually | Specific requirements |

## How It Works in Practice

### Example: Adding a Payment Feature

1. **User** asks Claude Code: "Add Stripe payment integration"

2. **Orchestrator** analyzes and classifies as COMPLEX (touches backend + frontend + database)

3. **Feature Gate** (Rule #3) triggers:
   - Orchestrator invokes `/plan-feature payment`
   - Product Owner agent generates business rules per module
   - Test plans and dev plans are created before any code

4. **TDD Cycle** (Rule #8) begins per module:
   - `tdd-test-writer` reads business rules, writes failing tests (Red)
   - `tdd-implementer` implements minimum code to pass (Green)
   - Context isolation ensures test writer and implementer never share state

5. **Delegation** (Rule #0) enforces boundaries:
   - Database delegate: creates `payments` table migration
   - Backend delegate: implements Stripe integration + API endpoints
   - Frontend delegate: builds payment form (visual only, no business logic)

6. **Changelog** (Rule #1) records what happened:
   - One entry per module per day with changes, decisions, and diagrams

### Example: Quick Bug Fix

1. **User** asks: "Fix the login button color on mobile"

2. **Orchestrator** classifies as SIMPLE (single module, no business logic)

3. **Feature Gate** does NOT trigger (simple fix)

4. **Delegation**: frontend-delegate fixes the CSS

5. **Validation**: orchestrator verifies only frontend tests pass

## The Development Cycle

CDD prescribes a structured development cycle:

```
Analyze → Think → Plan → Test (Red) → Execute (Green) → Validate
```

1. **Analyze**: Use Explore agents to understand scope, find patterns, read existing code
2. **Think**: Extended thinking for architectural tradeoffs
3. **Plan**: Define approach with justification (why this approach vs alternatives)
4. **Test (Red)**: Write failing tests BEFORE implementation (when TDD is enabled)
5. **Execute (Green)**: Implement minimum code to make tests pass
6. **Validate**: Run tests only for affected modules

Without TDD enabled, steps 4-5 collapse into a single "Execute" step.

## What CDD Is Not

- **Not a framework** — it generates governance files, not application code
- **Not opinionated about stack** — works with any language, framework, or tooling
- **Not mandatory for every project** — start with Minimal preset and add rules as needed
- **Not a replacement for code review** — it governs AI behavior, human review still matters

## Further Reading

- [Getting Started](getting-started.md) — install and scaffold your first project
- [Rules Reference](rules-reference.md) — detailed description of all 9 rules
