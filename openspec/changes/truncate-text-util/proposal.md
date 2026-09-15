# Proposal: Shared pure text truncator (truncate-text-util)

## Intent

`print_status` in `scan_registry.py` truncates with ad-hoc `[:20]` / `[:30]` slices. No shared, tested helper exists. Centralize in one pure function.

## Scope

### In Scope
- Pure `truncate_text(text, max_len, suffix="…")` in new `skills/50-AI/agent-orchestrator/scripts/text_utils.py`
- RED-first tests in `tests/test_truncate_text.py`
- No behavior change in `scan_registry.py` (wiring deferred)

### Out of Scope
- Rewiring `print_status` to use it (follow-up change)
- Other string helpers, i18n, terminal-width detection

## Capabilities

### New Capabilities
- `text-truncation`: pure truncation MUST preserve short strings, cut + suffix long ones, and reject bad input explicitly.

### Modified Capabilities
- None (no existing spec covers truncation; additive only).

## Approach

New dependency-free module with one pure function (no I/O, no logging, no globals). Strict TDD: RED test → GREEN impl → full suite + ruff.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `skills/50-AI/agent-orchestrator/scripts/text_utils.py` | New | pure `truncate_text` |
| `tests/test_truncate_text.py` | New | RED-first tests |
| `openspec/changes/truncate-text-util/specs/` | New | capability spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dead code until wired | Low | spec marks wiring as follow-up; function is tested and documented |
| Unicode suffix width confusion | Low | suffix length counts toward `max_len`; tests pin it |

## Rollback Plan

Revert single commit; nothing else imports the new module so rollback is behavior-neutral.

## Dependencies

- None. Runners: `python -m pytest -q`, `python -m ruff check`.

## Success Criteria

- [ ] `truncate_text` passes all spec scenarios
- [ ] `python -m pytest -q` green (incl. new tests)
- [ ] `python -m ruff check` clean on touched files
