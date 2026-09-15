# Design: truncate-text-util

## Decision

New module `skills/50-AI/agent-orchestrator/scripts/text_utils.py` with a single pure function:

```python
def truncate_text(text: str, max_len: int, suffix: str = "…") -> str
```

No I/O, no logging, no globals. Stdlib only, zero dependencies.

## Semantics

- `len(text) <= max_len` → return `text` unchanged.
- `len(text) > max_len` → return `text[:max_len - len(suffix)] + suffix`, so `len(result) == max_len`.
- Guards (fail fast, before any slicing):
  - non-`str` text → `TypeError`
  - `max_len < 1` → `ValueError`
  - `len(suffix) >= max_len` → `ValueError`
- Default suffix `"…"` (U+2026, single char) keeps tables compact; callers needing ASCII pass `suffix="..."`.

## Non-goals

- No rewiring of `print_status` here (follow-up change swaps `[:20]` / `[:30]` for this helper).
- No grapheme-cluster/terminal-width handling; `len()` semantics, pinned by tests.
