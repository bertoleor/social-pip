# Tasks: Warn on corrupt registry files (ORN-17 residual)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 20–40 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single commit to master |
| Delivery strategy | single-pr |
| Chain strategy | pending |
| Runtime harness | `python skills/50-AI/agent-orchestrator/scripts/scan_registry.py --status` |
| Rollback boundary | Revert single commit (fallback defaults unchanged) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: RED — failing tests

- [ ] 1.1 Create `tests/test_registry_corrupt_logging.py` with corrupt-hashes and corrupt-registry cases asserting WARNING + defaults (expect RED: no logging yet)
- [ ] 1.2 Run `python -m pytest tests/test_registry_corrupt_logging.py -q` and confirm RED

## Phase 2: GREEN — implementation

- [ ] 2.1 Add `logging.getLogger(__name__)` to `skills/50-AI/agent-orchestrator/scripts/scan_registry.py`
- [ ] 2.2 Replace `pass` in `load_hashes()` with `logger.warning` (path + error), keep `return {}`
- [ ] 2.3 Replace `pass` in `load_registry()` with `logger.warning` (path + error), keep default return

## Phase 3: Verification

- [ ] 3.1 `python -m pytest -q` → full suite green (spec: corrupt warns, missing/valid silent)
- [ ] 3.2 `python -m ruff check` on touched files → clean
- [ ] 3.3 Runtime harness `--status` still works

## Phase 4: Delivery

- [ ] 4.1 Update Linear ORN-17 (comment with evidence + move toward Done)
- [ ] 4.2 Commit + push (never touch `skills/00-CORE/specweave`, `20-PLATFORM/rust-skills`, `99-VAULT/antigravity` personalizado)
