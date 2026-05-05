# Okuden Ingest Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Python ingest pipeline that produces `packages/data/{api,struct,version}/*.json` automatically from authoritative sources (Microsoft PDBs, phnt headers, ReactOS/Wine sources, j00ru syscall tables), replacing the 13 hand-curated fixtures shipped in Plan 1 with a regenerable dataset.

**Architecture:** Six-stage pipeline orchestrated by a single CLI entry point `okuden-ingest run`. Each stage is a pure module under `okuden_ingest/`: download → parse → reconcile → emit → validate. Sources are cached locally to avoid re-downloading; the pipeline is idempotent and atomic (failure leaves the previous dataset intact). Real PDB integration tests are opt-in to keep CI fast.

**Tech Stack:** Python 3.12, `pdbparse` for PDB parsing, `pefile` for PE import tables, `httpx` for symsrv downloads, `click` for the CLI, `pytest` for tests, `jsonschema` for output validation (already wired in Plan 1). External git checkouts: `winsiderss/systeminformer` (phnt, vendored as submodule), ReactOS and Wine cloned on demand.

---

## Decisions locked in (validated during brainstorming)

- **phnt source**: `winsiderss/systeminformer` vendored as a git submodule at `packages/ingest/vendored/phnt/` (a sparse-checkout pointing only at the `phnt/` subdirectory of that repo).
- **phnt parser**: regex-based, custom Python ~200 lines. Covers function declarations and struct definitions in the form phnt actually uses. tree-sitter migration deferred to V2.
- **PDB tests**: hybrid. Unit tests use 5–10 small "minified" PDB fixtures committed to `packages/ingest/tests/fixtures/pdb/` (tens of KB each — extracted with `cvdump`/`pdbminify`-style tooling, scoped to a few APIs/structs we care about). Integration tests opt-in via `@pytest.mark.integration`, skipped in CI by default, run with `pytest -m integration` against real downloads.

## Out-of-scope deferrals

- **Adding new DLLs to the schema enum** (shell32, ole32, crypt32, etc.). The current `dll` enum is fixed to 6 values. Extending it is a Plan 1 schema bump task, separately tracked.
- **The `partial` vs `undocumented` tag distinction** is heuristic; we don't aim for perfect classification in V1.
- **Cross-platform Windows version targeting** (ARM64 vs x64). V1 is x64 only. ARM64 builds emit identical schema entries with a `arm64` key in `syscall.ssn` if needed; deferred for now.
- **Live "watch" mode** (continuous re-ingest on file change). V1 is batch-only.
- **Authoritative SSN updates from Microsoft directly** (vs j00ru). j00ru is the source of record because Microsoft does not publish SSNs.

---

## File Structure

Files this plan creates or modifies (all under `/home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/`):

```
packages/ingest/
├── pyproject.toml                                  # Modified — Task 1
├── okuden_ingest/
│   ├── __init__.py                                 # exists, unchanged
│   ├── validate.py                                 # exists from Plan 1
│   ├── cli.py                                      # Task 1 (entry point)
│   ├── config.py                                   # Task 1
│   ├── log.py                                      # Task 1
│   ├── cache.py                                    # Task 4
│   ├── sources/
│   │   ├── __init__.py                             # Task 1
│   │   ├── pdb_download.py                         # Task 6
│   │   ├── reactos.py                              # Task 7
│   │   ├── wine.py                                 # Task 8
│   │   └── j00ru.py                                # Task 15 (parser; data committed in Task 3)
│   ├── parsers/
│   │   ├── __init__.py                             # Task 1
│   │   ├── pdb_funcs.py                            # Task 10
│   │   ├── pdb_structs.py                          # Task 11
│   │   ├── phnt_funcs.py                           # Task 12
│   │   ├── phnt_structs.py                         # Task 13
│   │   ├── phnt_index.py                           # Task 14
│   │   └── pe_imports.py                           # Task 17
│   ├── reconcile/
│   │   ├── __init__.py                             # Task 1
│   │   ├── functions.py                            # Task 18
│   │   ├── structs.py                              # Task 19
│   │   ├── tags.py                                 # Task 20
│   │   ├── category.py                             # Task 21
│   │   └── graph.py                                # Task 22
│   ├── emit/
│   │   ├── __init__.py                             # Task 1
│   │   ├── api.py                                  # Task 23
│   │   ├── struct.py                               # Task 24
│   │   └── version.py                              # Task 25
│   └── pipeline.py                                 # Task 27 (orchestration)
├── vendored/
│   └── phnt/                                       # Task 2 (git submodule)
├── sources/
│   └── j00ru-syscalls/
│       └── syscalls.csv                            # Task 3 (committed snapshot)
└── tests/
    ├── __init__.py                                 # exists
    ├── test_validate.py                            # exists from Plan 1
    ├── conftest.py                                 # Task 1
    ├── fixtures/
    │   ├── pdb/                                    # Task 28 (binary fixtures)
    │   ├── phnt/                                   # Task 12-14 (test header snippets)
    │   └── pe/                                     # Task 17 (test PE binaries)
    ├── test_pdb_funcs.py                           # Task 10
    ├── test_pdb_structs.py                         # Task 11
    ├── test_phnt_funcs.py                          # Task 12
    ├── test_phnt_structs.py                        # Task 13
    ├── test_phnt_index.py                          # Task 14
    ├── test_j00ru.py                               # Task 15
    ├── test_pe_imports.py                          # Task 17
    ├── test_reconcile_funcs.py                     # Task 18
    ├── test_reconcile_structs.py                   # Task 19
    ├── test_tags.py                                # Task 20
    ├── test_category.py                            # Task 21
    ├── test_graph.py                               # Task 22
    ├── test_emit.py                                # Task 23-25
    └── test_pipeline_integration.py                # Task 28 (opt-in)

.github/workflows/
├── verify.yml                                      # Modified — Task 1 (drops obsolete env), Task 30 (none)
└── ingest-nightly.yml                              # Task 30

.gitmodules                                         # Task 2

apps/web/src/pages/about.astro                      # Task 30 (update sources block)
README.md                                           # Task 30 (mention pipeline)
```

---

## Task 1: CLI scaffolding + dependencies

**Files:**
- Modify: `packages/ingest/pyproject.toml` (add deps: pdbparse, pefile, httpx, click)
- Create: `packages/ingest/okuden_ingest/cli.py`
- Create: `packages/ingest/okuden_ingest/config.py`
- Create: `packages/ingest/okuden_ingest/log.py`
- Create: `packages/ingest/okuden_ingest/sources/__init__.py` (empty)
- Create: `packages/ingest/okuden_ingest/parsers/__init__.py` (empty)
- Create: `packages/ingest/okuden_ingest/reconcile/__init__.py` (empty)
- Create: `packages/ingest/okuden_ingest/emit/__init__.py` (empty)
- Create: `packages/ingest/tests/conftest.py`

- [ ] **Step 1: Update `packages/ingest/pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "okuden-ingest"
version = "0.1.0"
description = "Okuden ingest pipeline — parses PDBs, phnt, ReactOS/Wine, j00ru into the canonical JSON dataset."
requires-python = ">=3.12"
dependencies = [
  "jsonschema>=4.21",
  "click>=8.1",
  "httpx>=0.27",
  "pefile>=2024.8.26",
  "pdbparse>=1.5",
  "construct>=2.10",
]

[project.optional-dependencies]
dev = [
  "pytest>=8",
  "pytest-cov>=5",
]

[project.scripts]
okuden-ingest = "okuden_ingest.cli:main"

[tool.hatch.build.targets.wheel]
packages = ["okuden_ingest"]

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
  "integration: opt-in tests that hit network or disk-heavy real PDBs",
]
```

- [ ] **Step 2: Create `packages/ingest/okuden_ingest/log.py`**

```python
"""Centralized logging configuration."""
import logging
import sys


def configure(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        stream=sys.stderr,
        level=level,
        format="%(asctime)s %(levelname).1s %(name)s | %(message)s",
        datefmt="%H:%M:%S",
    )


def get(name: str) -> logging.Logger:
    return logging.getLogger(name)
```

- [ ] **Step 3: Create `packages/ingest/okuden_ingest/config.py`**

