# Okuden 奥伝

Public web reference for Windows internal APIs — ntdll syscalls and undocumented helpers, Win32 user-mode DLLs, and internal structures (PEB, TEB, OBJECT_ATTRIBUTES, …).

> *Okuden* (奥伝) — "secret transmission". The deepest layer of teaching, traditionally passed only to advanced students.

## Status

Foundation phase. The monorepo, schemas, and a small hand-curated dataset are in place. The web app and ingest pipeline are tracked in separate plans (see `docs/superpowers/plans/`).

## Repository layout

| Path                    | License        | Purpose                                                      |
| ----------------------- | -------------- | ------------------------------------------------------------ |
| `apps/web/`             | MIT            | Astro static site (populated by Plan 2)                      |
| `packages/data/`        | CC BY-SA 4.0   | JSON Schemas + JSON dataset (the canonical content)          |
| `packages/ingest/`      | MIT            | Python ingest pipeline (populated by Plan 3)                 |
| `docs/superpowers/`     | —              | Design spec and implementation plans                         |

## Develop locally

Prerequisites: Node 20+ (`.nvmrc` is honored), pnpm 9+, Python 3.12+ (ensure `python3 --version` reports 3.12 or higher).

```bash
pnpm install
pnpm validate:data

cd packages/ingest
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest
```

CI runs the same commands on every push and pull request (see `.github/workflows/verify.yml`).

## Contributing

For the V1 phase, contributions go through pull requests against `packages/data/`. See the design spec at `docs/superpowers/specs/2026-05-05-okuden-design.md` for scope and conventions. New entries must validate against the JSON Schemas — `pnpm validate:data` is the gate.

## License

This repository is multi-licensed. See `LICENSE` at the root for the breakdown, and the per-package `LICENSE` files for the legal text.
