# Skill Registry - Social-Pip

> Este archivo define las skills activas para el proyecto y sus reglas compactas.
> El orquestador inyecta estas reglas en cada sub-agente según contexto.

---

## Skills Activas por Categoría

| Categoría | Skills | Carga |
|-----------|--------|-------|
| **00-CORE** (14) | sdd-*, skill-registry, skill-creator, documentation, readme | Siempre |
| **10-STACK** (20) | typescript, react-19, zustand-5, zod-4, tailwind-4, playwright, go-testing, clean-code, etc. | Por contexto de archivo |
| **20-PLATFORM** (3) | api-patterns, api-design-principles, react-native-skills | Por tecnología |
| **30-WORKFLOW** (10) | branch-pr, issue-creation, judgment-day, github-pr, commit, git-hooks, etc. | Por comando |
| **40-AUTOMATION** (2) | browser-automation, browser-extension-builder | Por tecnología |
| **50-AI** (4) | ai-agent-development, prompt-engineering-patterns, agent-memory-systems, agent-orchestrator | Por contexto IA |
| **60-SECURITY** (3) | api-security-best-practices, security-auditor, code-reviewer | En reviews |
| **70-DATABASE** (3) | prisma-expert, postgresql, sql-optimization-patterns | Por contexto DB |

**Total: 59 skills activas y curadas**

---

## Compact Rules

### 00-CORE Skills

#### sdd-init
```
Initialize SDD context: detect stack, testing capabilities, conventions.
ALWAYS run before any /sdd-* command if not already done.
Creates: sdd-init/{project} topic in engram with project context.
```

#### sdd-explore
```
Explore codebase BEFORE committing to implementation.
Return: approaches comparison, edge cases, gotchas.
Write to: sdd/{change-name}/explore in engram.
```

#### sdd-propose
```
Create change proposal: intent, scope, approach, tradeoffs.
Required for: any significant feature or refactor.
Write to: sdd/{change-name}/proposal in engram.
```

#### sdd-spec
```
Write delta specs: requirements, scenarios, edge cases.
Reads: proposal (required). Writes: spec.
```

#### sdd-design
```
Create technical design: architecture, decisions, approach.
Reads: proposal (required). Writes: design.
```

#### sdd-tasks
```
Break down into implementation checklist.
Reads: spec + design (required). Writes: tasks.
Each task: atomic, testable, with acceptance criteria.
```

#### sdd-apply
```
Implement tasks from the change.
Reads: tasks + spec + design. Writes: code + apply-progress.
Implement in batches, check off items as completed.
```

#### sdd-verify
```
Validate implementation against specs.
Reads: spec + tasks. Writes: verify-report.
Report: CRITICAL | WARNING | SUGGESTION per item.
```

#### documentation
```
Write clear, maintainable documentation.
Structure: overview, quick start, API reference, examples.
Keep docs close to code. Update on changes.
```

### 10-STACK Skills

#### typescript
```
Strict mode: noUncheckedIndexedAccess, noPropertyAccessFromIndexSignature.
Prefer interface for shapes, type for unions.
Always check array access: arr[0] needs undefined check.
Use type keyword for imports: import type { X }.
No any: use unknown with type guards.
```

#### react-19
```
React 19 + Compiler: no useMemo/useCallback unless benchmarked.
Function components with explicit return types.
Destructure props at definition.
useState<T>() with generics for complex state.
```

#### react-best-practices
```
Hoist static content outside render.
Memo for expensive computations only (verify with profiler).
Derived state: compute in render, not in useEffect.
Avoid inline function creation in render for lists.
```

#### zustand-5
```
Store pattern: create() with typed interface.
Selectors: use shallow comparison for objects.
Actions: defined in store, not in components.
Persist: use zustand/middleware for localStorage.
```

#### zod-4
```
Define schemas at module level (not inside functions).
Use .pipe() for transformations.
Error messages: customize with .message().
Infer types: type T = z.infer<typeof schema>.
```

#### tailwind-4
```
Use design tokens: colors, spacing from theme.
Avoid arbitrary values: use config extends.
Responsive: mobile-first with sm:, md:, lg:.
Dark mode: use dark: prefix.
```

