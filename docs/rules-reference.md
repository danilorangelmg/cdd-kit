# CDD Rules Reference

CDD defines 9 governance rules. Rules #0 and #5 are always active. The rest are opt-in.

---

## Rule #0 — Absolute Delegation

| | |
|---|---|
| **Category** | Core |
| **Always Active** | Yes |
| **Requires** | — |

The orchestrator (root `CLAUDE.md`) **never** edits or creates files inside module directories. All implementation is delegated to specialized sub-agents via the Task tool.

### What the orchestrator CAN edit

- `CLAUDE.md` (root)
- `Makefile`
- `docker-compose.yml`
- `.env.example`
- `cdd.json`
- `.claude/` (settings, hooks, agents, skills, rules)
- `docs/` or `documentos/` (documentation)

### What the orchestrator CANNOT edit

Any file inside a module directory (`frontend/`, `api/`, `database/`, etc.).

### Why

Without this rule, the orchestrator accumulates massive context by reading and writing across the entire codebase. Delegation forces bounded context per agent, reducing errors and keeping each agent focused on its domain.

### How it's enforced

The generated `.claude/rules/delegation-protocol.md` defines the delegation protocol. Each module's `CLAUDE.md` file restricts the delegate agent to its own directory.

---

## Rule #1 — Changelog by Date

| | |
|---|---|
| **Category** | Documentation |
| **Always Active** | No |
| **Requires** | — |

Every completed delegation generates a changelog entry. One file per module per day.

### Format

```
docs/changelog/{module}/{YYYY-MM-DD}.md
```