```python
"""Pipeline configuration. Single source of truth for paths and target versions."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# Walk up from this file to the repo root: okuden_ingest/ -> ingest/ -> packages/ -> repo.
REPO_ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class WindowsTarget:
    """A specific Windows build we ingest data for."""
    id: str
    display_name: str
    build_number: str
    release_date: str
    is_current: bool


# The Windows builds we target in V1. Mirrors packages/data/version/*.json.
TARGETS: tuple[WindowsTarget, ...] = (
    WindowsTarget("win10-22h2", "Windows 10 22H2", "19045", "2022-10-18", False),
    WindowsTarget("win11-23h2", "Windows 11 23H2", "22631", "2023-10-31", False),
    WindowsTarget("win11-24h2", "Windows 11 24H2", "26100", "2024-10-01", True),
)


# The DLLs we ingest. Must match packages/data/schemas/api.schema.json `dll` enum.
SUPPORTED_DLLS: tuple[str, ...] = (
    "ntdll", "kernel32", "kernelbase", "advapi32", "user32", "ws2_32",
)


@dataclass
class Paths:
    """Filesystem layout. Always derived from REPO_ROOT for portability."""
    repo: Path = REPO_ROOT
    data: Path = field(default_factory=lambda: REPO_ROOT / "packages" / "data")
    cache: Path = field(default_factory=lambda: REPO_ROOT / "packages" / "ingest" / ".cache")
    vendored_phnt: Path = field(
        default_factory=lambda: REPO_ROOT / "packages" / "ingest" / "vendored" / "phnt"
    )
    j00ru_csv: Path = field(
        default_factory=lambda: REPO_ROOT / "packages" / "ingest" / "sources" / "j00ru-syscalls" / "syscalls.csv"
    )

    def pdb_dir(self, target_id: str) -> Path:
        return self.cache / "pdb" / target_id

    def reactos_dir(self) -> Path:
        return self.cache / "reactos"

    def wine_dir(self) -> Path:
        return self.cache / "wine"


PATHS = Paths()
```

- [ ] **Step 4: Create `packages/ingest/okuden_ingest/cli.py`**

```python
"""CLI entry point. ``okuden-ingest`` runs the pipeline."""
from __future__ import annotations

import sys

import click

from . import log


@click.group()
@click.option("--verbose", "-v", is_flag=True, help="Enable debug logging.")
@click.pass_context
def main(ctx: click.Context, verbose: bool) -> None:
    """Okuden ingest pipeline."""
    log.configure(verbose=verbose)
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose


@main.command()
@click.pass_context
def run(ctx: click.Context) -> None:
    """Run the full pipeline: download → parse → reconcile → emit → validate."""
    # Wired in Task 27.
    click.echo("pipeline.run is not implemented yet (filled in by Task 27)", err=True)
    sys.exit(1)


@main.command()
@click.pass_context
def info(ctx: click.Context) -> None:
    """Print configuration (paths, targets, DLLs)."""
    from .config import PATHS, TARGETS, SUPPORTED_DLLS
    click.echo(f"Repo root: {PATHS.repo}")
    click.echo(f"Data dir:  {PATHS.data}")
    click.echo(f"Cache dir: {PATHS.cache}")
    click.echo(f"Targets:")
    for t in TARGETS:
        marker = "*" if t.is_current else " "
        click.echo(f"  {marker} {t.id} ({t.display_name}, build {t.build_number})")
    click.echo(f"DLLs: {', '.join(SUPPORTED_DLLS)}")


if __name__ == "__main__":
    main(obj={})
```

- [ ] **Step 5: Create empty `__init__.py` in each new subpackage**

Empty files at:
- `packages/ingest/okuden_ingest/sources/__init__.py`
- `packages/ingest/okuden_ingest/parsers/__init__.py`
- `packages/ingest/okuden_ingest/reconcile/__init__.py`
- `packages/ingest/okuden_ingest/emit/__init__.py`

- [ ] **Step 6: Create `packages/ingest/tests/conftest.py`**

```python
"""Shared pytest fixtures."""
from __future__ import annotations

from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture
def fixtures() -> Path:
    return FIXTURES_DIR
```

- [ ] **Step 7: Reinstall in editable mode and verify CLI works**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/packages/ingest
.venv/bin/pip install -e .[dev]
.venv/bin/okuden-ingest info
```

Expected: prints repo root, data dir, cache dir, 3 targets (win10-22h2, win11-23h2, win11-24h2*), 6 DLLs.

- [ ] **Step 8: Verify existing tests still pass**

```bash
.venv/bin/pytest -v
```

Expected: 7 tests pass (the validate.py tests from Plan 1).

- [ ] **Step 9: Commit**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
git add packages/ingest/pyproject.toml \
        packages/ingest/okuden_ingest/cli.py \
        packages/ingest/okuden_ingest/config.py \
        packages/ingest/okuden_ingest/log.py \
        packages/ingest/okuden_ingest/sources/__init__.py \
        packages/ingest/okuden_ingest/parsers/__init__.py \
        packages/ingest/okuden_ingest/reconcile/__init__.py \
        packages/ingest/okuden_ingest/emit/__init__.py \
        packages/ingest/tests/conftest.py
git commit -m "ingest: add CLI scaffolding (config, logging, click entry point)"
```

---

## Task 2: Vendor phnt as git submodule

**Files:**
- Create: `.gitmodules`
- Add submodule at: `packages/ingest/vendored/phnt-source` (full systeminformer repo)
- Create: `packages/ingest/vendored/phnt/README.md` (pointer)

We vendor the full `winsiderss/systeminformer` repo as a submodule at a known commit. We then symlink (or document the path to) its `phnt/` subdirectory.

A simpler alternative: clone shallowly, copy the `phnt/` subdir into our tree, commit. Drawbacks: no automatic updates, lose attribution. Stick with submodule.

- [ ] **Step 1: Add the submodule**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
git submodule add --depth=1 \
  https://github.com/winsiderss/systeminformer.git \
  packages/ingest/vendored/phnt-source
git submodule update --init --depth=1 packages/ingest/vendored/phnt-source
```

This creates `.gitmodules` and pulls the repo. We'll point the parser at `packages/ingest/vendored/phnt-source/phnt/` directly.

- [ ] **Step 2: Pin to a specific commit for reproducibility**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/packages/ingest/vendored/phnt-source
# Check out the latest stable tag — at time of plan writing, "phnt-29.x" series.
git checkout master    # use master HEAD initially; future updates pin to a tag.
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
```

NOTE: pin to a stable tag once the implementer has confirmed which tag is appropriate. For initial setup, master is acceptable and can be tightened later.

- [ ] **Step 3: Create a README pointer**

`packages/ingest/vendored/phnt/README.md`:

```markdown
# phnt headers (vendored via git submodule)

The `phnt-source/` submodule is `winsiderss/systeminformer` pinned to a specific
commit. The headers we parse live in `phnt-source/phnt/`. Update with:

    git submodule update --remote packages/ingest/vendored/phnt-source

…then commit the new submodule SHA.

License: phnt is MIT-licensed (see `phnt-source/LICENSE`). We do NOT
redistribute its source — only consume it at build time.
```

Note the path: this is a placeholder marker. The actual headers consumed at parse time live one directory up from this README, in `phnt-source/phnt/`.

- [ ] **Step 4: Verify the submodule resolves**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
git submodule status
ls packages/ingest/vendored/phnt-source/phnt/ | head -10
```

Expected: a status line with the pinned SHA and a list including `ntpebteb.h`, `ntioapi.h`, `ntpsapi.h`, etc.

- [ ] **Step 5: Update Plan 1's `.gitignore` to NOT ignore the submodule**

The Plan 1 `.gitignore` is at the repo root and includes `__pycache__/`, etc. The submodule directory is tracked via `.gitmodules`, but inside the submodule git artifacts may appear. Verify nothing leaks:

```bash
git status -sb
```

Expected: no untracked files inside the submodule (git knows it's a submodule).

- [ ] **Step 6: Commit**

```bash
git add .gitmodules \
        packages/ingest/vendored/phnt-source \
        packages/ingest/vendored/phnt/README.md
git commit -m "ingest: vendor winsiderss/systeminformer phnt headers via git submodule"
```

---

## Task 3: Commit a j00ru SSN tables snapshot

**Files:**
- Create: `packages/ingest/sources/j00ru-syscalls/syscalls.csv` (committed snapshot)
- Create: `packages/ingest/sources/j00ru-syscalls/README.md`

j00ru maintains comprehensive SSN tables for ntdll syscalls across Windows versions. The canonical source is at `https://github.com/j00ru/windows-syscalls`. We commit a CSV snapshot (pinned, regenerable) rather than scraping live.

- [ ] **Step 1: Generate the CSV from a clone**

```bash
cd /tmp
git clone --depth=1 https://github.com/j00ru/windows-syscalls.git j00ru-clone
cd j00ru-clone
ls
# Inspect the data — j00ru's repo has CSVs/markdown per architecture
```

The implementer should locate the most appropriate file (typically `x64/Win10_x64/Win10_22H2.csv` or similar). Combine the data we need into a single CSV with this header:

```csv
api_name,version_id,ssn_decimal
NtCreateFile,win10-22h2,85
NtCreateFile,win11-23h2,85
NtCreateFile,win11-24h2,85
NtOpenProcess,win10-22h2,38
...
```

Cover at minimum the 5 ntdll APIs in our V1 dataset (NtCreateFile, NtOpenProcess, NtAllocateVirtualMemory, NtReadFile, NtWriteFile) plus enough additional syscalls that the cross-reference test (Task 18) is meaningful — aim for ~50-100 entries. The full j00ru list has ~600 syscalls per Windows version; a curated subset is fine for V1.

Save to `packages/ingest/sources/j00ru-syscalls/syscalls.csv`.

- [ ] **Step 2: Create the README**

`packages/ingest/sources/j00ru-syscalls/README.md`:

