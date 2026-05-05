# Okuden Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Okuden monorepo: directory layout, JSON Schemas (canonical data shape), Node + Python validators, a small hand-curated fixture dataset that subsequent plans (web app, ingest pipeline) can develop against, CI verification, and per-package licensing.

**Architecture:** pnpm workspaces at the root with three packages — `apps/web` (stub for now, populated by Plan 2), `packages/data` (JSON Schemas + JSON dataset, the contract between producer and consumer), `packages/ingest` (stub Python package, populated by Plan 3). Schema validation lives in two places: a Node script (`packages/data/scripts/validate.mjs`) used by CI, and a tiny Python module (`okuden_ingest.validate`) used by ingest tests. JSON Schema is the single source of truth.

**Tech Stack:** pnpm, Node 20+, ajv 8, ajv-formats, Python 3.12, jsonschema (Python), pytest, GitHub Actions.

---

## File Structure

Files this plan creates (all paths relative to repo root, which is `/home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/`):

```
okuden/
├── README.md                                         # Task 10
├── LICENSE                                           # Task 9
├── package.json                                      # Task 1
├── pnpm-workspace.yaml                               # Task 1
├── .nvmrc                                            # Task 1
├── apps/web/
│   ├── package.json                                  # Task 1 (stub)
│   └── LICENSE                                       # Task 9
├── packages/data/
│   ├── package.json                                  # Task 1
│   ├── LICENSE                                       # Task 9
│   ├── schemas/
│   │   ├── api.schema.json                           # Task 2
│   │   ├── struct.schema.json                        # Task 3
│   │   └── version.schema.json                       # Task 4
│   ├── api/
│   │   ├── NtCreateFile.json                         # Task 7
│   │   ├── NtOpenProcess.json                        # Task 7
│   │   ├── NtAllocateVirtualMemory.json              # Task 7
│   │   ├── NtReadFile.json                           # Task 7
│   │   ├── NtWriteFile.json                          # Task 7
│   │   ├── CreateFileW.json                          # Task 7
│   │   ├── VirtualAlloc.json                         # Task 7
│   │   └── OpenProcess.json                          # Task 7
│   ├── struct/
│   │   ├── _PEB.json                                 # Task 7
│   │   └── _OBJECT_ATTRIBUTES.json                   # Task 7
│   ├── version/
│   │   ├── win10-22h2.json                           # Task 7
│   │   ├── win11-23h2.json                           # Task 7
│   │   └── win11-24h2.json                           # Task 7
│   ├── scripts/
│   │   └── validate.mjs                              # Task 5
│   └── __fixtures__/
│       ├── api-valid.json                            # Task 2
│       ├── api-invalid.json                          # Task 2
│       ├── struct-valid.json                         # Task 3
│       ├── struct-invalid.json                       # Task 3
│       ├── version-valid.json                        # Task 4
│       └── version-invalid.json                      # Task 4
├── packages/ingest/
│   ├── pyproject.toml                                # Task 1 + Task 6
│   ├── LICENSE                                       # Task 9
│   ├── okuden_ingest/
│   │   ├── __init__.py                               # Task 1
│   │   └── validate.py                               # Task 6
│   └── tests/
│       ├── __init__.py                               # Task 6
│       └── test_validate.py                          # Task 6
└── .github/workflows/
    └── verify.yml                                    # Task 8
```

---

## Task 1: Bootstrap monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.nvmrc`
- Create: `apps/web/package.json` (stub)
- Create: `packages/data/package.json`
- Create: `packages/ingest/pyproject.toml` (stub — Task 6 fills it in)
- Create: `packages/ingest/okuden_ingest/__init__.py` (empty)

**Notes:** No tests in this task — it is pure scaffolding. Verification is "does `pnpm install` succeed and produce a coherent workspace tree?".

- [ ] **Step 1: Create the root `package.json`**

```json
{
  "name": "okuden",
  "version": "0.0.0",
  "private": true,
  "description": "Public web reference for Windows internal APIs.",
  "engines": {
    "node": ">=20.10.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "validate:data": "node packages/data/scripts/validate.mjs"
  },
  "devDependencies": {
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1"
  }
}
```

Save this to `package.json` at the repo root.

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `.nvmrc`**

```
20
```

- [ ] **Step 4: Create stub `apps/web/package.json`**

```json
{
  "name": "@okuden/web",
  "version": "0.0.0",
  "private": true,
  "description": "Okuden static site (populated by Plan 2)."
}
```

This is a placeholder so workspaces resolves cleanly. Plan 2 replaces it with the real Astro app.

- [ ] **Step 5: Create `packages/data/package.json`**

```json
{
  "name": "@okuden/data",
  "version": "0.0.0",
  "private": true,
  "description": "Okuden dataset (JSON Schemas + JSON entries). CC BY-SA 4.0.",
  "type": "module",
  "exports": {
    "./schemas/api": "./schemas/api.schema.json",
    "./schemas/struct": "./schemas/struct.schema.json",
    "./schemas/version": "./schemas/version.schema.json"
  }
}
```

- [ ] **Step 6: Create stub `packages/ingest/pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "okuden-ingest"
version = "0.0.0"
description = "Okuden ingest pipeline (stub — populated by Plan 3)."
requires-python = ">=3.12"
dependencies = []

[project.optional-dependencies]
dev = []

[tool.hatch.build.targets.wheel]
packages = ["okuden_ingest"]
```

- [ ] **Step 7: Create `packages/ingest/okuden_ingest/__init__.py`**

Empty file. Marks the directory as a Python package.

```
```

(Just create an empty file. On a Unix shell: `: > packages/ingest/okuden_ingest/__init__.py`. The Write tool can create it with empty content if needed.)

- [ ] **Step 8: Run `pnpm install` and verify**

Run from repo root:

```bash
pnpm install
```

Expected output: pnpm resolves three workspaces (`@okuden/web`, `@okuden/data`, root `okuden`), installs `ajv` and `ajv-formats`, no errors. A `pnpm-lock.yaml` and `node_modules/` appear.

- [ ] **Step 9: Add `node_modules/` to `.gitignore`**

The `.gitignore` already exists with `.superpowers/`. Append:

```
node_modules/
pnpm-debug.log
*.egg-info/
__pycache__/
.pytest_cache/
dist/
.venv/
```

(Use Edit tool to append, not Write, since the file already exists.)

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .nvmrc .gitignore \
        apps/web/package.json \
        packages/data/package.json \
        packages/ingest/pyproject.toml packages/ingest/okuden_ingest/__init__.py
