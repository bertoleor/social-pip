# Proposal: Warn on corrupt registry files (ORN-17 residual)

## Intent

Close the last residual of audit gap A2 (`docs/audits/general-socialpip.md`): `load_hashes` / `load_registry` in `scan_registry.py` still swallow corrupt files with bare `pass`. A corrupt `registry_hashes.json` / `registry.json` silently degrades to empty defaults with zero observability.

## Scope

### In Scope
- `logger.warning` on corrupt `registry_hashes.json` in `load_hashes`
- `logger.warning` on corrupt `registry.json` in `load_registry`
- RED-first tests proving warning + fallback defaults

### Out of Scope
- Retry / backup / repair of corrupt files (future work)
- Other ORN-17 items (A1 blind-excepts, A3 subprocess-check: already fixed, ruff clean)
- B/C-tier debt (datetime-naive, RUF013, templates)

## Capabilities

### New Capabilities
- `registry-observability`: corrupt registry/hash files MUST emit a warning log while keeping empty-default fallback.

### Modified Capabilities
- None (behavior preserved; only observability added).

## Approach

Add module `logging.getLogger(__name__)` to `scan_registry.py`; replace the two `pass` handlers with `logger.warning` including path + exception. No new dependencies, no stdout/stderr prints (library-style logging; CLI unaffected).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `skills/50-AI/agent-orchestrator/scripts/scan_registry.py` | Modified | logging import + 2 warning handlers |
| `tests/test_registry_corrupt_logging.py` | New | RED-first tests for both loaders |
| `openspec/changes/fix-silent-except-orn-17/specs/` | New | capability spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Log noise on every scan when file corrupt | Low | warning fires once per load call, same frequency as today’s silent fallback |
| Test imports pull heavy module deps | Low | loaders depend only on stdlib + paths; monkeypatch `HASHES_PATH`/`REGISTRY_PATH` |

## Rollback Plan

Revert single commit; fallback defaults (`{}`, empty registry) are unchanged so rollback is behavior-neutral.

## Dependencies

- None. pytest runner present (`pytest.ini`, `tests/` green 10/10).

## Success Criteria

- [ ] Corrupt hashes/registry file → warning logged + defaults returned
- [ ] `python -m pytest -q` green (incl. 2+ new tests)
- [ ] `ruff check` clean on touched files
- [ ] ORN-17 Linear mirror updated