```markdown
# j00ru syscall tables (snapshot)

`syscalls.csv` is a curated subset of j00ru's tables (https://github.com/j00ru/windows-syscalls).

Schema:

| column        | type        | example          |
| ------------- | ----------- | ---------------- |
| api_name      | string      | NtCreateFile     |
| version_id    | string      | win11-24h2       |
| ssn_decimal   | int         | 85               |

To regenerate, see `packages/ingest/okuden_ingest/sources/j00ru.py:fetch_and_emit`
(filled in by Plan 3 Task 15) or manually pull from the upstream repo.

License: j00ru's data is published under MIT. Attribution: j00ru via
https://github.com/j00ru/windows-syscalls.
```

- [ ] **Step 3: Commit**

```bash
git add packages/ingest/sources/j00ru-syscalls/syscalls.csv \
        packages/ingest/sources/j00ru-syscalls/README.md
git commit -m "ingest: commit j00ru SSN tables snapshot (curated subset)"
```

---

## Task 4: Cache directory abstraction

**Files:**
- Create: `packages/ingest/okuden_ingest/cache.py`
- Modify: `packages/ingest/.gitignore` (NEW file — ignore `.cache/`)
- Create: `packages/ingest/tests/test_cache.py`

The cache abstraction is a tiny layer that ensures cache directories exist, provides atomic writes (temp file + rename), and tracks what's been downloaded so subsequent runs can skip.

- [ ] **Step 1: Create `packages/ingest/.gitignore`**

```
.cache/
.venv/
*.egg-info/
__pycache__/
.pytest_cache/
.coverage
```