git commit -m "bootstrap monorepo (pnpm workspaces, stub packages)"
```

---

## Task 2: API JSON Schema (TDD)

**Files:**
- Create: `packages/data/schemas/api.schema.json`
- Create: `packages/data/__fixtures__/api-valid.json`
- Create: `packages/data/__fixtures__/api-invalid.json`
- Create: `packages/data/scripts/validate.mjs` (skeleton — Task 5 expands it)

- [ ] **Step 1: Write the validating-fixture and the failing-fixture, plus a temporary self-test in the validate script**

Create `packages/data/__fixtures__/api-valid.json`:

```json
{
  "name": "NtCreateFile",
  "dll": "ntdll",
  "category": "file",
  "description": "Creates or opens a file or device.",
  "prototype": "NTSTATUS NtCreateFile(PHANDLE FileHandle, ACCESS_MASK DesiredAccess, POBJECT_ATTRIBUTES ObjectAttributes, ...);",
  "parameters": [
    { "name": "FileHandle", "type": "PHANDLE", "direction": "out" }
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {
    "ssn": { "win11-24h2": 85 },
    "hash": { "djb2": "0x6c4f8b9a" }
  },
  "usedBy": ["CreateFileW"],
  "calls": [],
  "structsUsed": ["_OBJECT_ATTRIBUTES"],
  "examples": [],
  "source": { "lastVerified": "2026-05-05" }
}
```

Create `packages/data/__fixtures__/api-invalid.json` (every field deliberately wrong so a single fixture exercises many rules):

```json
{
  "name": "Not A Valid Name",
  "dll": "wronglib",
  "category": "FILE",
  "description": "",
  "prototype": "",
  "parameters": [{ "name": "x", "type": "int", "direction": "sideways" }],
  "returnType": "void",
  "tags": ["bogus-tag"],
  "usedBy": [],
  "calls": [],
  "structsUsed": [],
  "examples": [],
  "source": { "lastVerified": "not-a-date" }
}
```

Create `packages/data/scripts/validate.mjs` with just the API-schema check for now:

```js
#!/usr/bin/env node
// Minimal validator used by Task 2; Task 5 expands it to walk the full dataset.
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const schema = JSON.parse(readFileSync(resolve(root, "schemas/api.schema.json"), "utf-8"));
const validate = ajv.compile(schema);

const valid = JSON.parse(readFileSync(resolve(root, "__fixtures__/api-valid.json"), "utf-8"));
const invalid = JSON.parse(readFileSync(resolve(root, "__fixtures__/api-invalid.json"), "utf-8"));

let failed = false;

if (!validate(valid)) {
  console.error("FAIL: api-valid.json was rejected:", validate.errors);
  failed = true;
}
if (validate(invalid)) {
  console.error("FAIL: api-invalid.json was accepted (it should be rejected).");
  failed = true;
}

if (failed) process.exit(1);
console.log("OK: api schema fixtures behave as expected.");
```

- [ ] **Step 2: Run the validator. Expect FAIL because the schema does not exist yet.**

```bash
pnpm validate:data
```

Expected: a `Cannot find module .../schemas/api.schema.json` error or equivalent. The test exits non-zero.

This confirms our test would fail in the absence of the schema.

- [ ] **Step 3: Write `packages/data/schemas/api.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://okuden.dev/schemas/api.schema.json",
  "title": "Okuden API entry",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "name", "dll", "category", "description", "prototype",
    "parameters", "returnType", "tags",
    "usedBy", "calls", "structsUsed", "examples", "source"
  ],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "dll": {
      "type": "string",
      "enum": ["ntdll", "kernel32", "kernelbase", "advapi32", "user32", "ws2_32"]
    },
    "category": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$"
    },
    "description": { "type": "string", "minLength": 1 },
    "prototype": { "type": "string", "minLength": 1 },
    "parameters": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "type", "direction"],
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "type": { "type": "string", "minLength": 1 },
          "direction": { "type": "string", "enum": ["in", "out", "inout"] },
          "description": { "type": "string" }
        }
      }
    },
    "returnType": { "type": "string", "minLength": 1 },
    "tags": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": ["syscall", "undocumented", "deprecated", "partial"]
      }
    },
    "syscall": {
      "type": "object",
      "additionalProperties": false,
      "required": ["ssn"],
      "properties": {
        "ssn": {
          "type": "object",
          "additionalProperties": { "type": "integer", "minimum": 0 }
        },
        "hash": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "pattern": "^0x[0-9a-fA-F]+$"
          }
        }
      }
    },
    "usedBy": { "type": "array", "items": { "type": "string" } },
    "calls": { "type": "array", "items": { "type": "string" } },
    "structsUsed": { "type": "array", "items": { "type": "string" } },
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["language", "title", "code"],
        "properties": {
          "language": { "type": "string", "enum": ["c", "asm"] },
          "title": { "type": "string", "minLength": 1 },
          "code": { "type": "string", "minLength": 1 },
          "description": { "type": "string" }
        }
      }
    },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": ["lastVerified"],
      "properties": {
        "pdb": {
          "type": "object",
          "additionalProperties": false,
          "required": ["module", "version"],
          "properties": {
            "module": { "type": "string" },
            "version": { "type": "string" }
          }
        },
        "phntPath": { "type": "string" },
        "reactosPath": { "type": "string" },
        "winePath": { "type": "string" },
        "j00ruRevision": { "type": "string" },
        "lastVerified": { "type": "string", "format": "date" }
      }
    }
  }
}
```

- [ ] **Step 4: Re-run the validator. Expect PASS.**

```bash
pnpm validate:data
```

Expected output: `OK: api schema fixtures behave as expected.` Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add packages/data/schemas/api.schema.json \
        packages/data/__fixtures__/api-valid.json \
        packages/data/__fixtures__/api-invalid.json \
        packages/data/scripts/validate.mjs
git commit -m "add API JSON Schema with fixture-driven validator"
```

---

## Task 3: Struct JSON Schema (TDD)

**Files:**
- Create: `packages/data/schemas/struct.schema.json`
- Create: `packages/data/__fixtures__/struct-valid.json`
- Create: `packages/data/__fixtures__/struct-invalid.json`
- Modify: `packages/data/scripts/validate.mjs` (extend self-test to cover struct schema)

- [ ] **Step 1: Write fixtures**

`packages/data/__fixtures__/struct-valid.json`:

```json
{
  "name": "_PEB",
  "description": "Process Environment Block. Per-process structure pointed to by gs:[0x60] on x64.",
  "fields": [
    {
      "name": "InheritedAddressSpace",
      "type": "BOOLEAN",
      "offsets": { "win11-24h2": 0 },
      "size": { "win11-24h2": 1 }
    },
    {
      "name": "Ldr",
      "type": "PPEB_LDR_DATA",
      "offsets": { "win11-24h2": 24 },
      "size": { "win11-24h2": 8 },
      "description": "Pointer to loader data (PEB_LDR_DATA)."
    }
  ],
  "usedBy": ["NtQueryInformationProcess"],
  "source": { "lastVerified": "2026-05-05" }
}
```

`packages/data/__fixtures__/struct-invalid.json`:

```json
{
  "name": "1bad name",
  "description": "",
  "fields": [
    { "name": "x", "type": "int", "offsets": { "v": -1 }, "size": { "v": 4 } }
  ],
  "usedBy": [],
  "source": { "lastVerified": "1999/01/01" }
}
```

Reasons it should fail: `name` does not match the identifier pattern, `description` is empty, an offset is negative, `lastVerified` is not ISO-date format.

- [ ] **Step 2: Extend `packages/data/scripts/validate.mjs` to also self-test struct fixtures**

Replace the body of `validate.mjs` with:

```js
#!/usr/bin/env node
// Minimal validator. Task 5 expands it to walk the full dataset.
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

function selfTest(schemaName) {
  const schema = JSON.parse(readFileSync(resolve(root, `schemas/${schemaName}.schema.json`), "utf-8"));
  const validate = ajv.compile(schema);
  const valid = JSON.parse(readFileSync(resolve(root, `__fixtures__/${schemaName}-valid.json`), "utf-8"));
  const invalid = JSON.parse(readFileSync(resolve(root, `__fixtures__/${schemaName}-invalid.json`), "utf-8"));
  let ok = true;
  if (!validate(valid)) {
    console.error(`FAIL: ${schemaName}-valid.json was rejected:`, validate.errors);
    ok = false;
  }
  if (validate(invalid)) {
    console.error(`FAIL: ${schemaName}-invalid.json was accepted (should be rejected).`);
    ok = false;
  }
  return ok;
}

const ok = ["api", "struct"].every(selfTest);
if (!ok) process.exit(1);
console.log("OK: schema fixtures behave as expected.");
```

- [ ] **Step 3: Run validator. Expect FAIL because the struct schema does not exist.**

```bash
pnpm validate:data
```

Expected: error loading `schemas/struct.schema.json`. Exit non-zero.

- [ ] **Step 4: Write `packages/data/schemas/struct.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://okuden.dev/schemas/struct.schema.json",
  "title": "Okuden struct entry",
  "type": "object",
  "additionalProperties": false,
  "required": ["name", "description", "fields", "usedBy", "source"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^_?[A-Za-z][A-Za-z0-9_]*$"
    },
    "description": { "type": "string", "minLength": 1 },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "type", "offsets", "size"],
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "type": { "type": "string", "minLength": 1 },
          "offsets": {
            "type": "object",
            "additionalProperties": { "type": "integer", "minimum": 0 }
          },
          "size": {
            "type": "object",
            "additionalProperties": { "type": "integer", "minimum": 0 }
          },
          "description": { "type": "string" }
        }
      }
    },
    "usedBy": { "type": "array", "items": { "type": "string" } },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": ["lastVerified"],
      "properties": {
        "pdb": {
          "type": "object",
          "additionalProperties": false,
          "required": ["module", "version"],
          "properties": {
            "module": { "type": "string" },
            "version": { "type": "string" }
          }
        },
        "phntPath": { "type": "string" },
        "reactosPath": { "type": "string" },
        "winePath": { "type": "string" },
        "lastVerified": { "type": "string", "format": "date" }
      }
    }
  }
}
```

- [ ] **Step 5: Re-run validator. Expect PASS.**

```bash
pnpm validate:data
```

Expected: `OK: schema fixtures behave as expected.` Exit code 0.

- [ ] **Step 6: Commit**

```bash
git add packages/data/schemas/struct.schema.json \
        packages/data/__fixtures__/struct-valid.json \
        packages/data/__fixtures__/struct-invalid.json \
        packages/data/scripts/validate.mjs
git commit -m "add struct JSON Schema; generalize fixture self-test"
```

---

## Task 4: Version JSON Schema (TDD)

**Files:**
- Create: `packages/data/schemas/version.schema.json`
- Create: `packages/data/__fixtures__/version-valid.json`
- Create: `packages/data/__fixtures__/version-invalid.json`
- Modify: `packages/data/scripts/validate.mjs` (add `"version"` to the self-test list)

- [ ] **Step 1: Write fixtures**

`packages/data/__fixtures__/version-valid.json`:

```json
{
  "id": "win11-24h2",
  "displayName": "Windows 11 24H2",
  "buildNumber": "26100",
  "releaseDate": "2024-10-01",
  "isCurrent": true
}
```

`packages/data/__fixtures__/version-invalid.json`:

```json
{
  "id": "WIN_11",
  "displayName": "",
  "buildNumber": "abc",
  "releaseDate": "2024",
  "isCurrent": "yes"
}
```

Reasons it should fail: `id` not lowercase-hyphen, `displayName` empty, `buildNumber` not digits, `releaseDate` not ISO-date, `isCurrent` not boolean.

- [ ] **Step 2: Extend `packages/data/scripts/validate.mjs`**

Change the self-test array. Replace the line:

```js
const ok = ["api", "struct"].every(selfTest);
```

with:

```js
const ok = ["api", "struct", "version"].every(selfTest);
```

- [ ] **Step 3: Run validator. Expect FAIL.**

```bash
pnpm validate:data
```

Expected: error loading `schemas/version.schema.json`.

- [ ] **Step 4: Write `packages/data/schemas/version.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://okuden.dev/schemas/version.schema.json",
  "title": "Okuden Windows version entry",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "displayName", "buildNumber", "releaseDate", "isCurrent"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z][a-z0-9-]+$" },
    "displayName": { "type": "string", "minLength": 1 },
    "buildNumber": { "type": "string", "pattern": "^\\d+(\\.\\d+)?$" },
    "releaseDate": { "type": "string", "format": "date" },
    "isCurrent": { "type": "boolean" }
  }
}
```

- [ ] **Step 5: Re-run validator. Expect PASS.**

```bash
pnpm validate:data
```

Expected: `OK: schema fixtures behave as expected.`