Each entry contains:
- **Title** — what changed
- **Agent** — which agent executed the task
- **Status** — Completed / In progress / Blocked
- **Decision** — justification for the approach chosen
- **Changes** — table of files modified
- **Diagram** — Mermaid diagram (if Rule #2 applies)

### Why

AI-generated changes are invisible without traceability. Changelogs provide an audit trail that explains not just *what* changed but *why* and *who* (which agent) did it.

---

## Rule #2 — Conditional Mermaid Diagrams

| | |
|---|---|
| **Category** | Documentation |
| **Always Active** | No |
| **Requires** | Rule #1 (Changelog by Date) |

Mermaid diagrams are mandatory in changelog entries **only** for architectural changes:

| Change Type | Diagram Type |
|-------------|-------------|
| New endpoint | `sequenceDiagram` |
| Schema change | `erDiagram` |
| New integration | `flowchart` |

**Not required** for: bug fixes, config changes, refactoring, basic CRUD.

### Why

Diagrams are valuable for understanding architectural decisions but add noise for trivial changes. This rule finds the balance.

---

## Rule #3 — Feature Planning Gate

| | |
|---|---|
| **Category** | Quality |
| **Always Active** | No |
| **Requires** | — |

New features are auto-detected (keywords: implement, create, add, new module) and classified:

- **SIMPLE** — max 2 modules, CRUD operations, clear existing patterns
- **COMPLEX** — 3+ modules, new patterns, significant business logic

Complex features require **per-module documentation** before any implementation:

```
docs/rules/{module}/business-rules/{feature}.md
docs/rules/{module}/test-plans/{feature}.md
docs/rules/{module}/dev-plans/{feature}.md
```

### The `/plan-feature` skill

When this rule is active, cdd-kit generates a `/plan-feature` skill that automates the planning process:

1. Classify the feature (SIMPLE/COMPLEX)
2. Identify affected modules
3. Delegate to the Product Owner agent to generate business rules per module
4. Create test plans with Gherkin scenarios
5. Create development plans with atomic tasks
6. Update documentation indices

### Why

"Just start coding" with AI leads to incomplete implementations and missed edge cases. Planning forces the AI to think through business rules, test scenarios, and module boundaries **before** writing a single line of code.

---

## Rule #4 — API Response Contract

| | |
|---|---|
| **Category** | Quality |
| **Always Active** | No |
| **Requires** | — |

All APIs must follow a standard envelope format:

**Success:**
```json
{
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

**Error:**
```json
{
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND"
  }
}
```

No loose JSON at root level. Every response is wrapped in either `data` or `error`.

### Why

Consistent API contracts prevent frontend agents from writing custom parsing logic for each endpoint. The frontend always knows the shape of the response.

---

## Rule #5 — Scope of Responsibility

| | |
|---|---|
| **Category** | Core |
| **Always Active** | Yes |
| **Requires** | — |

Each module has a strict responsibility map (CAN/CANNOT):

### Frontend (visual layer)

| CAN | CANNOT |
|-----|--------|
| UI components, styles, animations | Business logic, validation rules |
| State management (UI state) | Direct database access |
| API calls (fetch/display) | Data transformation logic |
| Routing, navigation | Authentication logic |

### Backend (business logic)

| CAN | CANNOT |
|-----|--------|
| Business rules, validation | UI rendering |
| API endpoints | Database DDL/migrations |
| Authentication, authorization | Frontend state management |
| Data transformation | Direct DOM manipulation |

### Database (DDL)

| CAN | CANNOT |
|-----|--------|
| Schema definitions | Business logic |
| Migrations | API endpoints |
| Indexes, constraints | Application code |
| Seed data | UI rendering |

### Agent-AI (engine)

| CAN | CANNOT |
|-----|--------|
| ML pipelines, LLM orchestration | UI rendering |
| Rules engine, schedulers | Direct database DDL |
| Data processing pipelines | Frontend state |

### Why

Without scope boundaries, AI agents write "convenient" code — putting validation in the frontend, business logic in database triggers, or UI concerns in the backend. This rule prevents logic leaks.

---

## Rule #6 — E2E Test Protection

| | |
|---|---|
| **Category** | Testing |
| **Always Active** | No |
| **Requires** | Rule #8 (TDD Enforcement) |

E2E test files are protected with filesystem permissions:

- **Directories**: `chmod 555` (read + execute only)
- **Files**: `chmod 444` (read only)

Tests can only be modified during the **Red phase** of TDD:

```bash
make e2e-unlock    # Before writing new E2E tests
# ... write tests ...
make e2e-lock      # After tests are written, before implementation
```

### Why

AI agents frequently "fix" failing tests by modifying the test assertions instead of fixing the actual code. Filesystem-level protection makes this physically impossible during the Green phase.

---

## Rule #7 — Post-dev E2E Validation

| | |
|---|---|
| **Category** | Testing |
| **Always Active** | No |
| **Requires** | Rule #6 (E2E Protection) |

After **any** frontend or backend change, E2E tests must run:

1. Run `make test-e2e`
2. If tests fail → diagnose and fix application code (not tests)
3. Maximum 3 diagnostic iterations
4. If still failing after 3 iterations → escalate to the user

**Critical**: NEVER modify E2E tests to make them pass. Always fix the application code.

### Why

E2E tests are the final safety net. If they fail after a change, the change broke something. This rule ensures regressions are caught immediately.

---

## Rule #8 — TDD Enforcement

| | |
|---|---|
| **Category** | Testing |
| **Always Active** | No |
| **Requires** | — |

TDD is enforced through 4 automatic Claude Code hooks:

| Hook | Event | Behavior |
|------|-------|----------|
| `tdd-guard.sh` | PreToolUse | Blocks `src/` edits if no corresponding test file exists |
| `auto-test.sh` | PostToolUse | Automatically runs tests after any file edit |
| `tdd-eval.sh` | UserPromptSubmit | Injects TDD evaluation prompt into every user message |

### The `/tdd` skill

When this rule is active, cdd-kit generates a `/tdd` skill that orchestrates the full cycle:

1. **Red** — Delegate to `tdd-test-writer` to create failing tests
2. **Green** — Delegate to `tdd-implementer` to write minimum passing code
3. **Validate** — Run lint, check coverage (>= 80% suggested)
4. **Report** — Save results to `.claude/agent-memory/tdd-report-{feature}.md`

### Context Isolation

The test writer and implementer are **always** separate agents. They never share context. This prevents the implementer from "knowing" what the tests expect and writing code that merely satisfies assertions rather than implementing correct business logic.

### Why

Without enforcement, AI agents skip tests or write tests after implementation (which defeats the purpose of TDD). The hooks make it physically impossible to edit source code without tests existing first.

---

## Rule Dependency Graph

```
#0 Absolute Delegation (always active)
#5 Scope of Responsibility (always active)

#1 Changelog by Date
  └── #2 Conditional Mermaid (requires #1)

#3 Feature Planning Gate

#4 API Response Contract

#8 TDD Enforcement
  └── #6 E2E Protection (requires #8)
      └── #7 Post-dev E2E Validation (requires #6)
```

## Preset Mapping

| Rule | Minimal | Standard | Full |
|------|:-------:|:--------:|:----:|
| #0 Absolute Delegation | Yes | Yes | Yes |
| #1 Changelog by Date | — | Yes | Yes |
| #2 Conditional Mermaid | — | — | Yes |
| #3 Feature Planning Gate | — | Yes | Yes |
| #4 API Response Contract | — | Yes | Yes |
| #5 Scope of Responsibility | Yes | Yes | Yes |
| #6 E2E Protection | — | — | Yes |
| #7 Post-dev E2E Validation | — | — | Yes |
| #8 TDD Enforcement | — | Yes | Yes |