(The repo's root `.gitignore` already covers most of these via Plan 1, but a per-package `.gitignore` is conventional.)

- [ ] **Step 2: Write the failing test in `tests/test_cache.py`**

```python
"""Cache abstraction: atomic writes, idempotent ensures."""
from __future__ import annotations

from pathlib import Path

import pytest

from okuden_ingest.cache import Cache


def test_atomic_write_creates_file_with_content(tmp_path: Path) -> None:
    cache = Cache(tmp_path)
    target = tmp_path / "subdir" / "file.txt"
    cache.atomic_write_text(target, "hello")
    assert target.read_text(encoding="utf-8") == "hello"


def test_atomic_write_replaces_existing(tmp_path: Path) -> None:
    cache = Cache(tmp_path)
    target = tmp_path / "f.txt"
    cache.atomic_write_text(target, "old")
    cache.atomic_write_text(target, "new")
    assert target.read_text(encoding="utf-8") == "new"


def test_atomic_write_no_partial_on_fail(tmp_path: Path) -> None:
    cache = Cache(tmp_path)
    target = tmp_path / "f.txt"
    cache.atomic_write_text(target, "good")
    # Caller raises mid-write; verify temp file cleaned up.
    with pytest.raises(RuntimeError, match="boom"):
        with cache.open_atomic(target, "w") as f:
            f.write("partial")
            raise RuntimeError("boom")
    assert target.read_text(encoding="utf-8") == "good"  # original preserved
    assert not any(p.name.startswith(".tmp.") for p in tmp_path.iterdir())


def test_ensure_dir_idempotent(tmp_path: Path) -> None:
    cache = Cache(tmp_path)
    cache.ensure_dir(tmp_path / "a" / "b" / "c")
    cache.ensure_dir(tmp_path / "a" / "b" / "c")  # second call must not fail
    assert (tmp_path / "a" / "b" / "c").is_dir()
```

- [ ] **Step 3: Run, expect FAIL**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/packages/ingest
.venv/bin/pytest tests/test_cache.py -v
```

Expected: ImportError because `okuden_ingest.cache` doesn't exist.

- [ ] **Step 4: Implement `packages/ingest/okuden_ingest/cache.py`**

```python
"""Filesystem cache with atomic writes."""
from __future__ import annotations

import contextlib
import os
import tempfile
from pathlib import Path
from typing import IO, Iterator


class Cache:
    """Wraps a cache root with helpers for safe writes."""

    def __init__(self, root: Path) -> None:
        self.root = Path(root)

    def ensure_dir(self, path: Path) -> Path:
        path.mkdir(parents=True, exist_ok=True)
        return path

    def atomic_write_text(self, target: Path, content: str) -> None:
        with self.open_atomic(target, "w") as f:
            f.write(content)

    def atomic_write_bytes(self, target: Path, content: bytes) -> None:
        with self.open_atomic(target, "wb") as f:
            f.write(content)

    @contextlib.contextmanager
    def open_atomic(self, target: Path, mode: str) -> Iterator[IO]:
        """Yield a temp file; rename to target on success, delete on exception."""
        self.ensure_dir(target.parent)
        # NamedTemporaryFile in same dir guarantees rename is atomic on POSIX.
        binary = "b" in mode
        fd, tmp_path = tempfile.mkstemp(
            prefix=".tmp.", suffix=target.name, dir=str(target.parent),
        )
        os.close(fd)
        tmp = Path(tmp_path)
        try:
            with tmp.open(mode) as f:
                yield f
            os.replace(tmp, target)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise
```

- [ ] **Step 5: Run, expect PASS**

```bash
.venv/bin/pytest tests/test_cache.py -v
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
git add packages/ingest/.gitignore \
        packages/ingest/okuden_ingest/cache.py \
        packages/ingest/tests/test_cache.py
git commit -m "ingest: add Cache helper (atomic writes, idempotent ensures)"
```

---

## Task 5: Acceptance test for full pipeline shape

Before building the parsers, lock in what the pipeline produces with a full integration test that uses fixtures only (no network). This is the failing-test gate that all subsequent tasks bring closer to PASS.

**Files:**
- Create: `packages/ingest/tests/test_pipeline_acceptance.py`
- Create: `packages/ingest/tests/fixtures/expected/api/NtCreateFile.json` (gold output)

- [ ] **Step 1: Write the gold expected output**

This is what we EXPECT the pipeline to produce for `NtCreateFile`. Match the existing handcrafted fixture from Plan 1 closely (`packages/data/api/NtCreateFile.json`).

`packages/ingest/tests/fixtures/expected/api/NtCreateFile.json`:

```json
{
  "name": "NtCreateFile",
  "dll": "ntdll",
  "category": "file",
  "description": "Creates or opens a file or device.",
  "prototype": "NTSTATUS NtCreateFile(PHANDLE FileHandle, ACCESS_MASK DesiredAccess, POBJECT_ATTRIBUTES ObjectAttributes, PIO_STATUS_BLOCK IoStatusBlock, PLARGE_INTEGER AllocationSize, ULONG FileAttributes, ULONG ShareAccess, ULONG CreateDisposition, ULONG CreateOptions, PVOID EaBuffer, ULONG EaLength);",
  "parameters": [
    {"name": "FileHandle", "type": "PHANDLE", "direction": "out"},
    {"name": "DesiredAccess", "type": "ACCESS_MASK", "direction": "in"},
    {"name": "ObjectAttributes", "type": "POBJECT_ATTRIBUTES", "direction": "in"},
    {"name": "IoStatusBlock", "type": "PIO_STATUS_BLOCK", "direction": "out"},
    {"name": "AllocationSize", "type": "PLARGE_INTEGER", "direction": "in"},
    {"name": "FileAttributes", "type": "ULONG", "direction": "in"},
    {"name": "ShareAccess", "type": "ULONG", "direction": "in"},
    {"name": "CreateDisposition", "type": "ULONG", "direction": "in"},
    {"name": "CreateOptions", "type": "ULONG", "direction": "in"},
    {"name": "EaBuffer", "type": "PVOID", "direction": "in"},
    {"name": "EaLength", "type": "ULONG", "direction": "in"}
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {"ssn": {"win10-22h2": 85, "win11-23h2": 85, "win11-24h2": 85}},
  "usedBy": [],
  "calls": [],
  "structsUsed": ["_OBJECT_ATTRIBUTES", "_IO_STATUS_BLOCK"],
  "examples": [],
  "source": {"phntPath": "phnt/ntioapi.h", "lastVerified": "*"}
}
```

The `lastVerified: "*"` is a marker meaning "any valid date" for the comparison.

- [ ] **Step 2: Write the failing acceptance test**

`packages/ingest/tests/test_pipeline_acceptance.py`:

```python
"""End-to-end pipeline test: produce a known JSON output from fixtures.

This test starts FAILING and stays failing until Task 27 wires up the full
pipeline. It is the north-star integration test.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

# Skip until Task 27.
pytest.importorskip("okuden_ingest.pipeline")
from okuden_ingest.pipeline import Pipeline  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = Path(__file__).resolve().parent / "fixtures"
EXPECTED = FIXTURES / "expected"


def _normalize_lastverified(d: dict) -> dict:
    """Replace `source.lastVerified` with literal '*' for comparison."""
    if "source" in d and "lastVerified" in d["source"]:
        d["source"]["lastVerified"] = "*"
    return d


@pytest.mark.integration
def test_full_pipeline_emits_NtCreateFile_matching_gold_fixture(tmp_path: Path) -> None:
    """When the pipeline runs end-to-end against fixtures, NtCreateFile.json matches gold."""
    pipeline = Pipeline.from_fixtures(fixtures_dir=FIXTURES, output_dir=tmp_path)
    pipeline.run()
    produced = json.loads((tmp_path / "api" / "NtCreateFile.json").read_text(encoding="utf-8"))
    expected = json.loads((EXPECTED / "api" / "NtCreateFile.json").read_text(encoding="utf-8"))
    assert _normalize_lastverified(produced) == _normalize_lastverified(expected)
```

- [ ] **Step 3: Run, expect SKIP (because pipeline module doesn't exist yet)**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/packages/ingest
.venv/bin/pytest tests/test_pipeline_acceptance.py -v
```

Expected: 1 test SKIPPED with the import-skip message. This is the goal — Task 27 will make it pass.

- [ ] **Step 4: Commit**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
git add packages/ingest/tests/test_pipeline_acceptance.py \
        packages/ingest/tests/fixtures/expected/api/NtCreateFile.json
git commit -m "ingest: add end-to-end acceptance test (skipped until pipeline lands)"
```

---

## Task 6: PDB downloader (Microsoft symsrv)

**Files:**
- Create: `packages/ingest/okuden_ingest/sources/pdb_download.py`
- Create: `packages/ingest/tests/test_pdb_download.py`

Microsoft's symbol server protocol: given a DLL with `PDB Path/PDB GUID/PDB Age`, fetch the PDB at `https://msdl.microsoft.com/download/symbols/{name}.pdb/{guid}{age}/{name}.pdb`. We cache by `(dll, version_id)` tuple.

- [ ] **Step 1: Write the failing test**

`packages/ingest/tests/test_pdb_download.py`:

```python
"""PDB downloader tests. Network calls mocked."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from okuden_ingest.sources.pdb_download import PdbCoordinates, build_symsrv_url, ensure_local


def test_build_symsrv_url_format() -> None:
    coords = PdbCoordinates(name="ntdll.pdb", guid="ABCDEF1234567890ABCDEF1234567890", age="1")
    url = build_symsrv_url(coords)
    assert url == "https://msdl.microsoft.com/download/symbols/ntdll.pdb/ABCDEF1234567890ABCDEF1234567890.1/ntdll.pdb"


def test_ensure_local_skips_when_cached(tmp_path: Path) -> None:
    coords = PdbCoordinates(name="ntdll.pdb", guid="DEAD", age="1")
    cached = tmp_path / "ntdll.pdb"
    cached.write_bytes(b"already here")
    # Should NOT call httpx if file exists.
    with patch("okuden_ingest.sources.pdb_download.httpx") as mock_httpx:
        result = ensure_local(coords, dest=cached)
    mock_httpx.get.assert_not_called()
    assert result == cached


def test_ensure_local_downloads_when_missing(tmp_path: Path) -> None:
    coords = PdbCoordinates(name="ntdll.pdb", guid="BEEF", age="2")
    dest = tmp_path / "ntdll.pdb"
    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.iter_bytes = lambda: [b"PDB", b" data"]
    fake_response.raise_for_status = lambda: None
    with patch("okuden_ingest.sources.pdb_download.httpx") as mock_httpx:
        mock_httpx.stream.return_value.__enter__.return_value = fake_response
        result = ensure_local(coords, dest=dest)
    assert result == dest
    assert dest.read_bytes() == b"PDB data"
```

- [ ] **Step 2: Run, expect FAIL (module missing)**

```bash
.venv/bin/pytest tests/test_pdb_download.py -v
```

- [ ] **Step 3: Implement `okuden_ingest/sources/pdb_download.py`**

```python
"""Download Microsoft PDBs from the symbol server, with local caching."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import httpx

from .. import log
from ..cache import Cache

_log = log.get(__name__)

SYMSRV_BASE = "https://msdl.microsoft.com/download/symbols"


@dataclass(frozen=True)
class PdbCoordinates:
    """The triple Microsoft uses to identify a specific PDB build."""
    name: str   # e.g., "ntdll.pdb"
    guid: str   # 32 hex chars (no hyphens), uppercase
    age: str    # decimal string


def build_symsrv_url(coords: PdbCoordinates) -> str:
    return f"{SYMSRV_BASE}/{coords.name}/{coords.guid}.{coords.age}/{coords.name}"


def ensure_local(coords: PdbCoordinates, dest: Path) -> Path:
    """Download the PDB to `dest` if it's not already there. Returns `dest`."""
    if dest.exists() and dest.stat().st_size > 0:
        _log.debug("PDB cache hit: %s", dest)
        return dest
    cache = Cache(dest.parent)
    cache.ensure_dir(dest.parent)
    url = build_symsrv_url(coords)
    _log.info("Downloading PDB: %s -> %s", url, dest)
    with cache.open_atomic(dest, "wb") as f:
        with httpx.stream("GET", url, follow_redirects=True, timeout=120) as resp:
            resp.raise_for_status()
            for chunk in resp.iter_bytes():
                f.write(chunk)
    _log.info("PDB downloaded: %d bytes", dest.stat().st_size)
    return dest
```

- [ ] **Step 4: Run, expect PASS**

```bash
.venv/bin/pytest tests/test_pdb_download.py -v
```

- [ ] **Step 5: Commit**

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden
git add packages/ingest/okuden_ingest/sources/pdb_download.py \
        packages/ingest/tests/test_pdb_download.py
git commit -m "ingest: add PDB downloader (Microsoft symsrv with caching)"
```

---

## Task 7: ReactOS source acquirer

**Files:**
- Create: `packages/ingest/okuden_ingest/sources/reactos.py`
- Create: `packages/ingest/tests/test_reactos.py`

We do a shallow clone on demand and grep for function names. Caching via `git clone --filter=blob:none` (partial clone) keeps disk usage low.

- [ ] **Step 1: Write the test**

`packages/ingest/tests/test_reactos.py`:

```python
from __future__ import annotations
from pathlib import Path
from unittest.mock import patch

import pytest

from okuden_ingest.sources.reactos import ReactOSSource


def test_locate_function_returns_match(tmp_path: Path) -> None:
    # Simulate a clone with a known file.
    clone = tmp_path / "reactos"
    f = clone / "ntoskrnl" / "io" / "iomgr" / "file.c"
    f.parent.mkdir(parents=True)
    f.write_text("NTSTATUS\nNTAPI\nNtCreateFile(PHANDLE FileHandle, ...)\n", encoding="utf-8")
    src = ReactOSSource(clone_dir=clone)
    hit = src.locate_function("NtCreateFile")
    assert hit == "ntoskrnl/io/iomgr/file.c"


def test_locate_function_returns_none_for_missing(tmp_path: Path) -> None:
    clone = tmp_path / "reactos"
    clone.mkdir()
    src = ReactOSSource(clone_dir=clone)
    assert src.locate_function("NoSuchFunction") is None
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `okuden_ingest/sources/reactos.py`**

```python
"""ReactOS source code locator (text-grep-based)."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from .. import log

_log = log.get(__name__)

REACTOS_REPO = "https://github.com/reactos/reactos.git"


class ReactOSSource:
    """Locate function or struct definitions in the ReactOS source tree."""

    def __init__(self, clone_dir: Path) -> None:
        self.clone_dir = Path(clone_dir)

    def ensure_clone(self) -> None:
        if (self.clone_dir / ".git").is_dir():
            return
        self.clone_dir.parent.mkdir(parents=True, exist_ok=True)
        _log.info("Cloning ReactOS into %s", self.clone_dir)
        subprocess.run(
            ["git", "clone", "--depth=1", "--filter=blob:none", REACTOS_REPO, str(self.clone_dir)],
            check=True,
        )

    def locate_function(self, name: str) -> str | None:
        """Find the file that defines function `name`. Returns repo-relative path or None."""
        if not self.clone_dir.is_dir():
            return None
        # Heuristic: a function definition starts with the name at the start of a line.
        pattern = re.compile(rf"^\s*\w[\w\s\*]*\b{re.escape(name)}\s*\(", re.MULTILINE)
        for path in self.clone_dir.rglob("*.c"):
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if pattern.search(text):
                return str(path.relative_to(self.clone_dir)).replace("\\", "/")
        return None
```

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/ingest/okuden_ingest/sources/reactos.py \
        packages/ingest/tests/test_reactos.py
git commit -m "ingest: add ReactOS source locator (clone + grep)"
```

---

## Task 8: Wine source acquirer

**Files:**
- Create: `packages/ingest/okuden_ingest/sources/wine.py`
- Create: `packages/ingest/tests/test_wine.py`

Symmetric to ReactOS. The same shape (`ensure_clone`, `locate_function`). Wine repo is at `git://source.winehq.org/git/wine.git` or `https://gitlab.winehq.org/wine/wine.git`.

- [ ] **Step 1: Write the test mirroring `test_reactos.py`** — same shape, just `WineSource` and a wine-style file (e.g., `dlls/ntdll/file.c`).

- [ ] **Step 2: Implement `okuden_ingest/sources/wine.py`** — same structure as ReactOS, with `WINE_REPO = "https://gitlab.winehq.org/wine/wine.git"`.

```python
"""Wine source code locator. Mirror of ReactOSSource."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from .. import log

_log = log.get(__name__)

WINE_REPO = "https://gitlab.winehq.org/wine/wine.git"


class WineSource:
    def __init__(self, clone_dir: Path) -> None:
        self.clone_dir = Path(clone_dir)

    def ensure_clone(self) -> None:
        if (self.clone_dir / ".git").is_dir():
            return
        self.clone_dir.parent.mkdir(parents=True, exist_ok=True)
        _log.info("Cloning Wine into %s", self.clone_dir)
        subprocess.run(
            ["git", "clone", "--depth=1", "--filter=blob:none", WINE_REPO, str(self.clone_dir)],
            check=True,
        )

    def locate_function(self, name: str) -> str | None:
        if not self.clone_dir.is_dir():
            return None
        pattern = re.compile(rf"^\s*\w[\w\s\*]*\b{re.escape(name)}\s*\(", re.MULTILINE)
        for path in self.clone_dir.rglob("*.c"):
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if pattern.search(text):
                return str(path.relative_to(self.clone_dir)).replace("\\", "/")
        return None
```

- [ ] **Step 3: Tests pass.** Commit:

```bash
git add packages/ingest/okuden_ingest/sources/wine.py \
        packages/ingest/tests/test_wine.py
git commit -m "ingest: add Wine source locator (mirror of ReactOS)"
```

---

## Task 9: Source acquirer integration test

**Files:**
- Create: `packages/ingest/tests/test_sources_integration.py`

Opt-in test (`@pytest.mark.integration`) that actually clones ReactOS shallowly and locates `NtCreateFile`. Skipped in CI; runs on demand.

```python
"""Integration test: actually clone ReactOS and find NtCreateFile."""
from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from okuden_ingest.sources.reactos import ReactOSSource


@pytest.mark.integration
def test_real_reactos_locates_NtCreateFile(tmp_path: Path) -> None:
    src = ReactOSSource(clone_dir=tmp_path / "reactos")
    src.ensure_clone()
    hit = src.locate_function("NtCreateFile")
    assert hit is not None
    assert "ntoskrnl" in hit  # we expect it in ntoskrnl/io/...
```

Run only with `pytest -m integration`. Commit:

```bash
git add packages/ingest/tests/test_sources_integration.py
git commit -m "ingest: add opt-in integration test for source locators"
```

---

## Task 10: PDB function symbol extractor

**Files:**
- Create: `packages/ingest/okuden_ingest/parsers/pdb_funcs.py`
- Create: `packages/ingest/tests/test_pdb_funcs.py`
- Create: `packages/ingest/tests/fixtures/pdb/ntdll-fixture.json` (parsed-fixture mock)

**Note on fixtures:** real PDB binaries are large (50–500 MB). For unit tests we mock the `pdbparse` API behavior with a minimal in-memory structure that mirrors what pdbparse returns. Real PDBs are only used in the `@integration` test (Task 28).

The function extractor takes a parsed-pdb-like object and returns:

```python
[
  {"name": "NtCreateFile", "return_type": "NTSTATUS"},
  {"name": "NtOpenFile", "return_type": "NTSTATUS"},
  ...
]
```

Note: PDB symbols don't carry parameter names — we get those from phnt. PDB gives us function existence + signature shape.

- [ ] **Step 1: Write the test using a mock pdbparse object**

`packages/ingest/tests/test_pdb_funcs.py`:

```python
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from okuden_ingest.parsers.pdb_funcs import extract_functions


def make_mock_pdb_with_symbols(names: list[str]) -> MagicMock:
    """Create a mock pdbparse PDB object with `names` as PUBLIC symbols."""
    pdb = MagicMock()
    syms = []
    for name in names:
        s = MagicMock()
        s.name = name
        s.symtype = "S_PUB32"
        syms.append(s)
    pdb.STREAM_GSYM.globals = syms
    return pdb


def test_extracts_nt_prefixed_symbols() -> None:
    pdb = make_mock_pdb_with_symbols(["NtCreateFile", "NtOpenFile", "RtlAllocateHeap", "_init"])
    funcs = extract_functions(pdb, prefix_filter=("Nt", "Zw"))
    names = sorted(f["name"] for f in funcs)
    assert names == ["NtCreateFile", "NtOpenFile"]


def test_no_prefix_filter_returns_all() -> None:
    pdb = make_mock_pdb_with_symbols(["NtCreateFile", "_init"])
    funcs = extract_functions(pdb, prefix_filter=None)
    assert len(funcs) == 2
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `parsers/pdb_funcs.py`**

```python
"""Extract function symbols from a parsed PDB."""
from __future__ import annotations

from typing import Iterable


def extract_functions(pdb, prefix_filter: tuple[str, ...] | None = None) -> list[dict]:
    """Return [{name, return_type}, ...] for global function symbols.

    Note: PDB public symbols don't carry return-type info reliably. We return
    an empty `return_type` and let phnt fill it in during reconciliation.
    """
    out: list[dict] = []
    seen: set[str] = set()
    for sym in pdb.STREAM_GSYM.globals:
        name = getattr(sym, "name", None)
        if not name or name in seen:
            continue
        if prefix_filter and not any(name.startswith(p) for p in prefix_filter):
            continue
        seen.add(name)
        out.append({"name": name, "return_type": ""})
    return out
```

- [ ] **Step 4: PASS. Commit.**

```bash
git add packages/ingest/okuden_ingest/parsers/pdb_funcs.py \
        packages/ingest/tests/test_pdb_funcs.py
git commit -m "ingest: extract function symbols from PDB (Nt/Zw prefix filter)"
```

---

## Task 11: PDB struct layout extractor

**Files:**
- Create: `packages/ingest/okuden_ingest/parsers/pdb_structs.py`
- Create: `packages/ingest/tests/test_pdb_structs.py`

The struct extractor pulls fields with offsets and sizes from PDB type information. Output shape:

```python
{
  "_PEB": [
    {"name": "InheritedAddressSpace", "type": "BOOLEAN", "offset": 0, "size": 1},
    {"name": "BeingDebugged", "type": "BOOLEAN", "offset": 2, "size": 1},
    ...
  ],
  ...
}
```

The implementer should consult `pdbparse` documentation (`STREAM_TPI` for type info, look for LF_STRUCTURE / LF_FIELDLIST / LF_MEMBER records). Test with a mock structure as in Task 10.

- [ ] **Step 1: Test with a mock TPI stream returning struct member records.**

`tests/test_pdb_structs.py`:

```python
from __future__ import annotations
from unittest.mock import MagicMock
from okuden_ingest.parsers.pdb_structs import extract_structs


def _mk_member(name: str, type_name: str, offset: int, size: int) -> MagicMock:
    m = MagicMock()
    m.leaf_type = "LF_MEMBER"
    m.name = name
    m.type_name = type_name
    m.offset = offset
    m.size = size
    return m


def _mk_struct(name: str, members: list[MagicMock]) -> MagicMock:
    s = MagicMock()
    s.leaf_type = "LF_STRUCTURE"
    s.name = name
    s.fieldlist.substructs = members
    return s


def test_extracts_struct_with_fields() -> None:
    pdb = MagicMock()
    pdb.STREAM_TPI.types = {
        100: _mk_struct("_PEB", [
            _mk_member("InheritedAddressSpace", "BOOLEAN", 0, 1),
            _mk_member("BeingDebugged", "BOOLEAN", 2, 1),
        ]),
    }
    structs = extract_structs(pdb, name_filter=lambda n: n.startswith("_"))
    assert "_PEB" in structs
    fields = structs["_PEB"]
    assert fields == [
        {"name": "InheritedAddressSpace", "type": "BOOLEAN", "offset": 0, "size": 1},
        {"name": "BeingDebugged", "type": "BOOLEAN", "offset": 2, "size": 1},
    ]
```

- [ ] **Step 2: Implement.**

```python
"""Extract struct layouts from a parsed PDB."""
from __future__ import annotations

from typing import Callable


def extract_structs(
    pdb,
    name_filter: Callable[[str], bool] | None = None,
) -> dict[str, list[dict]]:
    """Return {struct_name: [{name, type, offset, size}, ...], ...}."""
    out: dict[str, list[dict]] = {}
    types = getattr(pdb.STREAM_TPI, "types", {})
    for _idx, t in types.items():
        if getattr(t, "leaf_type", None) != "LF_STRUCTURE":
            continue
        name = getattr(t, "name", None)
        if not name:
            continue
        if name_filter and not name_filter(name):
            continue
        fields: list[dict] = []
        members = getattr(getattr(t, "fieldlist", None), "substructs", []) or []
        for m in members:
            if getattr(m, "leaf_type", None) != "LF_MEMBER":
                continue
            fields.append({
                "name": getattr(m, "name", ""),
                "type": getattr(m, "type_name", ""),
                "offset": int(getattr(m, "offset", 0)),
                "size": int(getattr(m, "size", 0)),
            })
        out[name] = fields
    return out
```

- [ ] **Step 3: PASS. Commit.**

```bash
git add packages/ingest/okuden_ingest/parsers/pdb_structs.py \
        packages/ingest/tests/test_pdb_structs.py
git commit -m "ingest: extract struct layouts from PDB (LF_STRUCTURE / LF_MEMBER)"
```

---

## Task 12: phnt function declaration parser

**Files:**
- Create: `packages/ingest/okuden_ingest/parsers/phnt_funcs.py`
- Create: `packages/ingest/tests/test_phnt_funcs.py`
- Create: `packages/ingest/tests/fixtures/phnt/ntioapi-snippet.h`

phnt declares functions like:

```c
NTSYSAPI
NTSTATUS
NTAPI
NtCreateFile(
    _Out_ PHANDLE FileHandle,
    _In_ ACCESS_MASK DesiredAccess,
    _In_ POBJECT_ATTRIBUTES ObjectAttributes,
    _Out_ PIO_STATUS_BLOCK IoStatusBlock,
    _In_opt_ PLARGE_INTEGER AllocationSize,
    _In_ ULONG FileAttributes,
    _In_ ULONG ShareAccess,
    _In_ ULONG CreateDisposition,
    _In_ ULONG CreateOptions,
    _In_reads_bytes_opt_(EaLength) PVOID EaBuffer,
    _In_ ULONG EaLength
    );
```

We extract: function name, return type, list of parameters with `(annotation, type, name)`. The annotation goes through a normalizer to map to our schema's `direction` enum.

- [ ] **Step 1: Create the test fixture**

`tests/fixtures/phnt/ntioapi-snippet.h`:

```c
NTSYSAPI
NTSTATUS
NTAPI
NtCreateFile(
    _Out_ PHANDLE FileHandle,
    _In_ ACCESS_MASK DesiredAccess,
    _In_ POBJECT_ATTRIBUTES ObjectAttributes,
    _Out_ PIO_STATUS_BLOCK IoStatusBlock,
    _In_opt_ PLARGE_INTEGER AllocationSize,
    _In_ ULONG FileAttributes,
    _In_ ULONG ShareAccess,
    _In_ ULONG CreateDisposition,
    _In_ ULONG CreateOptions,
    _In_reads_bytes_opt_(EaLength) PVOID EaBuffer,
    _In_ ULONG EaLength
    );

// Comment after.
NTSYSAPI
NTSTATUS
NTAPI
NtClose(
    _In_ _Post_ptr_invalid_ HANDLE Handle
    );
```

- [ ] **Step 2: Write the test**

```python
"""phnt function parser."""
from __future__ import annotations

from pathlib import Path

import pytest

from okuden_ingest.parsers.phnt_funcs import parse_functions

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "phnt"


def test_parses_NtCreateFile() -> None:
    text = (FIXTURES / "ntioapi-snippet.h").read_text(encoding="utf-8")
    funcs = parse_functions(text)
    by_name = {f["name"]: f for f in funcs}
    assert "NtCreateFile" in by_name
    nt = by_name["NtCreateFile"]
    assert nt["return_type"] == "NTSTATUS"
    assert len(nt["parameters"]) == 11
    p0 = nt["parameters"][0]
    assert p0 == {"annotation": "_Out_", "type": "PHANDLE", "name": "FileHandle"}
    p4 = nt["parameters"][4]
    assert p4["annotation"] == "_In_opt_"
    assert p4["type"] == "PLARGE_INTEGER"
    assert p4["name"] == "AllocationSize"


def test_parses_NtClose_with_dual_annotation() -> None:
    text = (FIXTURES / "ntioapi-snippet.h").read_text(encoding="utf-8")
    funcs = parse_functions(text)
    by_name = {f["name"]: f for f in funcs}
    assert "NtClose" in by_name
    nt = by_name["NtClose"]
    assert len(nt["parameters"]) == 1
    p = nt["parameters"][0]
    # Dual annotations: we keep the first SAL prefix.
    assert p["annotation"] == "_In_"
    assert p["type"] == "HANDLE"
    assert p["name"] == "Handle"
```

- [ ] **Step 3: Run, expect FAIL.**

- [ ] **Step 4: Implement `parsers/phnt_funcs.py`**

```python
"""Regex-based parser for phnt function declarations.

Matches the form:
    NTSYSAPI
    <RET_TYPE>
    NTAPI
    <NAME>(
        <PARAMS>
        );
"""
from __future__ import annotations

import re

# Top-level regex: captures the four-line preamble + signature body.
_FUNC_RE = re.compile(
    r"NTSYSAPI\s+(?P<ret>\w+)\s+NTAPI\s+(?P<name>\w+)\s*\(\s*(?P<params>[^)]*?)\s*\);",
    re.DOTALL,
)

# Parameter: SAL annotation (starts with _) optionally with parenthesized arg, then type, then name.
_PARAM_RE = re.compile(
    r"(?P<ann>_\w+(?:\([^)]*\))?)\s+"  # annotation (with optional (arg))
    r"(?:_\w+(?:\([^)]*\))?\s+)*"       # additional annotations to skip (we keep first)
    r"(?P<type>[\w\s\*]+?)\s+"
    r"(?P<name>\w+)\s*$",
    re.MULTILINE,
)


def parse_functions(text: str) -> list[dict]:
    """Parse all function declarations from a phnt header text."""
    out: list[dict] = []
    for m in _FUNC_RE.finditer(text):
        params_block = m.group("params")
        params = _parse_params(params_block)
        out.append({
            "name": m.group("name"),
            "return_type": m.group("ret"),
            "parameters": params,
        })
    return out


def _parse_params(block: str) -> list[dict]:
    """Split `block` on commas at depth 0, then parse each."""
    if not block.strip():
        return []
    parts = _split_top_level_commas(block)
    out: list[dict] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        pm = _PARAM_RE.search(part)
        if pm:
            out.append({
                "annotation": pm.group("ann"),
                "type": pm.group("type").strip(),
                "name": pm.group("name"),
            })
    return out


def _split_top_level_commas(s: str) -> list[str]:
    out, depth, start = [], 0, 0
    for i, ch in enumerate(s):
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif ch == "," and depth == 0:
            out.append(s[start:i])
            start = i + 1
    out.append(s[start:])
    return out
```

- [ ] **Step 5: PASS. Commit.**

```bash
git add packages/ingest/okuden_ingest/parsers/phnt_funcs.py \
        packages/ingest/tests/test_phnt_funcs.py \
        packages/ingest/tests/fixtures/phnt/ntioapi-snippet.h
git commit -m "ingest: parse phnt function declarations (regex-based)"
```

---

## Task 13: phnt struct definition parser

**Files:**
- Create: `packages/ingest/okuden_ingest/parsers/phnt_structs.py`
- Create: `packages/ingest/tests/test_phnt_structs.py`
- Create: `packages/ingest/tests/fixtures/phnt/ntpebteb-snippet.h`

phnt struct form:

```c
typedef struct _PEB
{
    BOOLEAN InheritedAddressSpace;
    BOOLEAN ReadImageFileExecOptions;
    BOOLEAN BeingDebugged;
    PVOID ImageBaseAddress;
    PPEB_LDR_DATA Ldr;
    ...
} PEB, *PPEB;
```

We extract: struct name (with leading `_`), list of fields `(type, name, optional bit-width)`. We do NOT compute offsets — those come from PDB. phnt provides the type AND name, PDB provides the layout.

The implementer should follow the same regex-based approach as Task 12. Output:

```python
{
  "_PEB": [
    {"type": "BOOLEAN", "name": "InheritedAddressSpace"},
    {"type": "BOOLEAN", "name": "ReadImageFileExecOptions"},
    ...
  ]
}
```

Test fixture: a phnt-style snippet with `_PEB` and a small struct. Test asserts the parsed result matches expected fields.

Implementation skeleton (~80 lines): regex `typedef\s+struct\s+(\w+)\s*\{(.+?)\}` matched with `re.DOTALL`, then each line inside the body parsed for `<type> <name>;`. Skip preprocessor lines, comments, and inline arrays.

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: parse phnt struct definitions (regex-based)"
```

---

## Task 14: phnt header indexer (combine all headers)

**Files:**
- Create: `packages/ingest/okuden_ingest/parsers/phnt_index.py`
- Create: `packages/ingest/tests/test_phnt_index.py`

Walks `packages/ingest/vendored/phnt-source/phnt/*.h`, applies `parse_functions` and `parse_structs` to each, and produces:

```python
{
  "functions": [...],          # all functions with `header_path` attached
  "structs": {...},            # all structs with `header_path` attached
}
```

Each function and struct entry adds a `header_path` field like `phnt/ntioapi.h`.

- [ ] **Step 1: Test using a tmp directory with two stub headers.**

- [ ] **Step 2: Implement** — straightforward iteration.

- [ ] **Step 3: PASS. Commit.**

```bash
git commit -m "ingest: index all phnt headers into a combined view"
```

---

## Task 15: j00ru SSN table parser

**Files:**
- Create: `packages/ingest/okuden_ingest/sources/j00ru.py`
- Create: `packages/ingest/tests/test_j00ru.py`

Reads `packages/ingest/sources/j00ru-syscalls/syscalls.csv` and emits:

```python
{
  "NtCreateFile": {"win10-22h2": 85, "win11-23h2": 85, "win11-24h2": 85},
  "NtOpenProcess": {"win10-22h2": 38, ...},
  ...
}
```

- [ ] Standard TDD pattern. Use stdlib `csv` module. Commit:

```bash
git commit -m "ingest: parse j00ru SSN tables CSV"
```

---

## Task 16: PE import table parser (cross-DLL graph)

**Files:**
- Create: `packages/ingest/okuden_ingest/parsers/pe_imports.py`
- Create: `packages/ingest/tests/test_pe_imports.py`
- Create: `packages/ingest/tests/fixtures/pe/sample-kernel32.dll` (small fixture, ideally a tiny PE we control)

Use `pefile` to parse imports. Output:

```python
{
  "kernel32.dll": {
    "ntdll.dll": ["NtCreateFile", "NtOpenProcess", "RtlAllocateHeap"],
  }
}
```

This data drives `usedBy` (callers) and `calls` (callees) inversion in Task 22.

For the fixture, the implementer can either:
- Create a minimal PE with `pefile`'s `__init__` and add an import directory programmatically, OR
- Strip down a real DLL with `cv2pdb` / `objcopy` to the import-only sections.

Mocking the `pefile.PE` API in the unit test is acceptable; integration test (Task 28) uses a real DLL.

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: parse PE import table (kernel32 -> ntdll edges)"
```

---

## Task 17: Schema validator gate (reuse existing validator)

The existing `okuden_ingest.validate` module from Plan 1 is enough — we don't need a new one. This task just wires a thin convenience function that takes a dict and validates it.

**Files:**
- Modify: `packages/ingest/okuden_ingest/validate.py` (add `assert_valid` helper)
- Create: `packages/ingest/tests/test_validate_helper.py`

- [ ] **Step 1: Add `assert_valid(kind, data)` to `validate.py`** — raises a single `ValidationError` (the first one) on failure, returns None on success.

```python
def assert_valid(kind: str, data) -> None:
    """Raise ValidationError on first failure; return None if valid."""
    errors = validate(kind, data)
    if errors:
        raise errors[0]
```

- [ ] **Step 2: Test the helper.**

- [ ] **Step 3: Commit.**

```bash
git commit -m "ingest: add assert_valid helper to validate module"
```

---

## Task 18: Reconcile function signatures (PDB + phnt)

**Files:**
- Create: `packages/ingest/okuden_ingest/reconcile/functions.py`
- Create: `packages/ingest/tests/test_reconcile_funcs.py`

Combines:
- PDB symbol existence (per Windows version) — proves the function exists
- phnt prototype — gives us return type, parameter names, parameter types, parameter direction
- j00ru SSN map — for syscall APIs, gives the SSN per version

Output: a list of function records ready for emission, ONE entry per function name (across all DLLs). Each record carries the version-set where the symbol exists.

```python
{
  "NtCreateFile": {
    "dll": "ntdll",
    "return_type": "NTSTATUS",
    "prototype": "NTSTATUS NtCreateFile(...);",
    "parameters": [{"name": "FileHandle", "type": "PHANDLE", "direction": "out"}, ...],
    "tags": ["syscall", "partial"],
    "syscall": {"ssn": {"win10-22h2": 85, ...}},
    "header_path": "phnt/ntioapi.h",
    "versions_present": ["win10-22h2", "win11-23h2", "win11-24h2"],
  },
  ...
}
```

The annotation→direction normalizer is core logic:
- `_In_` → `in`
- `_Out_` → `out`
- `_Inout_` → `inout`
- `_In_opt_`, `_In_reads_*` → `in`
- `_Out_opt_`, `_Out_writes_*` → `out`
- everything else → `in` (safe default)

The DLL name is derived from the header path (e.g., `phnt/ntioapi.h` → `ntdll`). For phnt headers, all functions are `ntdll`. Win32 wrappers come from PDBs (kernel32.pdb, etc.).

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: reconcile function signatures (PDB + phnt + j00ru)"
```

---

## Task 19: Reconcile struct layouts (PDB + phnt)

**Files:**
- Create: `packages/ingest/okuden_ingest/reconcile/structs.py`
- Create: `packages/ingest/tests/test_reconcile_structs.py`

For each struct that appears in BOTH phnt (provides field types and names) and PDB (provides offsets and sizes per Windows version), produce:

```python
{
  "_PEB": {
    "fields": [
      {"name": "InheritedAddressSpace", "type": "BOOLEAN",
       "offsets": {"win10-22h2": 0, "win11-23h2": 0, "win11-24h2": 0},
       "size":    {"win10-22h2": 1, "win11-23h2": 1, "win11-24h2": 1}},
      ...
    ],
    "header_path": "phnt/ntpebteb.h",
  }
}
```

Conflict resolution: phnt is authoritative on field names + types. PDB is authoritative on offsets + sizes. If phnt has a field PDB doesn't, drop it (cross-version invariant violated). If PDB has a field phnt doesn't, also drop it (we lack a name).

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: reconcile struct layouts (phnt names + PDB offsets)"
```

---

## Task 20: Tag classifier

**Files:**
- Create: `packages/ingest/okuden_ingest/reconcile/tags.py`
- Create: `packages/ingest/tests/test_tags.py`

Heuristic per function:
- `syscall` if the name starts with `Nt`/`Zw` AND appears in j00ru's SSN map
- `undocumented` if NO MSDN annotation present (we approximate by: header path is in `phnt/` rather than the public Windows SDK)
- `partial` if name is in MSDN BUT phnt has additional info (we approximate: starts with `Nt`/`Zw` but j00ru maps it — ntdll APIs are partially documented)
- `deprecated` is set only if phnt declares `_Deprecated_` annotation on the function

Default empty array for non-syscall, fully-documented Win32 wrappers (kernel32, etc.).

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: classify tags (syscall, undocumented, partial, deprecated)"
```

---

## Task 21: Category assigner

**Files:**
- Create: `packages/ingest/okuden_ingest/reconcile/category.py`
- Create: `packages/ingest/tests/test_category.py`

Maps function name + header path to a category string (`file`, `process`, `memory`, `registry`, `synchronization`, etc.).

Heuristic: header path drives most assignments.

```python
HEADER_TO_CATEGORY = {
    "phnt/ntioapi.h": "file",
    "phnt/ntpsapi.h": "process",
    "phnt/ntmmapi.h": "memory",
    "phnt/ntregapi.h": "registry",
    "phnt/ntobapi.h": "object",
    "phnt/ntpebteb.h": "process",
    "phnt/ntsec.h": "security",
    "phnt/ntsam.h": "security",
    "phnt/ntwow64.h": "wow64",
    # … rest mapped exhaustively in implementation
}
```

Functions without a matching header path get `misc`. The mapping should cover all phnt headers we support.

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: assign category from header path"
```

---

## Task 22: Cross-reference graph builder

**Files:**
- Create: `packages/ingest/okuden_ingest/reconcile/graph.py`
- Create: `packages/ingest/tests/test_graph.py`

Takes the PE-imports map from Task 16 and produces:

```python
{
  "calls": {
    "CreateFileW": ["NtCreateFile"],         # kernel32 wrapper -> ntdll syscall
    "OpenProcess": ["NtOpenProcess"],
  },
  "usedBy": {
    "NtCreateFile": ["CreateFileW"],         # inverse map
    "NtOpenProcess": ["OpenProcess"],
  },
  "structsUsed": {
    # populated by parsing function signatures for struct types in parameters/return
    "NtCreateFile": ["_OBJECT_ATTRIBUTES", "_IO_STATUS_BLOCK"],
  },
}
```

The `structsUsed` field is computed by scanning each function's parameter type list against the known struct registry from Task 19. A type is a struct if the registry has it.

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: build cross-reference graph (calls/usedBy/structsUsed)"
```

---

## Task 23: API entry emitter

**Files:**
- Create: `packages/ingest/okuden_ingest/emit/api.py`
- Create: `packages/ingest/tests/test_emit_api.py`

Takes the reconciled function record (Task 18) + tags (Task 20) + category (Task 21) + graph (Task 22) and emits a JSON object that PASSES the api.schema.json:

```python
def emit_api(reconciled, tags_map, category_map, graph) -> dict:
    """Build a dict ready to write as packages/data/api/<name>.json."""
    ...
```

The emitter must:
- Build the prototype string from return_type + name + parameters
- Set `description` to a short auto-generated stub (`f"{name}: see source for details."`) when phnt has no comment block. The implementer can extract leading comment blocks from phnt as a small enhancement.
- Set `examples = []` (V1)
- Set `source.phntPath = header_path`, `source.lastVerified = today.isoformat()`
- Set `source.reactosPath` and `source.winePath` if Tasks 7/8 found them (call into source locators)

Tests: emit a known API, validate against the api schema, assert key fields match.

- [ ] Standard TDD pattern. Commit:

```bash
git commit -m "ingest: emit API JSON (validates against api.schema.json)"
```

---

## Task 24: Struct entry emitter

**Files:**
- Create: `packages/ingest/okuden_ingest/emit/struct.py`
- Create: `packages/ingest/tests/test_emit_struct.py`

Same shape as Task 23 but for structs. Validates against `struct.schema.json`.

- [ ] Commit:

```bash
git commit -m "ingest: emit struct JSON (validates against struct.schema.json)"
```

---

## Task 25: Version entry emitter

**Files:**
- Create: `packages/ingest/okuden_ingest/emit/version.py`
- Create: `packages/ingest/tests/test_emit_version.py`

Reads `config.TARGETS` and emits one JSON per target. Validates against `version.schema.json`.

This is the simplest emitter — basically a record-by-record copy from `WindowsTarget` dataclass to schema fields.

- [ ] Commit:

```bash
git commit -m "ingest: emit version JSON entries"
```

---

## Task 26: Diff reporter

**Files:**
- Create: `packages/ingest/okuden_ingest/emit/diff.py`
- Create: `packages/ingest/tests/test_diff.py`

Compares the about-to-be-written dataset to the existing one and produces a human-readable diff:

```
Added: 3 APIs (NtFoo, NtBar, NtBaz)
Removed: 1 API (NtOldThing)
Modified: 12 APIs
   NtCreateFile: SSN changed for win11-24h2 (85 -> 86)
   NtOpenProcess: parameter[3].direction (in -> inout)
   …
```

Useful for nightly runs (Task 30) so reviewers can see what changed without reading the full JSON diff.

- [ ] Standard TDD. Commit:

```bash
git commit -m "ingest: add dataset diff reporter"
```

---

## Task 27: Pipeline orchestration

**Files:**
- Create: `packages/ingest/okuden_ingest/pipeline.py`
- Modify: `packages/ingest/okuden_ingest/cli.py` (wire `run` command)
- Modify: `packages/ingest/tests/test_pipeline_acceptance.py` (the test from Task 5 should now PASS)

Orchestrates all stages:

```python
class Pipeline:
    @classmethod
    def from_config(cls) -> "Pipeline": ...
    @classmethod
    def from_fixtures(cls, fixtures_dir: Path, output_dir: Path) -> "Pipeline": ...

    def run(self) -> RunReport: ...
```

The `run()` method:
1. For each target in `config.TARGETS`: download PDBs (Task 6) for each DLL (Task 6)
2. Index phnt headers (Task 14)
3. Parse PDB symbols + structs (Tasks 10, 11)
4. Parse PE imports (Task 16) for each DLL
5. Reconcile (Tasks 18, 19)
6. Classify tags (Task 20), assign categories (Task 21), build graph (Task 22)
7. Emit (Tasks 23, 24, 25) — write to `output_dir/{api,struct,version}/*.json` atomically
8. Validate every emitted file (Task 17)
9. Compare to existing dataset, log the diff (Task 26)

`from_fixtures` is the test variant: takes a fixtures dir with pre-parsed data (mocked PDB results, real phnt fixture) and skips network steps.

- [ ] **Step 1: Implement `Pipeline.from_fixtures`** — pulls all parser inputs from `fixtures/` rather than network.

- [ ] **Step 2: Implement `Pipeline.run()`** — sequentially calls each stage.

- [ ] **Step 3: Wire `cli.run` to call `Pipeline.from_config().run()`.**

- [ ] **Step 4: Run the acceptance test from Task 5 — expect PASS now.**

```bash
.venv/bin/pytest tests/test_pipeline_acceptance.py -v
```

- [ ] **Step 5: Run the FULL test suite — expect everything pass.**

```bash
.venv/bin/pytest -v
```

- [ ] **Step 6: Commit.**

```bash
git commit -m "ingest: orchestrate full pipeline (download → parse → reconcile → emit → validate)"
```

---

## Task 28: Real-PDB integration test

**Files:**
- Create: `packages/ingest/tests/test_pipeline_integration.py`
- Create: `packages/ingest/tests/fixtures/pdb/<minified-pdb>` (binary fixture)

Opt-in test that runs the full pipeline against a small real PDB (~100 KB after `pdbminify`):

```python
@pytest.mark.integration
def test_pipeline_against_real_minified_pdb(tmp_path):
    """Full pipeline run on a checked-in minified PDB. Slow but realistic."""
    pipeline = Pipeline.from_fixtures(
        fixtures_dir=Path(__file__).parent / "fixtures",
        output_dir=tmp_path,
        use_real_pdb=True,
    )
    pipeline.run()
    # Assert NtCreateFile.json validates
    from okuden_ingest.validate import validate
    data = json.loads((tmp_path / "api" / "NtCreateFile.json").read_text())
    assert validate("api", data) == []
```

The implementer should:
- Acquire a small Win11 24H2 ntdll.pdb (download with the Task 6 downloader)
- Minify with `pdbminify` (or a custom script that strips type info we don't use)
- Commit the minified PDB to the fixtures directory (target: <500 KB)

If pdbminify isn't readily available, the implementer can:
- Use a custom Python script to strip everything but `STREAM_GSYM` and `STREAM_TPI` for a small whitelist of struct/function names
- Commit the result

- [ ] Run with `pytest -m integration`. Commit:

```bash
git commit -m "ingest: add real-PDB integration test (opt-in, minified fixture)"
```

---

## Task 29: README + about page updates

**Files:**
- Modify: `README.md` (add ingest pipeline section)
- Modify: `apps/web/src/pages/about.astro` (already mentions sources — verify content matches actual implementation)

- [ ] **Step 1: Append to root `README.md`** an "Ingest pipeline" section explaining how to run it locally and what it produces.

- [ ] **Step 2: Re-read `apps/web/src/pages/about.astro`'s "Where the data comes from" section. The text already references PDBs / phnt / ReactOS / Wine / j00ru — verify accuracy. If the implementation diverged (e.g., a source was dropped), update the page text.

- [ ] **Step 3: Run web build to verify the page still renders.**

```bash
~/.local/bin/pnpm web:build
```

- [ ] **Step 4: Commit.**

```bash
git commit -m "ingest: document the pipeline in README and about page"
```

---

## Task 30: GitHub Actions nightly workflow

**Files:**
- Create: `.github/workflows/ingest-nightly.yml`

Nightly cron that runs the pipeline and opens a PR with the data diff.

```yaml
name: ingest-nightly

on:
  schedule:
    - cron: "0 6 * * *"   # 06:00 UTC daily
  workflow_dispatch:

jobs:
  ingest:
    name: refresh dataset
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
      - working-directory: packages/ingest
        run: |
          python -m pip install --upgrade pip
          pip install -e .[dev]
      - working-directory: packages/ingest
        run: okuden-ingest run
      - name: Validate produced dataset
        run: |
          npm install -g pnpm@9
          pnpm install --frozen-lockfile
          pnpm validate:data
      - name: Open PR if dataset changed
        uses: peter-evans/create-pull-request@v6
        with:
          title: "ingest: nightly dataset refresh"
          body: |
            Automated nightly run of the ingest pipeline.
            Review the diff against the previous dataset before merging.
          branch: ingest/nightly
          delete-branch: true
          commit-message: "ingest: nightly refresh"
```

- [ ] **Step 1: Create the workflow file** above.

- [ ] **Step 2: Verify YAML.**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ingest-nightly.yml')); print('OK')"
```

- [ ] **Step 3: Commit.**

```bash
git commit -m "ingest: add nightly GitHub Actions workflow (auto-PR on diff)"
```

---

## Final verification

After all 30 tasks committed:

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden

# Clean install
pnpm install --frozen-lockfile
pnpm validate:data
pnpm web:build
pnpm web:test

# Python side
cd packages/ingest
.venv/bin/pip install -e .[dev]
.venv/bin/pytest -v             # all tests pass
.venv/bin/pytest -m integration -v   # opt-in slow tests, may pull real network

# Run the actual pipeline
.venv/bin/okuden-ingest info    # shows config
.venv/bin/okuden-ingest run     # produces packages/data/{api,struct,version}/*.json
```

Expected after `okuden-ingest run`:
- `packages/data/api/` contains many more JSON files than the 8 hand-curated ones
- `pnpm validate:data` still passes (all produced files match schemas)
- `pnpm web:build` includes all new APIs in the rendered site

The dataset has been transformed from "hand-curated minimal" to "regenerable + comprehensive".

---

## Out of scope for this plan

- Adding new DLLs to the schema enum → requires a schema bump task in Plan 1's territory
- ARM64 support → V2
- Live-watch mode → V2
- Web UI for triggering re-ingest → V2
- Public JSON API endpoint serving the dataset → V2
- Automatic updates to phnt submodule (it stays pinned) → manual via `git submodule update --remote`
- Separate ingest pipelines for kernel APIs (ntoskrnl) → outside V1 scope
