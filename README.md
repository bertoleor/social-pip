# Social-Pip

Automatización de redes sociales 100% gratuita para Argentina/LATAM.

## Status

![Test Coverage](https://img.shields.io/badge/coverage-80%25%20lines%20%7C%2075%25%20branches%20%7C%2085%25%20functions-brightgreen)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind 4
- **Backend**: Tauri 2.0 (Rust)
- **State**: Zustand 5
- **Testing**: Vitest + Testing Library

## Development

```bash
pnpm install
pnpm dev
```

## Testing

```bash
pnpm test
pnpm test:coverage
```

## Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Branches | 75% |
| Functions | 85% |
| Statements | 80% |

CI enforces these thresholds on every push and PR.