- [ ] **Step 6: Commit**

```bash
git add packages/data/schemas/version.schema.json \
        packages/data/__fixtures__/version-valid.json \
        packages/data/__fixtures__/version-invalid.json \
        packages/data/scripts/validate.mjs
git commit -m "add version JSON Schema"
```

---

## Task 5: Full-dataset validate script

Goal: turn `validate.mjs` from a fixture-only self-test into the real CI script that also walks `packages/data/{api,struct,version}/*.json` and validates every file.

**Files:**
- Modify: `packages/data/scripts/validate.mjs`
- Create: `packages/data/api/.gitkeep` (so the directory is committed even before Task 7 fills it)
- Create: `packages/data/struct/.gitkeep`
- Create: `packages/data/version/.gitkeep`

- [ ] **Step 1: Replace `packages/data/scripts/validate.mjs` with the full version**

```js
#!/usr/bin/env node
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const validators = {};
for (const name of ["api", "struct", "version"]) {
  const schema = JSON.parse(readFileSync(resolve(root, `schemas/${name}.schema.json`), "utf-8"));
  validators[name] = ajv.compile(schema);
}

let failed = 0;
let checked = 0;

// 1. Fixture self-tests (regressed if a schema becomes too lax/strict)
for (const name of ["api", "struct", "version"]) {
  const valid = JSON.parse(readFileSync(resolve(root, `__fixtures__/${name}-valid.json`), "utf-8"));
  const invalid = JSON.parse(readFileSync(resolve(root, `__fixtures__/${name}-invalid.json`), "utf-8"));
  if (!validators[name](valid)) {
    console.error(`FAIL [fixture]: ${name}-valid was rejected:`, validators[name].errors);
    failed++;
  }
  if (validators[name](invalid)) {
    console.error(`FAIL [fixture]: ${name}-invalid was accepted (should be rejected).`);
    failed++;
  }
  checked += 2;
}

// 2. Walk real dataset
for (const kind of ["api", "struct", "version"]) {
  const dir = resolve(root, kind);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const path = join(dir, file);
    let data;
    try {
      data = JSON.parse(readFileSync(path, "utf-8"));
    } catch (err) {
      console.error(`FAIL [parse]: ${path}: ${err.message}`);
      failed++;
      continue;
    }
    if (!validators[kind](data)) {
      console.error(`FAIL [schema]: ${path}:`);
      for (const e of validators[kind].errors) {
        console.error(`  ${e.instancePath || "(root)"} ${e.message}`);
      }
      failed++;
    }
    checked++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} failures across ${checked} checks.`);
  process.exit(1);
}
console.log(`OK: ${checked} files validated.`);
```

- [ ] **Step 2: Create the empty data directories**

Create empty placeholder files (so git tracks empty dirs, and the validator doesn't crash if Task 7 hasn't run yet):

```bash
touch packages/data/api/.gitkeep
touch packages/data/struct/.gitkeep
touch packages/data/version/.gitkeep
```

- [ ] **Step 3: Run validator. Expect PASS (no real entries yet, just fixtures and empty dirs).**

```bash
pnpm validate:data
```

Expected: `OK: 6 files validated.` (the 6 are the fixture self-tests). Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/data/scripts/validate.mjs \
        packages/data/api/.gitkeep \
        packages/data/struct/.gitkeep \
        packages/data/version/.gitkeep
git commit -m "expand validator to walk the full dataset"
```

---

## Task 6: Python validator in ingest

Mirror the Node validator in Python so the ingest pipeline (Plan 3) can validate before emitting.

**Files:**
- Modify: `packages/ingest/pyproject.toml` (add real deps)
- Create: `packages/ingest/okuden_ingest/validate.py`
- Create: `packages/ingest/tests/__init__.py` (empty)
- Create: `packages/ingest/tests/test_validate.py`

- [ ] **Step 1: Update `packages/ingest/pyproject.toml` with real dependencies**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "okuden-ingest"
version = "0.0.0"
description = "Okuden ingest pipeline (stub — populated by Plan 3)."
requires-python = ">=3.12"
dependencies = [
  "jsonschema>=4.21",
]

[project.optional-dependencies]
dev = [
  "pytest>=8",
]

