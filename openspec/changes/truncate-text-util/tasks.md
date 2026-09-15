# Tasks: truncate-text-util

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 40–70 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single commit to master |
| Delivery strategy | single-pr |
| Chain strategy | pending |
| Runtime harness | N/A (pure function; pytest is the harness) |
| Rollback boundary | Revert single commit (no importers) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: RED — failing tests

- [x] 1.1 Create `tests/test_truncate_text.py` covering spec scenarios (long/default, custom suffix, short, exact, ValueError x2, TypeError)
- [x] 1.2 Run `python -m pytest tests/test_truncate_text.py -q` and confirm RED (module missing)

## Phase 2: GREEN — implementation

- [x] 2.1 Create `skills/50-AI/agent-orchestrator/scripts/text_utils.py` with pure `truncate_text`
- [x] 2.2 Run new tests → GREEN, then full `python -m pytest -q` → green

## Phase 3: Verification

- [x] 3.1 `python -m pytest -q` → full suite green (20 passed)
- [x] 3.2 `python -m ruff check` on touched files → clean (+ `ruff format --check` clean)
- [x] 3.3 Write `openspec/changes/truncate-text-util/verify.md` with real evidence

## Phase 4: Delivery

- [x] 4.1 Commit (only own files, no push)