#### clean-code
```
Functions: small, do one thing, one level of abstraction.
Names: intention-revealing, pronounceable, searchable.
No comments for bad code—rewrite it.
Error handling: use exceptions, not return codes.
TDD: write test first, then code.
```

#### architecture-patterns
```
Clean Architecture: dependencies point inward.
Hexagonal: ports and adapters pattern.
DDD: bounded contexts, aggregates, value objects.
Separation of concerns: domain, application, infrastructure.
```

#### error-handling-patterns
```
Use Result<T, E> pattern for expected failures.
Circuit breaker for external services.
Retry with exponential backoff.
Graceful degradation: partial functionality on failure.
```

#### testing-patterns
```
Arrange-Act-Assert structure.
Test behavior, not implementation.
Isolated tests: no shared state.
F.I.R.S.T: Fast, Independent, Repeatable, Self-validating, Timely.
```

#### e2e-testing-patterns
```
Page Object Model for UI tests.
Test user flows, not individual elements.
Wait strategies: prefer auto-wait over explicit waits.
Screenshots on failure for debugging.
```

#### tdd-workflow
```
Red: write failing test first.
Green: write minimal code to pass.
Refactor: clean up while keeping tests green.
Commit after each full cycle.
```

#### debugging-strategies
```
Reproduce reliably before debugging.
Binary search: narrow down the problem area.
Logging: add strategic logs, not flood.
Root cause analysis: ask "why" 5 times.
```

### 20-PLATFORM Skills

#### api-patterns
```
REST: use nouns for resources, verbs via HTTP methods.
Versioning: URL path (/v1/) or header.
Pagination: cursor-based for large datasets.
Filtering: query params with consistent naming.
```

#### api-design-principles
```
Consistency: same patterns across all endpoints.
Simplicity: minimal required fields, clear naming.
Evolvability: additive changes, avoid breaking changes.
Documentation: OpenAPI spec always up to date.
```

### 30-WORKFLOW Skills

#### branch-pr
```
Branch naming: {type}/{issue-number}-{description}.
PR title: conventional commit format.
PR body: summary, changes, testing, screenshots.
Draft PR: create early, mark ready after CI passes.
```

#### issue-creation
```
Title: clear, specific, actionable.
Body: context, acceptance criteria, technical notes.
Labels: type (bug/feature), priority, area.
Link: related issues, PRs, docs.
```

#### judgment-day
```
Launch TWO blind judges simultaneously.
Review: architecture, security, performance, testing.
Fix: apply fixes, re-judge until pass or 2 iterations.
Escalate: if judges disagree after 2 rounds, ask user.
```

#### commit
```
Conventional commits: type(scope): description.
Types: feat, fix, docs, style, refactor, test, chore.
Breaking changes: ! after type, FOOTER with details.
Keep commits atomic and focused.
```

#### git-hooks-automation
```
Pre-commit: lint, format, typecheck.
Pre-push: run tests.
Commit-msg: validate conventional format.
Husky + lint-staged for automation.
```

#### github-actions-templates
```
CI: lint, test, build on every PR.
CD: deploy on main merge.
Caching: node_modules, build artifacts.
Secrets: use GitHub Secrets, never commit.
```

### 40-AUTOMATION Skills

#### browser-automation
```
Playwright preferred: cross-browser, auto-waiting.
Use user-facing locators: getByRole, getByLabel.
Never manual waits: rely on auto-wait.
Headless for CI, headed for debugging.
Anti-detection for scraping: stay current.
```

#### browser-extension-builder
```
MV3: service worker, not background page.
Content scripts: minimal, message-passing to background.
Storage: chrome.storage.local for persistence.
Permissions: request minimal, declare in manifest.
```

### 50-AI Skills

#### ai-agent-development
```
Agent loop: perceive → reason → act → observe.
Memory: short-term (context) + long-term (storage).
Tools: give agents capabilities, not instructions.
Safety: guardrails, human approval for critical actions.
```

#### prompt-engineering-patterns
```
Be specific: exact instructions > vague requests.
Examples: few-shot > zero-shot.
Chain-of-thought: reason step by step.
Role prompting: give expertise and context.
```

#### agent-memory-systems
```
Episodic: conversation history.
Semantic: facts and knowledge.
Procedural: learned skills and patterns.
Hybrid: combine all for best results.
```

