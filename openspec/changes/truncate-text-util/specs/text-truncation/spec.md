# Text-Truncation Specification

## Purpose

Shared pure helper for truncating display strings (status tables, logs) with an explicit suffix.

## Requirements

### Requirement: Truncate long text with suffix

The system MUST return `text[:max_len - len(suffix)] + suffix` when `len(text) > max_len`.

#### Scenario: Long name gets suffix

- GIVEN `text="agent-orchestrator-registry"` and `max_len=20`
- WHEN `truncate_text` is called with default suffix
- THEN result has length 20 and ends with `"…"` (spec pins `len <= max_len`)

#### Scenario: Custom suffix

- GIVEN `text="abcdef"` and `max_len=5` and `suffix="..."`
- WHEN called
- THEN result equals `"ab..."`

### Requirement: Preserve short text untouched

The system MUST return `text` unchanged when `len(text) <= max_len`.

#### Scenario: Short text passthrough

- GIVEN `text="scan"` and `max_len=20`
- WHEN called
- THEN result equals `"scan"`

#### Scenario: Exact-length passthrough

- GIVEN `text="abcde"` and `max_len=5`
- WHEN called
- THEN result equals `"abcde"` (no suffix appended)

### Requirement: Reject invalid input explicitly

The system MUST raise `ValueError` when `max_len < 1` or `len(suffix) >= max_len`, and `TypeError` when `text` is not `str`.

#### Scenario: Zero max_len rejected

- GIVEN `max_len=0`
- WHEN called
- THEN `ValueError` is raised

#### Scenario: Oversized suffix rejected

- GIVEN `max_len=2` and `suffix="..."`
- WHEN called
- THEN `ValueError` is raised
