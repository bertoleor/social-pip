# Registry Observability Specification

## Purpose

Corrupt agent-orchestrator state files MUST be observable: operators see a warning instead of a silent fallback to empty defaults.

## Requirements

### Requirement: Corrupt Hashes File Warns

The system MUST log a warning when `registry_hashes.json` exists but cannot be parsed, and MUST still return an empty dict.

#### Scenario: Corrupt hashes file

- GIVEN `registry_hashes.json` exists with invalid JSON
- WHEN `load_hashes()` runs
- THEN it returns `{}`
- AND it emits one WARNING log naming the path

#### Scenario: Missing hashes file

- GIVEN `registry_hashes.json` does not exist
- WHEN `load_hashes()` runs
- THEN it returns `{}` with no warning

### Requirement: Corrupt Registry File Warns

The system MUST log a warning when `registry.json` exists but cannot be parsed, and MUST still return the empty-registry default.

#### Scenario: Corrupt registry file

- GIVEN `registry.json` exists with invalid JSON
- WHEN `load_registry()` runs
- THEN it returns the default `{"generated_at": None, ...}`
- AND it emits one WARNING log naming the path

#### Scenario: Valid registry file stays silent

- GIVEN `registry.json` holds valid JSON
- WHEN `load_registry()` runs
- THEN it returns the parsed content with no warning