#### agent-orchestrator
```
Task decomposition: break complex tasks into steps.
Agent routing: match task to specialized agent.
Parallel execution: run independent tasks concurrently.
Result synthesis: combine outputs coherently.
```

### 60-SECURITY Skills

#### api-security-best-practices
```
Auth: JWT with short expiry, refresh tokens.
Authorization: RBAC, principle of least privilege.
Input validation: validate at API boundary.
Rate limiting: per-user, per-IP, per-endpoint.
HTTPS only: no exceptions.
```

#### security-auditor
```
OWASP Top 10: check each vulnerability.
Dependencies: scan for known CVEs.
Secrets: no hardcoded credentials.
Logging: audit trail for sensitive operations.
```

#### code-reviewer
```
Security: injection, auth, data exposure.
Performance: N+1 queries, memory leaks.
Maintainability: complexity, duplication.
Testing: coverage, edge cases.
```

### 70-DATABASE Skills

#### prisma-expert
```
Schema: explicit relations with @relation directive.
Migrations: never use migrate dev in production.
Query optimization: use select, avoid N+1 with include.
Connection: configure pool size for environment.
Transactions: use $transaction for atomic operations.
```

#### postgresql
```
Indexes: B-tree for equality, GIN for arrays/json.
Query analysis: EXPLAIN ANALYZE for slow queries.
Vacuum: monitor bloat, schedule autovacuum.
Connection pooling: PgBouncer for high traffic.
```

#### sql-optimization-patterns
```
Avoid SELECT *: fetch only needed columns.
Indexes: on WHERE, JOIN, ORDER BY columns.
Batch operations: bulk insert/update.
Query cache: use prepared statements.
Denormalization: for read-heavy workloads.
```

---

## User Skills Trigger Table

| Skill | Trigger |
|-------|---------|
| typescript | `.ts` files, `tsconfig.json` |
| react-19 | `.tsx`, `.jsx` files |
| react-best-practices | React performance, refactoring |
| zustand-5 | `zustand`, `create(`, `useStore` |
| zod-4 | `z.object`, `z.string`, schema |
| tailwind-4 | `className=`, `tailwind.config` |
| clean-code | Refactoring, code review |
| architecture-patterns | New modules, restructuring |
| testing-patterns | `*.test.*`, `*.spec.*` |
| tdd-workflow | "TDD", "test first" |
| prisma-expert | `schema.prisma`, Prisma queries |
| postgresql | Postgres-specific queries |
| browser-automation | Playwright, Puppeteer, scraping |
| browser-extension-builder | Chrome extension, MV3 |
| api-patterns | REST API design |
| branch-pr | Creating PR |
| judgment-day | "judgment day", "review adversarial" |
| commit | Git commit message |
| github-actions-templates | CI/CD, GitHub Actions |
| security-auditor | Security review, audit |

---

## Project Conventions

- `AGENTS.md` — Build commands, code style, architecture decisions
- `packages/types/src/` — Shared TypeScript types (Platform, PostStatus, etc.)
- `packages/database/prisma/schema.prisma` — Database schema
- `apps/desktop/src-tauri/` — Rust backend (Anti-Ban Engine)
- `apps/extension/src/` — Chrome Extension MV3

---

## Vault (Inactive Skills)

The following skills exist in the project but are NOT loaded by default:

- `skills/99-VAULT/antigravity/skills/` — ~1,350 skills (browse manually if needed)
- `skills/99-VAULT/affaan-m/` — Alternative agent configs
- `skills/99-VAULT/davila7/` — Additional templates

To activate a vault skill manually:
```
Consulta skills/99-VAULT/antigravity/skills/{skill-name}/SKILL.md
```

---

*Last updated: 2026-04-10 (SDD Init)*

---

## Rust Context Rules (Auto-inject)

```markdown
<!-- rust-rules -->
- Functions: snake_case (`get_platform_config`)
- Structs/Enums: PascalCase (`AntiBanEngine`, `BanRisk`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_HISTORY_SIZE`)
- Use `thiserror` for custom errors
- Return `Result<T, String>` for Tauri commands
- Use `?` operator for error propagation
- `#[derive(Debug, Clone, Serialize, Deserialize)]` for API types
- Implement `Default` trait when appropriate
- Async commands: use `.await` in handler
```