[tool.hatch.build.targets.wheel]
packages = ["okuden_ingest"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Create `packages/ingest/okuden_ingest/validate.py`**

```python
"""JSON Schema validation against the canonical Okuden schemas.

The schemas live in ``packages/data/schemas/`` (sibling of this package
inside the monorepo). We resolve them relative to the repo root.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError

# Walk up from this file to the repo root: okuden_ingest/ -> ingest/ -> packages/ -> repo
_REPO_ROOT = Path(__file__).resolve().parents[3]
_SCHEMAS_DIR = _REPO_ROOT / "packages" / "data" / "schemas"

SCHEMA_NAMES = ("api", "struct", "version")


def _load_validator(name: str) -> Draft202012Validator:
    schema_path = _SCHEMAS_DIR / f"{name}.schema.json"
    with schema_path.open(encoding="utf-8") as f:
        schema = json.load(f)
    return Draft202012Validator(schema)


_VALIDATORS = {name: _load_validator(name) for name in SCHEMA_NAMES}


def validate(kind: str, data: Any) -> list[ValidationError]:
    """Validate ``data`` against the schema named ``kind``.

    Returns a list of ValidationError. Empty list means valid.
    """
    if kind not in _VALIDATORS:
        raise ValueError(f"unknown schema kind: {kind!r} (expected one of {SCHEMA_NAMES})")
    return list(_VALIDATORS[kind].iter_errors(data))


def is_valid(kind: str, data: Any) -> bool:
    return not validate(kind, data)


def iter_dataset_errors(kind: str) -> Iterable[tuple[Path, ValidationError]]:
    """Yield (path, error) for every entry in ``packages/data/<kind>/`` that fails validation."""
    data_dir = _REPO_ROOT / "packages" / "data" / kind
    for path in sorted(data_dir.glob("*.json")):
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
        for err in validate(kind, data):
            yield path, err
```

- [ ] **Step 3: Create `packages/ingest/tests/__init__.py`** — empty file.

- [ ] **Step 4: Write the failing test in `packages/ingest/tests/test_validate.py`**

```python
"""Tests mirror the Node fixture self-test: valid fixtures pass, invalid ones fail."""
import json
from pathlib import Path

import pytest

from okuden_ingest.validate import SCHEMA_NAMES, validate

_FIXTURES = Path(__file__).resolve().parents[2] / "data" / "__fixtures__"


@pytest.mark.parametrize("name", SCHEMA_NAMES)
def test_valid_fixture_passes(name: str) -> None:
    data = json.loads((_FIXTURES / f"{name}-valid.json").read_text(encoding="utf-8"))
    errors = validate(name, data)
    assert errors == [], f"valid {name} fixture rejected: {errors}"


@pytest.mark.parametrize("name", SCHEMA_NAMES)
def test_invalid_fixture_fails(name: str) -> None:
    data = json.loads((_FIXTURES / f"{name}-invalid.json").read_text(encoding="utf-8"))
    errors = validate(name, data)
    assert errors, f"invalid {name} fixture was accepted (should have failed)"


def test_unknown_kind_raises() -> None:
    with pytest.raises(ValueError):
        validate("not-a-kind", {})
```

- [ ] **Step 5: Set up the Python venv, install, run tests**

```bash
cd packages/ingest
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest -v
```

Expected: 7 tests pass (3 valid-fixture × pass, 3 invalid-fixture × fail-as-expected, 1 unknown-kind raises).

- [ ] **Step 6: Commit**

```bash
cd ../..
git add packages/ingest/pyproject.toml \
        packages/ingest/okuden_ingest/validate.py \
        packages/ingest/tests/__init__.py \
        packages/ingest/tests/test_validate.py
git commit -m "add Python schema validator (mirrors Node validator)"
```

---

## Task 7: Real fixture dataset

Hand-curated minimal dataset so that Plan 2 (web app) has something to render. Exactly 8 APIs, 2 structs, 3 versions.

**Files:**
- Create: `packages/data/api/NtCreateFile.json`
- Create: `packages/data/api/NtOpenProcess.json`
- Create: `packages/data/api/NtAllocateVirtualMemory.json`
- Create: `packages/data/api/NtReadFile.json`
- Create: `packages/data/api/NtWriteFile.json`
- Create: `packages/data/api/CreateFileW.json`
- Create: `packages/data/api/VirtualAlloc.json`
- Create: `packages/data/api/OpenProcess.json`
- Create: `packages/data/struct/_PEB.json`
- Create: `packages/data/struct/_OBJECT_ATTRIBUTES.json`
- Create: `packages/data/version/win10-22h2.json`
- Create: `packages/data/version/win11-23h2.json`
- Create: `packages/data/version/win11-24h2.json`

**Notes:** Real-world SSN values vary across Windows versions. The values below are realistic for Win11 24H2 from public j00ru tables but should be cross-checked against the actual j00ru data when Plan 3 wires up the pipeline. For Plan 1's purposes (fixture data unblocking the web app), they only need to validate against the schema.

- [ ] **Step 1: Create the three Windows version files**

`packages/data/version/win10-22h2.json`:

```json
{
  "id": "win10-22h2",
  "displayName": "Windows 10 22H2",
  "buildNumber": "19045",
  "releaseDate": "2022-10-18",
  "isCurrent": false
}
```

`packages/data/version/win11-23h2.json`:

```json
{
  "id": "win11-23h2",
  "displayName": "Windows 11 23H2",
  "buildNumber": "22631",
  "releaseDate": "2023-10-31",
  "isCurrent": false
}
```

`packages/data/version/win11-24h2.json`:

```json
{
  "id": "win11-24h2",
  "displayName": "Windows 11 24H2",
  "buildNumber": "26100",
  "releaseDate": "2024-10-01",
  "isCurrent": true
}
```

- [ ] **Step 2: Create the two struct files**

`packages/data/struct/_PEB.json`:

```json
{
  "name": "_PEB",
  "description": "Process Environment Block. Per-process structure pointed to by gs:[0x60] on x64 (fs:[0x30] on x86). Holds loader data, command line, environment block, image base, and many other process-wide fields.",
  "fields": [
    {
      "name": "InheritedAddressSpace",
      "type": "BOOLEAN",
      "offsets": { "win10-22h2": 0, "win11-23h2": 0, "win11-24h2": 0 },
      "size": { "win10-22h2": 1, "win11-23h2": 1, "win11-24h2": 1 }
    },
    {
      "name": "ReadImageFileExecOptions",
      "type": "BOOLEAN",
      "offsets": { "win10-22h2": 1, "win11-23h2": 1, "win11-24h2": 1 },
      "size": { "win10-22h2": 1, "win11-23h2": 1, "win11-24h2": 1 }
    },
    {
      "name": "BeingDebugged",
      "type": "BOOLEAN",
      "offsets": { "win10-22h2": 2, "win11-23h2": 2, "win11-24h2": 2 },
      "size": { "win10-22h2": 1, "win11-23h2": 1, "win11-24h2": 1 },
      "description": "Set by NtSetInformationProcess on attach. Common anti-debug check target."
    },
    {
      "name": "ImageBaseAddress",
      "type": "PVOID",
      "offsets": { "win10-22h2": 16, "win11-23h2": 16, "win11-24h2": 16 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
    },
    {
      "name": "Ldr",
      "type": "PPEB_LDR_DATA",
      "offsets": { "win10-22h2": 24, "win11-23h2": 24, "win11-24h2": 24 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 },
      "description": "Pointer to PEB_LDR_DATA — the doubly-linked list of loaded modules."
    },
    {
      "name": "ProcessParameters",
      "type": "PRTL_USER_PROCESS_PARAMETERS",
      "offsets": { "win10-22h2": 32, "win11-23h2": 32, "win11-24h2": 32 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
    }
  ],
  "usedBy": ["NtQueryInformationProcess"],
  "source": {
    "phntPath": "phnt/ntpebteb.h",
    "lastVerified": "2026-05-05"
  }
}
```

`packages/data/struct/_OBJECT_ATTRIBUTES.json`:

```json
{
  "name": "_OBJECT_ATTRIBUTES",
  "description": "Specifies attributes for an object handle creation: target name, root directory, security descriptor, and behavior flags. Required by every Nt* API that opens or creates an object.",
  "fields": [
    {
      "name": "Length",
      "type": "ULONG",
      "offsets": { "win10-22h2": 0, "win11-23h2": 0, "win11-24h2": 0 },
      "size": { "win10-22h2": 4, "win11-23h2": 4, "win11-24h2": 4 },
      "description": "sizeof(OBJECT_ATTRIBUTES). Caller MUST set this; kernel rejects mismatched sizes."
    },
    {
      "name": "RootDirectory",
      "type": "HANDLE",
      "offsets": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
    },
    {
      "name": "ObjectName",
      "type": "PUNICODE_STRING",
      "offsets": { "win10-22h2": 16, "win11-23h2": 16, "win11-24h2": 16 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
    },
    {
      "name": "Attributes",
      "type": "ULONG",
      "offsets": { "win10-22h2": 24, "win11-23h2": 24, "win11-24h2": 24 },
      "size": { "win10-22h2": 4, "win11-23h2": 4, "win11-24h2": 4 },
      "description": "OBJ_* flags (OBJ_CASE_INSENSITIVE, OBJ_INHERIT, OBJ_KERNEL_HANDLE, ...)."
    },
    {
      "name": "SecurityDescriptor",
      "type": "PVOID",
      "offsets": { "win10-22h2": 32, "win11-23h2": 32, "win11-24h2": 32 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
    },
    {
      "name": "SecurityQualityOfService",
      "type": "PVOID",
      "offsets": { "win10-22h2": 40, "win11-23h2": 40, "win11-24h2": 40 },
      "size": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
    }
  ],
  "usedBy": ["NtCreateFile", "NtOpenProcess", "NtOpenFile"],
  "source": {
    "phntPath": "phnt/ntbasic.h",
    "lastVerified": "2026-05-05"
  }
}
```

- [ ] **Step 3: Create five ntdll syscall API files**

`packages/data/api/NtCreateFile.json`:

```json
{
  "name": "NtCreateFile",
  "dll": "ntdll",
  "category": "file",
  "description": "Creates or opens a file or device, returning a handle. The kernel-mode primitive behind CreateFileW; takes an OBJECT_ATTRIBUTES rather than a path string.",
  "prototype": "NTSTATUS NtCreateFile(PHANDLE FileHandle, ACCESS_MASK DesiredAccess, POBJECT_ATTRIBUTES ObjectAttributes, PIO_STATUS_BLOCK IoStatusBlock, PLARGE_INTEGER AllocationSize, ULONG FileAttributes, ULONG ShareAccess, ULONG CreateDisposition, ULONG CreateOptions, PVOID EaBuffer, ULONG EaLength);",
  "parameters": [
    { "name": "FileHandle", "type": "PHANDLE", "direction": "out", "description": "Receives the resulting handle on success." },
    { "name": "DesiredAccess", "type": "ACCESS_MASK", "direction": "in" },
    { "name": "ObjectAttributes", "type": "POBJECT_ATTRIBUTES", "direction": "in" },
    { "name": "IoStatusBlock", "type": "PIO_STATUS_BLOCK", "direction": "out" },
    { "name": "AllocationSize", "type": "PLARGE_INTEGER", "direction": "in" },
    { "name": "FileAttributes", "type": "ULONG", "direction": "in" },
    { "name": "ShareAccess", "type": "ULONG", "direction": "in" },
    { "name": "CreateDisposition", "type": "ULONG", "direction": "in" },
    { "name": "CreateOptions", "type": "ULONG", "direction": "in" },
    { "name": "EaBuffer", "type": "PVOID", "direction": "in" },
    { "name": "EaLength", "type": "ULONG", "direction": "in" }
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {
    "ssn": { "win10-22h2": 85, "win11-23h2": 85, "win11-24h2": 85 }
  },
  "usedBy": ["CreateFileW"],
  "calls": [],
  "structsUsed": ["_OBJECT_ATTRIBUTES", "_IO_STATUS_BLOCK"],
  "examples": [
    {
      "language": "asm",
      "title": "Direct syscall stub (x64)",
      "code": "; NtCreateFile direct syscall — Win11 24H2 SSN 0x55\nmov r10, rcx\nmov eax, 0x55\nsyscall\nret"
    }
  ],
  "source": {
    "phntPath": "phnt/ntioapi.h",
    "reactosPath": "ntoskrnl/io/iomgr/file.c",
    "lastVerified": "2026-05-05"
  }
}
```

`packages/data/api/NtOpenProcess.json`:

```json
{
  "name": "NtOpenProcess",
  "dll": "ntdll",
  "category": "process",
  "description": "Opens a handle to an existing process by client ID, with the requested access. Underlies kernel32!OpenProcess.",
  "prototype": "NTSTATUS NtOpenProcess(PHANDLE ProcessHandle, ACCESS_MASK DesiredAccess, POBJECT_ATTRIBUTES ObjectAttributes, PCLIENT_ID ClientId);",
  "parameters": [
    { "name": "ProcessHandle", "type": "PHANDLE", "direction": "out" },
    { "name": "DesiredAccess", "type": "ACCESS_MASK", "direction": "in" },
    { "name": "ObjectAttributes", "type": "POBJECT_ATTRIBUTES", "direction": "in" },
    { "name": "ClientId", "type": "PCLIENT_ID", "direction": "in" }
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {
    "ssn": { "win10-22h2": 38, "win11-23h2": 38, "win11-24h2": 38 }
  },
  "usedBy": ["OpenProcess"],
  "calls": [],
  "structsUsed": ["_OBJECT_ATTRIBUTES"],
  "examples": [
    {
      "language": "asm",
      "title": "Direct syscall stub (x64)",
      "code": "; NtOpenProcess direct syscall — Win11 24H2 SSN 0x26\nmov r10, rcx\nmov eax, 0x26\nsyscall\nret"
    }
  ],
  "source": {
    "phntPath": "phnt/ntpsapi.h",
    "lastVerified": "2026-05-05"
  }
}
```

`packages/data/api/NtAllocateVirtualMemory.json`:

```json
{
  "name": "NtAllocateVirtualMemory",
  "dll": "ntdll",
  "category": "memory",
  "description": "Reserves, commits, or both, a region of pages within the user-mode virtual address space of a specified process. Underlies kernel32!VirtualAlloc and VirtualAllocEx.",
  "prototype": "NTSTATUS NtAllocateVirtualMemory(HANDLE ProcessHandle, PVOID *BaseAddress, ULONG_PTR ZeroBits, PSIZE_T RegionSize, ULONG AllocationType, ULONG Protect);",
  "parameters": [
    { "name": "ProcessHandle", "type": "HANDLE", "direction": "in" },
    { "name": "BaseAddress", "type": "PVOID*", "direction": "inout" },
    { "name": "ZeroBits", "type": "ULONG_PTR", "direction": "in" },
    { "name": "RegionSize", "type": "PSIZE_T", "direction": "inout" },
    { "name": "AllocationType", "type": "ULONG", "direction": "in" },
    { "name": "Protect", "type": "ULONG", "direction": "in" }
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {
    "ssn": { "win10-22h2": 24, "win11-23h2": 24, "win11-24h2": 24 }
  },
  "usedBy": ["VirtualAlloc", "VirtualAllocEx"],
  "calls": [],
  "structsUsed": [],
  "examples": [],
  "source": {
    "phntPath": "phnt/ntmmapi.h",
    "lastVerified": "2026-05-05"
  }
}
```

`packages/data/api/NtReadFile.json`:

```json
{
  "name": "NtReadFile",
  "dll": "ntdll",
  "category": "file",
  "description": "Reads data from a file or device handle previously obtained from NtCreateFile/NtOpenFile.",
  "prototype": "NTSTATUS NtReadFile(HANDLE FileHandle, HANDLE Event, PIO_APC_ROUTINE ApcRoutine, PVOID ApcContext, PIO_STATUS_BLOCK IoStatusBlock, PVOID Buffer, ULONG Length, PLARGE_INTEGER ByteOffset, PULONG Key);",
  "parameters": [
    { "name": "FileHandle", "type": "HANDLE", "direction": "in" },
    { "name": "Event", "type": "HANDLE", "direction": "in" },
    { "name": "ApcRoutine", "type": "PIO_APC_ROUTINE", "direction": "in" },
    { "name": "ApcContext", "type": "PVOID", "direction": "in" },
    { "name": "IoStatusBlock", "type": "PIO_STATUS_BLOCK", "direction": "out" },
    { "name": "Buffer", "type": "PVOID", "direction": "out" },
    { "name": "Length", "type": "ULONG", "direction": "in" },
    { "name": "ByteOffset", "type": "PLARGE_INTEGER", "direction": "in" },
    { "name": "Key", "type": "PULONG", "direction": "in" }
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {
    "ssn": { "win10-22h2": 6, "win11-23h2": 6, "win11-24h2": 6 }
  },
  "usedBy": ["ReadFile"],
  "calls": [],
  "structsUsed": ["_IO_STATUS_BLOCK"],
  "examples": [],
  "source": {
    "phntPath": "phnt/ntioapi.h",
    "lastVerified": "2026-05-05"
  }
}
```

`packages/data/api/NtWriteFile.json`:

```json
{
  "name": "NtWriteFile",
  "dll": "ntdll",
  "category": "file",
  "description": "Writes data to a file or device handle previously obtained from NtCreateFile/NtOpenFile.",
  "prototype": "NTSTATUS NtWriteFile(HANDLE FileHandle, HANDLE Event, PIO_APC_ROUTINE ApcRoutine, PVOID ApcContext, PIO_STATUS_BLOCK IoStatusBlock, PVOID Buffer, ULONG Length, PLARGE_INTEGER ByteOffset, PULONG Key);",
  "parameters": [
    { "name": "FileHandle", "type": "HANDLE", "direction": "in" },
    { "name": "Event", "type": "HANDLE", "direction": "in" },
    { "name": "ApcRoutine", "type": "PIO_APC_ROUTINE", "direction": "in" },
    { "name": "ApcContext", "type": "PVOID", "direction": "in" },
    { "name": "IoStatusBlock", "type": "PIO_STATUS_BLOCK", "direction": "out" },
    { "name": "Buffer", "type": "PVOID", "direction": "in" },
    { "name": "Length", "type": "ULONG", "direction": "in" },
    { "name": "ByteOffset", "type": "PLARGE_INTEGER", "direction": "in" },
    { "name": "Key", "type": "PULONG", "direction": "in" }
  ],
  "returnType": "NTSTATUS",
  "tags": ["syscall", "partial"],
  "syscall": {
    "ssn": { "win10-22h2": 8, "win11-23h2": 8, "win11-24h2": 8 }
  },
  "usedBy": ["WriteFile"],
  "calls": [],
  "structsUsed": ["_IO_STATUS_BLOCK"],
  "examples": [],
  "source": {
    "phntPath": "phnt/ntioapi.h",
    "lastVerified": "2026-05-05"
  }
}
```

- [ ] **Step 4: Create three Win32 user-mode API files**

`packages/data/api/CreateFileW.json`:

```json
{
  "name": "CreateFileW",
  "dll": "kernel32",
  "category": "file",
  "description": "Creates or opens a file or I/O device. The Win32 wrapper around NtCreateFile that accepts a Unicode path string.",
  "prototype": "HANDLE CreateFileW(LPCWSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes, DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile);",
  "parameters": [
    { "name": "lpFileName", "type": "LPCWSTR", "direction": "in" },
    { "name": "dwDesiredAccess", "type": "DWORD", "direction": "in" },
    { "name": "dwShareMode", "type": "DWORD", "direction": "in" },
    { "name": "lpSecurityAttributes", "type": "LPSECURITY_ATTRIBUTES", "direction": "in" },
    { "name": "dwCreationDisposition", "type": "DWORD", "direction": "in" },
    { "name": "dwFlagsAndAttributes", "type": "DWORD", "direction": "in" },
    { "name": "hTemplateFile", "type": "HANDLE", "direction": "in" }
  ],
  "returnType": "HANDLE",
  "tags": [],
  "usedBy": [],
  "calls": ["NtCreateFile"],
  "structsUsed": [],
  "examples": [],
  "source": { "lastVerified": "2026-05-05" }
}
```

`packages/data/api/VirtualAlloc.json`:

```json
{
  "name": "VirtualAlloc",
  "dll": "kernel32",
  "category": "memory",
  "description": "Reserves, commits, or changes the state of a region of pages in the calling process's virtual address space.",
  "prototype": "LPVOID VirtualAlloc(LPVOID lpAddress, SIZE_T dwSize, DWORD flAllocationType, DWORD flProtect);",
  "parameters": [
    { "name": "lpAddress", "type": "LPVOID", "direction": "in" },
    { "name": "dwSize", "type": "SIZE_T", "direction": "in" },
    { "name": "flAllocationType", "type": "DWORD", "direction": "in" },
    { "name": "flProtect", "type": "DWORD", "direction": "in" }
  ],
  "returnType": "LPVOID",
  "tags": [],
  "usedBy": [],
  "calls": ["NtAllocateVirtualMemory"],
  "structsUsed": [],
  "examples": [],
  "source": { "lastVerified": "2026-05-05" }
}
```

`packages/data/api/OpenProcess.json`:

```json
{
  "name": "OpenProcess",
  "dll": "kernel32",
  "category": "process",
  "description": "Opens an existing local process object by PID with the specified access rights.",
  "prototype": "HANDLE OpenProcess(DWORD dwDesiredAccess, BOOL bInheritHandle, DWORD dwProcessId);",
  "parameters": [
    { "name": "dwDesiredAccess", "type": "DWORD", "direction": "in" },
    { "name": "bInheritHandle", "type": "BOOL", "direction": "in" },
    { "name": "dwProcessId", "type": "DWORD", "direction": "in" }
  ],
  "returnType": "HANDLE",
  "tags": [],
  "usedBy": [],
  "calls": ["NtOpenProcess"],
  "structsUsed": [],
  "examples": [],
  "source": { "lastVerified": "2026-05-05" }
}
```

- [ ] **Step 5: Run the validator. Expect PASS with all 13 dataset entries plus 6 fixture self-tests.**

```bash
pnpm validate:data
```

Expected: `OK: 19 files validated.` (13 real + 6 fixture self-tests). Exit code 0.

- [ ] **Step 6: Run the Python tests. Expect they still pass.**

```bash
cd packages/ingest
source .venv/bin/activate
pytest -v
cd ../..
```

Expected: 7 tests pass. (No change since Task 6 — just confirming we didn't break it by adding real data files.)

- [ ] **Step 7: Commit**

```bash
git add packages/data/api/ packages/data/struct/ packages/data/version/
git commit -m "add hand-curated fixture dataset (8 APIs, 2 structs, 3 versions)"
```

---

## Task 8: GitHub Actions verify workflow

CI that runs the Node validator and the Python tests on every push and pull request.

**Files:**
- Create: `.github/workflows/verify.yml`

- [ ] **Step 1: Create `.github/workflows/verify.yml`**

```yaml
name: verify

on:
  push:
    branches: [main]
  pull_request:

jobs:
  data:
    name: validate dataset (Node)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm validate:data

  ingest:
    name: ingest tests (Python)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
      - working-directory: packages/ingest
        run: |
          python -m pip install --upgrade pip
          pip install -e .[dev]
          pytest -v
```

- [ ] **Step 2: Smoke-test it locally by running the same commands the workflow runs**

```bash
pnpm install --frozen-lockfile
pnpm validate:data

cd packages/ingest
python3.12 -m pip install --upgrade pip
python3.12 -m pip install -e .[dev]
pytest -v
cd ../..
```

Expected: both commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/verify.yml
git commit -m "add CI workflow: validate dataset, run ingest tests"
```

---

## Task 9: Per-package LICENSE files

Apply the licensing decided in the spec: MIT for code, CC BY-SA 4.0 for data.

**Files:**
- Create: `LICENSE` (root, pointer file)
- Create: `apps/web/LICENSE` (MIT)
- Create: `packages/ingest/LICENSE` (MIT)
- Create: `packages/data/LICENSE` (CC BY-SA 4.0)

- [ ] **Step 1: Create `apps/web/LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Okuden contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Create `packages/ingest/LICENSE`** — copy the same MIT text from Step 1.

- [ ] **Step 3: Create `packages/data/LICENSE` (CC BY-SA 4.0)**

```
The Okuden dataset (the contents of packages/data/, including all files under
api/, struct/, version/, schemas/, and __fixtures__/) is licensed under
Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).

Full legal text: https://creativecommons.org/licenses/by-sa/4.0/legalcode

Summary (not a substitute for the legal text):

  You are free to:
    Share — copy and redistribute the material in any medium or format
    Adapt — remix, transform, and build upon the material for any purpose,
            even commercially.

  Under the following terms:
    Attribution — You must give appropriate credit, provide a link to the
                  license, and indicate if changes were made.
    ShareAlike — If you remix, transform, or build upon the material, you
                 must distribute your contributions under the same license
                 as the original.
    No additional restrictions — You may not apply legal terms or
                                 technological measures that legally restrict
                                 others from doing anything the license permits.

Attribution should read: "Okuden — https://github.com/<owner>/okuden".
```

- [ ] **Step 4: Create root `LICENSE` (pointer file)**

```
Okuden is a multi-license repository. Each package carries its own LICENSE file:

  apps/web/LICENSE         MIT
  packages/ingest/LICENSE  MIT
  packages/data/LICENSE    CC BY-SA 4.0

When in doubt, the LICENSE file colocated with the source you're using applies.
```

- [ ] **Step 5: Commit**

```bash
git add LICENSE apps/web/LICENSE packages/ingest/LICENSE packages/data/LICENSE
git commit -m "add per-package licenses (MIT for code, CC BY-SA 4.0 for data)"
```

---

## Task 10: Root README

**Files:**
- Modify: `README.md` (currently contains only `# Okuden`)

- [ ] **Step 1: Replace `README.md` with a real overview**

```markdown
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

Prerequisites: Node 20+ (`.nvmrc` is honored), pnpm 9+, Python 3.12+.

```bash
pnpm install
pnpm validate:data

cd packages/ingest
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest
```

CI runs the same commands on every push and pull request (see `.github/workflows/verify.yml`).

## Contributing

For the V1 phase, contributions go through pull requests against `packages/data/`. See the design spec at `docs/superpowers/specs/2026-05-05-okuden-design.md` for scope and conventions. New entries must validate against the JSON Schemas — `pnpm validate:data` is the gate.

## License

This repository is multi-licensed. See `LICENSE` at the root for the breakdown, and the per-package `LICENSE` files for the legal text.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "expand README with project overview, layout, and dev instructions"
```

---

## Final verification

After all 10 tasks are committed, run a clean end-to-end check from the repo root:

```bash
# Node side
pnpm install --frozen-lockfile
pnpm validate:data

# Python side
cd packages/ingest
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest -v
cd ../..

# Tree shape
ls -la apps/web packages/data packages/data/schemas packages/data/api packages/data/struct packages/data/version packages/ingest packages/ingest/okuden_ingest packages/ingest/tests .github/workflows
```

All commands should exit 0. The repo is now ready for Plan 2 (web app) and Plan 3 (ingest pipeline) to start.

---

## Out of scope for this plan

Documented to prevent scope creep:

- Astro app, content collections, layouts, components → Plan 2
- Real PDB / phnt / ReactOS / Wine / j00ru parsing → Plan 3
- Generated TypeScript types from the JSON Schemas → Plan 2 if/when needed
- Cloudflare Pages deployment workflow → Plan 2 (lives next to the build)
- Nightly ingest workflow → Plan 3
