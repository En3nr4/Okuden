# Okuden Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Okuden static site (`apps/web`): Astro 5 + React islands + Tailwind v4 + Pagefind + Cytoscape, rendering the existing JSON dataset (`packages/data`) as a brutalist-themed catalog-driven reference.

**Architecture:** Astro generates static HTML for every API page, struct page, and index. React islands provide cmd-K search (Pagefind), Windows version selector (URL state), index-page filters, and the dependency graph (Cytoscape). Content collections load JSON from `@okuden/data` workspace package; Zod schemas mirror the canonical JSON Schemas.

**Tech Stack:** Astro 5, React 19, Tailwind CSS v4, Pagefind 1, Cytoscape.js + cose-bilkent layout, Shiki (built-in to Astro), Vitest for snapshot tests, Cloudflare Pages for hosting.

---

## File Structure

Files this plan creates or modifies (all paths relative to repo root `/home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/`):

```
apps/web/
├── package.json                                # Modified — Task 1
├── astro.config.mjs                            # Task 1
├── tsconfig.json                               # Task 1
├── public/
│   ├── favicon.svg                             # Task 1
│   └── robots.txt                              # Task 26
├── src/
│   ├── env.d.ts                                # Task 1
│   ├── content.config.ts                       # Task 4
│   ├── styles/
│   │   ├── tokens.css                          # Task 2
│   │   └── global.css                          # Task 3
│   ├── components/
│   │   ├── TopNav.astro                        # Task 5
│   │   ├── Tag.astro                           # Task 6
│   │   ├── CodeBlock.astro                     # Task 7
│   │   ├── Breadcrumbs.astro                   # Task 8
│   │   ├── ParametersTable.astro               # Task 9
│   │   ├── ApiPageHeader.astro                 # Task 10
│   │   ├── ApiTabs.astro                       # Task 12
│   │   ├── StructLayout.astro                  # Task 17
│   │   └── EmbeddedGraph.astro                 # Task 25
│   ├── islands/
│   │   ├── Search.tsx                          # Task 22
│   │   ├── VersionSelector.tsx                 # Task 23
│   │   ├── Filters.tsx                         # Task 24
│   │   └── DepGraph.tsx                        # Task 25
│   ├── layouts/
│   │   ├── BaseLayout.astro                    # Task 5
│   │   └── ApiLayout.astro                     # Task 12
│   ├── lib/
│   │   ├── data.ts                             # Task 4
│   │   ├── slug.ts                             # Task 11
│   │   └── version.ts                          # Task 23
│   └── pages/
│       ├── index.astro                         # Task 20 (replaces Task 1 placeholder)
│       ├── about.astro                         # Task 20
│       ├── 404.astro                           # Task 20
│       ├── graph.astro                         # Task 25
│       ├── [dll]/
│       │   ├── index.astro                     # Task 19
│       │   └── [category]/
│       │       └── index.astro                 # Task 19
│       ├── api/
│       │   └── [name]/
│       │       ├── index.astro                 # Task 11
│       │       ├── syscall.astro               # Task 12
│       │       ├── examples.astro              # Task 13
│       │       ├── used-by.astro               # Task 14
│       │       └── source.astro                # Task 15
│       └── struct/
│           └── [name]/
│               ├── index.astro                 # Task 16
│               ├── layout.astro                # Task 17
│               └── used-by.astro               # Task 18
└── tests/
    ├── snapshot.test.ts                        # Task 26
    └── fixtures/
        └── snapshot-pages.json                 # Task 26

.github/workflows/
└── deploy.yml                                  # Task 26

apps/web/.gitignore                             # Task 1
```

---

## Task 1: Bootstrap Astro app

**Files:**
- Modify: `apps/web/package.json` (replace the stub with the full Astro app config)
- Create: `apps/web/astro.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/env.d.ts`
- Create: `apps/web/src/pages/index.astro` (placeholder, replaced by Task 20)
- Create: `apps/web/.gitignore`
- Create: `apps/web/public/favicon.svg`
- Modify: root `package.json` (add `dev` and `build` scripts that proxy into `apps/web`)

**Notes:** No tests for this task — it is bootstrapping. Verification is "does `pnpm --filter @okuden/web build` succeed and produce a `dist/` directory with an `index.html`?".

- [ ] **Step 1: Replace `apps/web/package.json` with the full version**

```json
{
  "name": "@okuden/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Okuden static site.",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.4",
    "@astrojs/react": "^4.2.0",
    "@okuden/data": "workspace:*",
    "@tailwindcss/vite": "^4.0.0",
    "astro": "^5.0.0",
    "cytoscape": "^3.30.0",
    "cytoscape-cose-bilkent": "^4.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  },
  "devDependencies": {
    "@types/cytoscape": "^3.21.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "pagefind": "^1.3.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://okuden.dev",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
  },
  build: {
    format: "directory",
  },
  trailingSlash: "always",
});
```

- [ ] **Step 3: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 4: Create `apps/web/src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
```

- [ ] **Step 5: Create `apps/web/.gitignore`**

```
.astro/
dist/
node_modules/
```

- [ ] **Step 6: Create `apps/web/public/favicon.svg`** — a tiny inline brutalist mark in the project's accent color.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0a0a0a"/>
  <rect x="4" y="4" width="24" height="4" fill="#ff3d2e"/>
  <text x="16" y="24" text-anchor="middle" font-family="monospace" font-size="14" font-weight="700" fill="#f5f3ee">奥</text>
</svg>
```

- [ ] **Step 7: Create `apps/web/src/pages/index.astro` (placeholder, replaced by Task 20)**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Okuden</title>
  </head>
  <body>
    <h1>Okuden — bootstrapping</h1>
    <p>This page is replaced in Task 20.</p>
  </body>
</html>
```

- [ ] **Step 8: Update root `package.json` to add web-app scripts**

Use the Edit tool. Find the `"scripts"` block:

```json
  "scripts": {
    "validate:data": "node packages/data/scripts/validate.mjs"
  },
```

Replace with:

```json
  "scripts": {
    "validate:data": "node packages/data/scripts/validate.mjs",
    "web:dev": "pnpm --filter @okuden/web dev",
    "web:build": "pnpm --filter @okuden/web build",
    "web:preview": "pnpm --filter @okuden/web preview",
    "web:test": "pnpm --filter @okuden/web test"
  },
```

- [ ] **Step 9: Install dependencies**

Run from repo root:

```bash
pnpm install
```

Expected: pnpm fetches Astro 5, React 19, Tailwind v4, Pagefind 1, Cytoscape, Vitest. `pnpm-lock.yaml` is updated.

- [ ] **Step 10: Verify the build works**

```bash
pnpm web:build
```

Expected: Astro builds the placeholder page; Pagefind runs on `dist/` and produces a `dist/pagefind/` directory (probably empty since there's no real content yet — Pagefind may emit a warning, that's OK). The build exits 0. A `dist/index.html` file exists.

If the build fails, do NOT proceed. Report BLOCKED.

- [ ] **Step 11: Commit**

```bash
git add apps/web/package.json apps/web/astro.config.mjs apps/web/tsconfig.json \
        apps/web/src/env.d.ts apps/web/.gitignore apps/web/public/favicon.svg \
        apps/web/src/pages/index.astro \
        package.json pnpm-lock.yaml
git commit -m "bootstrap Astro web app (Astro 5 + React + Tailwind v4 + Pagefind)"
```

---

## Task 2: Design tokens

**Files:**
- Create: `apps/web/src/styles/tokens.css`

This file is the single source of truth for the brutalist palette, typography, and spacing. Other CSS imports it.

- [ ] **Step 1: Create `apps/web/src/styles/tokens.css`**

```css
/* Okuden design tokens — Brutalist Engineering palette.
   The site is light-first; a future dark variant swaps these custom properties. */

:root {
  /* Surfaces */
  --bg: #f5f3ee;          /* page background, cream */
  --bg-alt: #ebe8e0;      /* panels, asides */
  --paper: #ffffff;       /* high-contrast surfaces */
  --ink: #0a0a0a;         /* primary text, top nav, code blocks */
  --ink-soft: #1a1a1a;    /* body text variant */

  /* Accent */
  --accent: #ff3d2e;      /* single accent — borders, hover, undoc */

  /* Muted */
  --mute: #7a7468;            /* secondary text on light bg */
  --mute-soft: #b8b3a8;       /* tertiary text on dark bg */
  --border: #d8d4cc;          /* hairlines */

  /* Typography */
  --font-display: "Space Grotesk", "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;

  /* Type scale */
  --fs-xs: 0.75rem;
  --fs-sm: 0.875rem;
  --fs-base: 1rem;
  --fs-md: 1.125rem;
  --fs-lg: 1.375rem;
  --fs-xl: 1.75rem;
  --fs-2xl: 2.25rem;

  /* Spacing scale */
  --sp-1: 0.25rem;
  --sp-2: 0.5rem;
  --sp-3: 0.75rem;
  --sp-4: 1rem;
  --sp-5: 1.5rem;
  --sp-6: 2rem;
  --sp-8: 3rem;
  --sp-10: 4rem;

  /* Layout */
  --content-max: 720px;
  --nav-height: 56px;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/styles/tokens.css
git commit -m "add brutalist design tokens (CSS custom properties)"
```

---

## Task 3: Tailwind v4 + global CSS + fonts

**Files:**
- Create: `apps/web/src/styles/global.css`

This file imports tokens, registers Tailwind v4, loads web fonts, and sets brutalist base styles.

- [ ] **Step 1: Create `apps/web/src/styles/global.css`**

```css
@import "./tokens.css";
@import "tailwindcss";

@layer base {
  /* Self-hosted fonts via Google Fonts CDN — pulled at build time.
     Switch to self-hosted woff2 in V2 if SLA matters. */
  @font-face {
    font-family: "Inter";
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.woff2") format("woff2");
  }
  @font-face {
    font-family: "Space Grotesk";
    font-style: normal;
    font-weight: 500 700;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUUM.woff2") format("woff2");
  }
  @font-face {
    font-family: "JetBrains Mono";
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/jetbrainsmono/v20/tDbY2o-flEEny0FZhsfKu5WU4xD7OwA0gN5wuZkYCCCJSg.woff2") format("woff2");
  }

  html {
    color: var(--ink);
    background: var(--bg);
    font-family: var(--font-body);
    font-size: var(--fs-base);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.15;
    margin: 0;
  }

  h1 { font-size: var(--fs-2xl); letter-spacing: -0.02em; }
  h2 { font-size: var(--fs-xl); }
  h3 { font-size: var(--fs-lg); }
  h4 { font-size: var(--fs-md); }

  code, pre, kbd, samp {
    font-family: var(--font-mono);
    font-size: 0.92em;
  }

  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-underline-offset: 3px;
  }
  a:hover { color: var(--accent); }

  ::selection { background: var(--accent); color: var(--paper); }
}
```

- [ ] **Step 2: Verify the build still works**

```bash
pnpm web:build
```

Expected: no errors. Tailwind v4 picks up the `@import "tailwindcss"` directive via the `@tailwindcss/vite` plugin.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/styles/global.css
git commit -m "add global stylesheet (Tailwind v4, fonts, base typography)"
```

---

## Task 4: Content collections (Zod schemas mirror JSON Schemas)

**Files:**
- Create: `apps/web/src/content.config.ts`
- Create: `apps/web/src/lib/data.ts`

The content collections expose typed access to all JSON entries via Astro's `getCollection()`. The Zod schemas hand-port the canonical JSON Schemas at `packages/data/schemas/`. Drift would be caught by both the build (Zod) and CI (`pnpm validate:data` + ajv).

- [ ] **Step 1: Create `apps/web/src/content.config.ts`**

```ts
// Hand-ported from packages/data/schemas/{api,struct,version}.schema.json.
// Keep these in sync with the canonical JSON Schemas. CI validates the JSON
// against ajv (Node) and jsonschema (Python); the build validates against the
// Zod schemas below. Any drift between the three surfaces is a bug.

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const sourceSchema = z.object({
  pdb: z
    .object({ module: z.string(), version: z.string() })
    .strict()
    .optional(),
  phntPath: z.string().optional(),
  reactosPath: z.string().optional(),
  winePath: z.string().optional(),
  j00ruRevision: z.string().optional(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const apiSchema = z
  .object({
    name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    dll: z.enum([
      "ntdll",
      "kernel32",
      "kernelbase",
      "advapi32",
      "user32",
      "ws2_32",
    ]),
    category: z.string().regex(/^[a-z][a-z0-9-]*$/),
    description: z.string().min(1),
    prototype: z.string().min(1),
    parameters: z.array(
      z
        .object({
          name: z.string().min(1),
          type: z.string().min(1),
          direction: z.enum(["in", "out", "inout"]),
          description: z.string().optional(),
        })
        .strict(),
    ),
    returnType: z.string().min(1),
    tags: z.array(
      z.enum(["syscall", "undocumented", "deprecated", "partial"]),
    ),
    syscall: z
      .object({
        ssn: z.record(z.string(), z.number().int().nonnegative()),
        hash: z
          .record(z.string(), z.string().regex(/^0x[0-9a-fA-F]+$/))
          .optional(),
      })
      .strict()
      .optional(),
    usedBy: z.array(z.string()),
    calls: z.array(z.string()),
    structsUsed: z.array(z.string()),
    examples: z.array(
      z
        .object({
          language: z.enum(["c", "asm"]),
          title: z.string().min(1),
          code: z.string().min(1),
          description: z.string().optional(),
        })
        .strict(),
    ),
    source: sourceSchema,
  })
  .strict();

const structFieldSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().min(1),
    offsets: z.record(z.string(), z.number().int().nonnegative()),
    size: z.record(z.string(), z.number().int().nonnegative()),
    description: z.string().optional(),
  })
  .strict();

const structSchema = z
  .object({
    name: z.string().regex(/^_?[A-Za-z][A-Za-z0-9_]*$/),
    description: z.string().min(1),
    fields: z.array(structFieldSchema),
    usedBy: z.array(z.string()),
    source: sourceSchema,
  })
  .strict();

const versionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]+$/),
    displayName: z.string().min(1),
    buildNumber: z.string().regex(/^\d+(\.\d+)?$/),
    releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isCurrent: z.boolean(),
  })
  .strict();

export const collections = {
  api: defineCollection({
    loader: glob({
      pattern: "*.json",
      base: "../../packages/data/api",
    }),
    schema: apiSchema,
  }),
  struct: defineCollection({
    loader: glob({
      pattern: "*.json",
      base: "../../packages/data/struct",
    }),
    schema: structSchema,
  }),
  version: defineCollection({
    loader: glob({
      pattern: "*.json",
      base: "../../packages/data/version",
    }),
    schema: versionSchema,
  }),
};

export type ApiEntry = z.infer<typeof apiSchema>;
export type StructEntry = z.infer<typeof structSchema>;
export type VersionEntry = z.infer<typeof versionSchema>;
```

- [ ] **Step 2: Create `apps/web/src/lib/data.ts`**

```ts
// Helpers around `getCollection` for stable ordering and lookup.

import { getCollection } from "astro:content";
import type { ApiEntry, StructEntry, VersionEntry } from "../content.config";

export async function getAllApis(): Promise<ApiEntry[]> {
  const entries = await getCollection("api");
  return entries.map((e) => e.data).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllStructs(): Promise<StructEntry[]> {
  const entries = await getCollection("struct");
  return entries.map((e) => e.data).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllVersions(): Promise<VersionEntry[]> {
  const entries = await getCollection("version");
  return entries
    .map((e) => e.data)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}

export async function getCurrentVersion(): Promise<VersionEntry> {
  const versions = await getAllVersions();
  const current = versions.find((v) => v.isCurrent);
  if (!current) {
    throw new Error("No version has isCurrent=true. Dataset invariant broken.");
  }
  return current;
}

export async function getApiByName(name: string): Promise<ApiEntry | undefined> {
  const apis = await getAllApis();
  return apis.find((a) => a.name === name);
}

export async function getStructByName(name: string): Promise<StructEntry | undefined> {
  const structs = await getAllStructs();
  return structs.find((s) => s.name === name);
}
```

- [ ] **Step 3: Verify the build still works**

```bash
pnpm web:build
```

Expected: Astro discovers content collections, validates all 13 dataset entries against the Zod schemas. If any entry fails Zod, the build fails — that means the schemas drifted, fix `content.config.ts` to match `packages/data/schemas/`. Build should succeed.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/content.config.ts apps/web/src/lib/data.ts
git commit -m "wire Astro content collections to @okuden/data with Zod schemas"
```

---

## Task 5: Base layout + TopNav

**Files:**
- Create: `apps/web/src/layouts/BaseLayout.astro`
- Create: `apps/web/src/components/TopNav.astro`

The BaseLayout wraps every page with `<head>`, fonts, the global CSS, and the TopNav. TopNav is the brutalist nav bar (ink background, accent-red bottom border, OKUDEN wordmark, top-level category links, search trigger placeholder, version selector placeholder).

- [ ] **Step 1: Create `apps/web/src/components/TopNav.astro`**

```astro
---
interface Props {
  currentVersion?: string;
}
const { currentVersion = "Win11 24H2" } = Astro.props;
---

<nav class="topnav">
  <a class="brand" href="/">OKUDEN</a>
  <ul class="links">
    <li><a href="/ntdll/">NTDLL</a></li>
    <li><a href="/kernel32/">KERNEL32</a></li>
    <li><a href="/kernelbase/">KERNELBASE</a></li>
    <li><a href="/advapi32/">ADVAPI32</a></li>
    <li><a href="/struct/">STRUCTS</a></li>
    <li><a href="/graph/">GRAPH</a></li>
  </ul>
  <button class="search-trigger" type="button" aria-label="Open search (press / or cmd+k)">
    <span class="kbd">⌘K</span>
    <span class="search-text">Search</span>
  </button>
  <span class="version-pill">{currentVersion}</span>
</nav>

<style>
  .topnav {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    height: var(--nav-height);
    padding: 0 var(--sp-5);
    background: var(--ink);
    color: var(--bg);
    border-bottom: 4px solid var(--accent);
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.02em;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .brand {
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-md);
    letter-spacing: 0.04em;
  }
  .brand:hover { color: var(--paper); }
  .links {
    display: flex;
    gap: var(--sp-3);
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .links a {
    color: var(--mute-soft);
    text-decoration: none;
    padding: var(--sp-2) var(--sp-2);
    border-bottom: 2px solid transparent;
  }
  .links a:hover { color: var(--paper); border-bottom-color: var(--accent); }

  .search-trigger {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    background: transparent;
    border: 1px solid var(--mute);
    color: var(--mute-soft);
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    padding: var(--sp-1) var(--sp-3);
    cursor: pointer;
  }
  .search-trigger:hover { border-color: var(--accent); color: var(--paper); }
  .kbd {
    background: var(--ink-soft);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .version-pill {
    background: var(--accent);
    color: var(--paper);
    padding: var(--sp-1) var(--sp-3);
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
```

- [ ] **Step 2: Create `apps/web/src/layouts/BaseLayout.astro`**

```astro
---
import "../styles/global.css";
import TopNav from "../components/TopNav.astro";

interface Props {
  title: string;
  description?: string;
  currentVersion?: string;
}
const { title, description, currentVersion } = Astro.props;
const fullTitle = title === "Okuden" ? "Okuden" : `${title} · Okuden`;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{fullTitle}</title>
    {description && <meta name="description" content={description} />}
    <meta property="og:title" content={fullTitle} />
    {description && <meta property="og:description" content={description} />}
  </head>
  <body>
    <TopNav currentVersion={currentVersion} />
    <main>
      <slot />
    </main>

    <style is:global>
      main {
        max-width: var(--content-max);
        margin: 0 auto;
        padding: var(--sp-6) var(--sp-5);
      }
    </style>
  </body>
</html>
```

- [ ] **Step 3: Update the placeholder index page to use BaseLayout**

Replace `apps/web/src/pages/index.astro` with:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Okuden" description="Public web reference for Windows internal APIs.">
  <h1>Okuden — bootstrapping</h1>
  <p>This page is replaced in Task 20.</p>
</BaseLayout>
```

- [ ] **Step 4: Verify the build**

```bash
pnpm web:build
```

Expected: build succeeds. The `dist/index.html` shows the TopNav with the OKUDEN brand mark.

Optional: run the dev server briefly to eyeball the design (`pnpm web:dev` then visit `http://localhost:4321/`). Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layouts/BaseLayout.astro \
        apps/web/src/components/TopNav.astro \
        apps/web/src/pages/index.astro
git commit -m "add BaseLayout and brutalist TopNav"
```

---

## Task 6: Tag component

**Files:**
- Create: `apps/web/src/components/Tag.astro`

A tiny rectangular all-caps tag. The `variant="accent"` form uses the accent red (for `undocumented`).

- [ ] **Step 1: Create `apps/web/src/components/Tag.astro`**

```astro
---
interface Props {
  variant?: "default" | "accent" | "outline";
  href?: string;
}
const { variant = "default", href } = Astro.props;
const className = `tag tag--${variant}`;
---

{href ? (
  <a class={className} href={href}><slot /></a>
) : (
  <span class={className}><slot /></span>
)}

<style>
  .tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 3px 8px;
    text-decoration: none;
    border-right: 1px solid var(--bg);
  }
  .tag:last-child { border-right: none; }
  .tag--default { background: var(--ink); color: var(--bg); }
  .tag--accent { background: var(--accent); color: var(--paper); }
  .tag--outline {
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--ink);
  }
  a.tag:hover { filter: brightness(1.15); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/Tag.astro
git commit -m "add Tag component (brutalist all-caps)"
```

---

## Task 7: CodeBlock component (Shiki)

**Files:**
- Create: `apps/web/src/components/CodeBlock.astro`

Astro 5 ships with Shiki and renders fenced code blocks via Markdown. For inline use in Astro components (passing a string of code as a prop), we use the `Code` component from `astro:components` exposed as `astro/components/Code`. We wrap it in a brutalist container (ink background, cream foreground, JetBrains Mono).

- [ ] **Step 1: Create `apps/web/src/components/CodeBlock.astro`**

```astro
---
import { Code } from "astro:components";

interface Props {
  code: string;
  lang?: "c" | "asm" | "bash" | "json" | "ts" | "javascript" | "plaintext";
  title?: string;
}
const { code, lang = "plaintext", title } = Astro.props;
---

<div class="codeblock">
  {title && <div class="codeblock__title">{title}</div>}
  <div class="codeblock__body">
    <Code code={code} lang={lang} theme="github-dark" wrap={true} />
  </div>
</div>

<style>
  .codeblock {
    margin: var(--sp-4) 0;
    border: 1px solid var(--ink);
    background: var(--ink);
    overflow: hidden;
  }
  .codeblock__title {
    background: var(--ink-soft);
    color: var(--mute-soft);
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: var(--sp-2) var(--sp-3);
    border-bottom: 1px solid var(--ink);
  }
  .codeblock__body {
    padding: var(--sp-3);
    font-size: var(--fs-sm);
    line-height: 1.55;
    overflow-x: auto;
  }
  .codeblock :global(pre) {
    margin: 0;
    background: transparent !important;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/CodeBlock.astro
git commit -m "add CodeBlock component (Shiki via astro:components)"
```

---

## Task 8: Breadcrumbs component

**Files:**
- Create: `apps/web/src/components/Breadcrumbs.astro`

Brutalist crumb trail: monospace, separators are `·`, last crumb is non-link.

- [ ] **Step 1: Create `apps/web/src/components/Breadcrumbs.astro`**

```astro
---
interface Crumb {
  label: string;
  href?: string;
}
interface Props {
  crumbs: Crumb[];
}
const { crumbs } = Astro.props;
---

<nav class="crumbs" aria-label="Breadcrumbs">
  {crumbs.map((c, i) => (
    <>
      {c.href ? <a href={c.href}>{c.label}</a> : <span class="crumbs__current">{c.label}</span>}
      {i < crumbs.length - 1 && <span class="crumbs__sep" aria-hidden="true">·</span>}
    </>
  ))}
</nav>

<style>
  .crumbs {
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    color: var(--mute);
    text-transform: lowercase;
    margin-bottom: var(--sp-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: baseline;
  }
  .crumbs a { color: var(--mute); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .crumbs__current { color: var(--ink); font-weight: 600; }
  .crumbs__sep { color: var(--border); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/Breadcrumbs.astro
git commit -m "add Breadcrumbs component"
```

---

## Task 9: ParametersTable component

**Files:**
- Create: `apps/web/src/components/ParametersTable.astro`

Renders the `parameters` array of an API entry. Brutalist table: ink header, hairline row separators, monospace types.

- [ ] **Step 1: Create `apps/web/src/components/ParametersTable.astro`**

```astro
---
interface Param {
  name: string;
  type: string;
  direction: "in" | "out" | "inout";
  description?: string;
}
interface Props {
  parameters: Param[];
}
const { parameters } = Astro.props;
---

{parameters.length === 0 ? (
  <p class="empty">This API takes no parameters.</p>
) : (
  <table class="params">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Dir</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {parameters.map((p) => (
        <tr>
          <td class="params__name">{p.name}</td>
          <td class="params__type">{p.type}</td>
          <td class="params__dir">{p.direction.toUpperCase()}</td>
          <td class="params__desc">{p.description ?? "—"}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

<style>
  .params {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-sm);
    margin: var(--sp-3) 0;
  }
  .params th {
    background: var(--ink);
    color: var(--bg);
    text-align: left;
    padding: var(--sp-2) var(--sp-3);
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 700;
  }
  .params td {
    padding: var(--sp-2) var(--sp-3);
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  .params__name { font-family: var(--font-mono); font-weight: 600; }
  .params__type { font-family: var(--font-mono); color: var(--mute); }
  .params__dir {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.12em;
  }
  .params__desc { color: var(--ink-soft); }
  .empty { color: var(--mute); font-style: italic; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ParametersTable.astro
git commit -m "add ParametersTable component"
```

---

## Task 10: ApiPageHeader component

**Files:**
- Create: `apps/web/src/components/ApiPageHeader.astro`

Header for every API detail page: name (Space Grotesk display), DLL chip, tags row.

- [ ] **Step 1: Create `apps/web/src/components/ApiPageHeader.astro`**

```astro
---
import Tag from "./Tag.astro";

interface Props {
  name: string;
  dll: string;
  tags: string[];
}
const { name, dll, tags } = Astro.props;
const undocBadge = tags.find((t) => t === "undocumented" || t === "partial");
const dllUpper = dll.toUpperCase();
---

<header class="api-header">
  <h1 class="api-header__name">{name}</h1>
  <div class="api-header__tags">
    <Tag variant="default">{dllUpper}</Tag>
    {tags.map((t) => (
      <Tag variant={t === "undocumented" || t === "partial" ? "accent" : "default"}>
        {t}
      </Tag>
    ))}
  </div>
</header>

<style>
  .api-header {
    margin-bottom: var(--sp-5);
  }
  .api-header__name {
    font-family: var(--font-display);
    font-size: var(--fs-2xl);
    margin-bottom: var(--sp-2);
  }
  .api-header__tags {
    display: inline-flex;
    gap: 0;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ApiPageHeader.astro
git commit -m "add ApiPageHeader component"
```

---

## Task 11: API Overview page (`/api/[name]`)

**Files:**
- Create: `apps/web/src/lib/slug.ts`
- Create: `apps/web/src/pages/api/[name]/index.astro`

This page is the first surface a user lands on for an API. Renders header + breadcrumbs + description + prototype + parameters.

- [ ] **Step 1: Create `apps/web/src/lib/slug.ts`**

```ts
// API and struct names ARE the URL slugs. Validation happens at the schema
// layer (regex enforces URL-safe characters).
export function apiPath(name: string): string {
  return `/api/${name}/`;
}
export function structPath(name: string): string {
  return `/struct/${name}/`;
}
export function dllPath(dll: string): string {
  return `/${dll}/`;
}
export function categoryPath(dll: string, category: string): string {
  return `/${dll}/${category}/`;
}
```

- [ ] **Step 2: Create `apps/web/src/pages/api/[name]/index.astro`**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../../components/Breadcrumbs.astro";
import ApiPageHeader from "../../../components/ApiPageHeader.astro";
import CodeBlock from "../../../components/CodeBlock.astro";
import ParametersTable from "../../../components/ParametersTable.astro";
import { getAllApis } from "../../../lib/data";
import { dllPath, categoryPath } from "../../../lib/slug";

export async function getStaticPaths() {
  const apis = await getAllApis();
  return apis.map((api) => ({
    params: { name: api.name },
    props: { api },
  }));
}

const { api } = Astro.props;
---

<BaseLayout title={api.name} description={api.description}>
  <Breadcrumbs
    crumbs={[
      { label: api.dll, href: dllPath(api.dll) },
      { label: api.category, href: categoryPath(api.dll, api.category) },
      { label: api.name },
    ]}
  />
  <ApiPageHeader name={api.name} dll={api.dll} tags={api.tags} />

  <p class="lead">{api.description}</p>

  <h2>Prototype</h2>
  <CodeBlock code={api.prototype} lang="c" />

  <h2>Parameters</h2>
  <ParametersTable parameters={api.parameters} />

  <h2>Returns</h2>
  <p><code>{api.returnType}</code></p>
</BaseLayout>

<style>
  .lead {
    font-size: var(--fs-md);
    color: var(--ink-soft);
    margin: var(--sp-4) 0 var(--sp-5);
  }
  h2 {
    margin-top: var(--sp-6);
    margin-bottom: var(--sp-2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: var(--fs-sm);
    border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2);
  }
</style>
```

- [ ] **Step 3: Verify the build**

```bash
pnpm web:build
```

Expected: 8 API pages generated under `dist/api/{NtCreateFile,...}/index.html`. Build exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/slug.ts \
        apps/web/src/pages/api/[name]/index.astro
git commit -m "add API Overview page (/api/[name])"
```

---

## Task 12: ApiTabs + Syscall tab (`/api/[name]/syscall`)

**Files:**
- Create: `apps/web/src/components/ApiTabs.astro`
- Create: `apps/web/src/layouts/ApiLayout.astro`
- Create: `apps/web/src/pages/api/[name]/syscall.astro`
- Modify: `apps/web/src/pages/api/[name]/index.astro` (use ApiLayout)

The tab strip is a separate component because it must render the same set on every API tab page. The `ApiLayout` wraps an API page with header + tabs + slot for tab body. The Syscall tab page renders ONLY for syscall APIs.

- [ ] **Step 1: Create `apps/web/src/components/ApiTabs.astro`**

```astro
---
interface Tab {
  label: string;
  href: string;
  active: boolean;
  visible: boolean;
}
interface Props {
  apiName: string;
  hasSyscall: boolean;
  active: "overview" | "syscall" | "examples" | "used-by" | "source";
}
const { apiName, hasSyscall, active } = Astro.props;
const base = `/api/${apiName}`;

const tabs: Tab[] = [
  { label: "Overview", href: `${base}/`, active: active === "overview", visible: true },
  { label: "Syscall", href: `${base}/syscall/`, active: active === "syscall", visible: hasSyscall },
  { label: "Examples", href: `${base}/examples/`, active: active === "examples", visible: true },
  { label: "Used by", href: `${base}/used-by/`, active: active === "used-by", visible: true },
  { label: "Source", href: `${base}/source/`, active: active === "source", visible: true },
];
---

<nav class="tabs" aria-label="API sections">
  {tabs.filter((t) => t.visible).map((t) => (
    <a class:list={["tabs__tab", { "tabs__tab--active": t.active }]} href={t.href}>
      {t.label}
    </a>
  ))}
</nav>

<style>
  .tabs {
    display: flex;
    gap: 0;
    background: var(--ink);
    margin: 0 calc(var(--sp-5) * -1) var(--sp-5);
    padding: 0 var(--sp-5);
    border-top: 1px solid var(--border);
    overflow-x: auto;
  }
  .tabs__tab {
    color: var(--mute-soft);
    text-decoration: none;
    padding: var(--sp-3) var(--sp-4);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
  }
  .tabs__tab:hover { color: var(--paper); }
  .tabs__tab--active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
</style>
```

- [ ] **Step 2: Create `apps/web/src/layouts/ApiLayout.astro`**

```astro
---
import BaseLayout from "./BaseLayout.astro";
import Breadcrumbs from "../components/Breadcrumbs.astro";
import ApiPageHeader from "../components/ApiPageHeader.astro";
import ApiTabs from "../components/ApiTabs.astro";
import { dllPath, categoryPath } from "../lib/slug";
import type { ApiEntry } from "../content.config";

interface Props {
  api: ApiEntry;
  active: "overview" | "syscall" | "examples" | "used-by" | "source";
}
const { api, active } = Astro.props;
const hasSyscall = api.tags.includes("syscall");
---

<BaseLayout title={api.name} description={api.description}>
  <Breadcrumbs
    crumbs={[
      { label: api.dll, href: dllPath(api.dll) },
      { label: api.category, href: categoryPath(api.dll, api.category) },
      { label: api.name, href: active === "overview" ? undefined : `/api/${api.name}/` },
      ...(active === "overview" ? [] : [{ label: active }]),
    ]}
  />
  <ApiPageHeader name={api.name} dll={api.dll} tags={api.tags} />
  <ApiTabs apiName={api.name} hasSyscall={hasSyscall} active={active} />
  <slot />
</BaseLayout>
```

- [ ] **Step 3: Update `apps/web/src/pages/api/[name]/index.astro` to use ApiLayout**

Replace the entire file with:

```astro
---
import ApiLayout from "../../../layouts/ApiLayout.astro";
import CodeBlock from "../../../components/CodeBlock.astro";
import ParametersTable from "../../../components/ParametersTable.astro";
import { getAllApis } from "../../../lib/data";

export async function getStaticPaths() {
  const apis = await getAllApis();
  return apis.map((api) => ({
    params: { name: api.name },
    props: { api },
  }));
}

const { api } = Astro.props;
---

<ApiLayout api={api} active="overview">
  <p class="lead">{api.description}</p>

  <h2>Prototype</h2>
  <CodeBlock code={api.prototype} lang="c" />

  <h2>Parameters</h2>
  <ParametersTable parameters={api.parameters} />

  <h2>Returns</h2>
  <p><code>{api.returnType}</code></p>
</ApiLayout>

<style>
  .lead { font-size: var(--fs-md); color: var(--ink-soft); margin: var(--sp-3) 0 var(--sp-5); }
  h2 {
    margin-top: var(--sp-6); margin-bottom: var(--sp-2);
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2);
  }
</style>
```

- [ ] **Step 4: Create `apps/web/src/pages/api/[name]/syscall.astro`**

```astro
---
import ApiLayout from "../../../layouts/ApiLayout.astro";
import CodeBlock from "../../../components/CodeBlock.astro";
import { getAllApis, getAllVersions } from "../../../lib/data";

export async function getStaticPaths() {
  const apis = await getAllApis();
  return apis
    .filter((api) => api.tags.includes("syscall") && api.syscall)
    .map((api) => ({
      params: { name: api.name },
      props: { api },
    }));
}

const { api } = Astro.props;
const versions = await getAllVersions();
const ssn = api.syscall!.ssn;
const hash = api.syscall!.hash;
---

<ApiLayout api={api} active="syscall">
  <h2>Syscall Numbers</h2>
  <table class="ssn">
    <thead>
      <tr><th>Version</th><th>Build</th><th>SSN (decimal)</th><th>SSN (hex)</th></tr>
    </thead>
    <tbody>
      {versions.map((v) => {
        const n = ssn[v.id];
        return (
          <tr>
            <td>{v.displayName}</td>
            <td class="mono">{v.buildNumber}</td>
            <td class="mono">{n ?? "—"}</td>
            <td class="mono">{n !== undefined ? `0x${n.toString(16)}` : "—"}</td>
          </tr>
        );
      })}
    </tbody>
  </table>

  {hash && (
    <>
      <h2>Hashes</h2>
      <table class="ssn">
        <thead><tr><th>Algorithm</th><th>Value</th></tr></thead>
        <tbody>
          {Object.entries(hash).map(([algo, value]) => (
            <tr><td class="mono">{algo}</td><td class="mono">{value}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  )}
</ApiLayout>

<style>
  h2 {
    margin-top: var(--sp-5); margin-bottom: var(--sp-2);
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2);
  }
  .ssn { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); margin: var(--sp-3) 0; }
  .ssn th {
    background: var(--ink); color: var(--bg);
    text-align: left; padding: var(--sp-2) var(--sp-3);
    font-family: var(--font-mono); font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.12em;
  }
  .ssn td { padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border); }
  .mono { font-family: var(--font-mono); }
</style>
```

- [ ] **Step 5: Verify the build**

```bash
pnpm web:build
```

Expected: 8 Overview pages + 5 Syscall pages (one per ntdll syscall API: NtCreateFile, NtOpenProcess, NtAllocateVirtualMemory, NtReadFile, NtWriteFile). The 3 kernel32 wrappers do NOT have a Syscall tab.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ApiTabs.astro \
        apps/web/src/layouts/ApiLayout.astro \
        apps/web/src/pages/api/[name]/index.astro \
        apps/web/src/pages/api/[name]/syscall.astro
git commit -m "add ApiTabs + Syscall tab (URL-routed, syscall APIs only)"
```

---

## Task 13: Examples tab (`/api/[name]/examples`)

**Files:**
- Create: `apps/web/src/pages/api/[name]/examples.astro`

- [ ] **Step 1: Create `apps/web/src/pages/api/[name]/examples.astro`**

```astro
---
import ApiLayout from "../../../layouts/ApiLayout.astro";
import CodeBlock from "../../../components/CodeBlock.astro";
import { getAllApis } from "../../../lib/data";

export async function getStaticPaths() {
  const apis = await getAllApis();
  return apis.map((api) => ({
    params: { name: api.name },
    props: { api },
  }));
}

const { api } = Astro.props;
---

<ApiLayout api={api} active="examples">
  {api.examples.length === 0 ? (
    <p class="empty">No examples have been recorded for this API yet.</p>
  ) : (
    api.examples.map((ex) => (
      <section class="example">
        <h2>{ex.title}</h2>
        {ex.description && <p>{ex.description}</p>}
        <CodeBlock code={ex.code} lang={ex.language} />
      </section>
    ))
  )}
</ApiLayout>

<style>
  .empty { color: var(--mute); font-style: italic; margin-top: var(--sp-4); }
  .example { margin: var(--sp-5) 0; }
  .example h2 {
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/api/[name]/examples.astro
git commit -m "add Examples tab (/api/[name]/examples)"
```

---

## Task 14: Used-by tab (`/api/[name]/used-by`)

**Files:**
- Create: `apps/web/src/pages/api/[name]/used-by.astro`

Text-based for now: lists `usedBy`, `calls`, `structsUsed` as link lists. The mini-graph is added in Task 25.

- [ ] **Step 1: Create `apps/web/src/pages/api/[name]/used-by.astro`**

```astro
---
import ApiLayout from "../../../layouts/ApiLayout.astro";
import { getAllApis, getAllStructs } from "../../../lib/data";
import { apiPath, structPath } from "../../../lib/slug";

export async function getStaticPaths() {
  const apis = await getAllApis();
  return apis.map((api) => ({
    params: { name: api.name },
    props: { api },
  }));
}

const { api } = Astro.props;
const allApis = new Set((await getAllApis()).map((a) => a.name));
const allStructs = new Set((await getAllStructs()).map((s) => s.name));

function apiLink(name: string) {
  return allApis.has(name) ? apiPath(name) : null;
}
function structLink(name: string) {
  return allStructs.has(name) ? structPath(name) : null;
}
---

<ApiLayout api={api} active="used-by">
  <section class="rels">
    <h2>Used by</h2>
    {api.usedBy.length === 0 ? (
      <p class="empty">No callers recorded.</p>
    ) : (
      <ul>
        {api.usedBy.map((name) => {
          const href = apiLink(name);
          return (
            <li>
              {href ? <a href={href}>{name}</a> : <span class="dim">{name}</span>}
            </li>
          );
        })}
      </ul>
    )}
  </section>

  <section class="rels">
    <h2>Calls</h2>
    {api.calls.length === 0 ? (
      <p class="empty">No callees recorded.</p>
    ) : (
      <ul>
        {api.calls.map((name) => {
          const href = apiLink(name);
          return (
            <li>
              {href ? <a href={href}>{name}</a> : <span class="dim">{name}</span>}
            </li>
          );
        })}
      </ul>
    )}
  </section>

  <section class="rels">
    <h2>Structs used</h2>
    {api.structsUsed.length === 0 ? (
      <p class="empty">No structs referenced.</p>
    ) : (
      <ul>
        {api.structsUsed.map((name) => {
          const href = structLink(name);
          return (
            <li>
              {href ? <a href={href}>{name}</a> : <span class="dim">{name}</span>}
            </li>
          );
        })}
      </ul>
    )}
  </section>
</ApiLayout>

<style>
  .rels { margin: var(--sp-4) 0; }
  .rels h2 {
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2);
  }
  .rels ul {
    list-style: none; padding: 0; margin: var(--sp-3) 0;
    font-family: var(--font-mono); font-size: var(--fs-sm);
    display: flex; flex-direction: column; gap: var(--sp-1);
  }
  .empty { color: var(--mute); font-style: italic; }
  .dim { color: var(--mute); }
  .dim::after { content: " (not in dataset yet)"; font-size: var(--fs-xs); color: var(--border); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/api/[name]/used-by.astro
git commit -m "add Used-by tab (text-based; graph added later)"
```

---

## Task 15: Source tab (`/api/[name]/source`)

**Files:**
- Create: `apps/web/src/pages/api/[name]/source.astro`

Renders provenance: which PDB, which phnt header, which ReactOS file, which Wine file, which j00ru revision, last verified date.

- [ ] **Step 1: Create `apps/web/src/pages/api/[name]/source.astro`**

```astro
---
import ApiLayout from "../../../layouts/ApiLayout.astro";
import { getAllApis } from "../../../lib/data";

export async function getStaticPaths() {
  const apis = await getAllApis();
  return apis.map((api) => ({
    params: { name: api.name },
    props: { api },
  }));
}

const { api } = Astro.props;
const s = api.source;
---

<ApiLayout api={api} active="source">
  <p class="lead">Provenance for the data on this page.</p>

  <table class="src">
    <tbody>
      {s.pdb && (
        <tr><th>PDB module</th><td class="mono">{s.pdb.module} ({s.pdb.version})</td></tr>
      )}
      {s.phntPath && (
        <tr><th>phnt header</th><td class="mono">{s.phntPath}</td></tr>
      )}
      {s.reactosPath && (
        <tr><th>ReactOS source</th><td class="mono">{s.reactosPath}</td></tr>
      )}
      {s.winePath && (
        <tr><th>Wine source</th><td class="mono">{s.winePath}</td></tr>
      )}
      {s.j00ruRevision && (
        <tr><th>j00ru tables</th><td class="mono">rev {s.j00ruRevision}</td></tr>
      )}
      <tr><th>Last verified</th><td class="mono">{s.lastVerified}</td></tr>
    </tbody>
  </table>

  <p class="note">
    Sources marked above are the ones the Okuden ingest pipeline (or the human curator) used to produce this entry.
    If you spot a discrepancy, please open an issue on GitHub.
  </p>
</ApiLayout>

<style>
  .lead { color: var(--ink-soft); margin: var(--sp-3) 0 var(--sp-4); }
  .src { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
  .src th {
    text-align: left; padding: var(--sp-2) var(--sp-3);
    text-transform: uppercase; letter-spacing: 0.08em; font-size: var(--fs-xs);
    color: var(--mute); width: 180px;
    border-bottom: 1px solid var(--border);
  }
  .src td { padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border); }
  .mono { font-family: var(--font-mono); }
  .note { color: var(--mute); font-size: var(--fs-sm); margin-top: var(--sp-5); font-style: italic; }
</style>
```

- [ ] **Step 2: Verify all 4 API tab pages render**

```bash
pnpm web:build
```

Expected counts in `dist/`:
- 8 `dist/api/<name>/index.html` (Overview)
- 5 `dist/api/<name>/syscall/index.html`
- 8 `dist/api/<name>/examples/index.html`
- 8 `dist/api/<name>/used-by/index.html`
- 8 `dist/api/<name>/source/index.html`

Total: 8 + 5 + 8 + 8 + 8 = 37 API tab pages.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/api/[name]/source.astro
git commit -m "add Source tab (/api/[name]/source) — provenance metadata"
```

---

## Task 16: Struct Overview (`/struct/[name]`)

**Files:**
- Create: `apps/web/src/pages/struct/[name]/index.astro`

- [ ] **Step 1: Create `apps/web/src/pages/struct/[name]/index.astro`**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../../components/Breadcrumbs.astro";
import { getAllStructs } from "../../../lib/data";

export async function getStaticPaths() {
  const structs = await getAllStructs();
  return structs.map((struct) => ({
    params: { name: struct.name },
    props: { struct },
  }));
}

const { struct } = Astro.props;
---

<BaseLayout title={struct.name} description={struct.description}>
  <Breadcrumbs
    crumbs={[
      { label: "structs", href: "/struct/" },
      { label: struct.name },
    ]}
  />

  <header class="struct-header">
    <h1>{struct.name}</h1>
    <p class="lead">{struct.description}</p>
  </header>

  <nav class="tabs" aria-label="Struct sections">
    <a class="tabs__tab tabs__tab--active" href={`/struct/${struct.name}/`}>Overview</a>
    <a class="tabs__tab" href={`/struct/${struct.name}/layout/`}>Layout</a>
    <a class="tabs__tab" href={`/struct/${struct.name}/used-by/`}>Used by</a>
  </nav>

  <h2>Field summary</h2>
  <p>{struct.fields.length} field{struct.fields.length === 1 ? "" : "s"} declared.</p>
  <ul class="fields">
    {struct.fields.map((f) => (
      <li>
        <span class="fname">{f.name}</span>
        <span class="ftype">{f.type}</span>
        {f.description && <span class="fdesc">{f.description}</span>}
      </li>
    ))}
  </ul>

  <p class="hint">See the <a href={`/struct/${struct.name}/layout/`}>Layout tab</a> for offsets per Windows version.</p>
</BaseLayout>

<style>
  .struct-header { margin-bottom: var(--sp-4); }
  .struct-header h1 { font-family: var(--font-display); font-size: var(--fs-2xl); }
  .lead { color: var(--ink-soft); margin-top: var(--sp-2); }

  .tabs {
    display: flex; gap: 0; background: var(--ink);
    margin: var(--sp-4) calc(var(--sp-5) * -1) var(--sp-5);
    padding: 0 var(--sp-5);
    border-top: 1px solid var(--border);
  }
  .tabs__tab {
    color: var(--mute-soft); text-decoration: none;
    padding: var(--sp-3) var(--sp-4);
    text-transform: uppercase; letter-spacing: 0.12em;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    border-bottom: 3px solid transparent;
  }
  .tabs__tab:hover { color: var(--paper); }
  .tabs__tab--active { color: var(--accent); border-bottom-color: var(--accent); }

  h2 {
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2); margin-top: var(--sp-5);
  }
  .fields { list-style: none; padding: 0; margin: var(--sp-3) 0; font-family: var(--font-mono); font-size: var(--fs-sm); }
  .fields li { padding: var(--sp-1) 0; border-bottom: 1px solid var(--border); display: flex; gap: var(--sp-3); align-items: baseline; }
  .fname { font-weight: 700; min-width: 200px; }
  .ftype { color: var(--mute); min-width: 200px; }
  .fdesc { color: var(--ink-soft); font-family: var(--font-body); }
  .hint { color: var(--mute); margin-top: var(--sp-4); font-size: var(--fs-sm); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/struct/[name]/index.astro
git commit -m "add Struct Overview page (/struct/[name])"
```

---

## Task 17: Struct Layout (`/struct/[name]/layout`)

**Files:**
- Create: `apps/web/src/components/StructLayout.astro`
- Create: `apps/web/src/pages/struct/[name]/layout.astro`

The Layout tab renders a per-version offsets table. The component is in its own file because the same logic will be reused as a mini-display elsewhere (e.g., on `/struct/[name]/used-by` if needed).

- [ ] **Step 1: Create `apps/web/src/components/StructLayout.astro`**

```astro
---
import type { StructEntry, VersionEntry } from "../content.config";

interface Props {
  struct: StructEntry;
  versions: VersionEntry[];
}
const { struct, versions } = Astro.props;
const versionIds = versions.map((v) => v.id);
---

<table class="layout">
  <thead>
    <tr>
      <th class="layout__col-name">Field</th>
      <th class="layout__col-type">Type</th>
      {versions.map((v) => (
        <th class="layout__col-version">
          <span class="version-name">{v.displayName}</span>
          <span class="version-build">{v.buildNumber}</span>
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {struct.fields.map((f) => (
      <tr>
        <td class="layout__name">{f.name}</td>
        <td class="layout__type">{f.type}</td>
        {versionIds.map((id) => {
          const off = f.offsets[id];
          const sz = f.size[id];
          if (off === undefined) {
            return <td class="layout__cell layout__cell--missing">—</td>;
          }
          return (
            <td class="layout__cell">
              <div class="off">+0x{off.toString(16).padStart(2, "0")}</div>
              <div class="sz">{sz} byte{sz === 1 ? "" : "s"}</div>
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>

<style>
  .layout {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-sm);
    font-family: var(--font-mono);
    margin: var(--sp-4) 0;
  }
  .layout th {
    background: var(--ink);
    color: var(--bg);
    padding: var(--sp-2) var(--sp-3);
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .layout__col-version {
    text-align: right;
  }
  .version-name { display: block; font-weight: 700; }
  .version-build { display: block; color: var(--mute-soft); font-size: 9px; }
  .layout td {
    padding: var(--sp-2) var(--sp-3);
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  .layout__name { font-weight: 700; }
  .layout__type { color: var(--mute); }
  .layout__cell { text-align: right; }
  .off { font-weight: 700; }
  .sz { color: var(--mute); font-size: var(--fs-xs); }
  .layout__cell--missing { color: var(--border); text-align: right; }
</style>
```

- [ ] **Step 2: Create `apps/web/src/pages/struct/[name]/layout.astro`**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../../components/Breadcrumbs.astro";
import StructLayout from "../../../components/StructLayout.astro";
import { getAllStructs, getAllVersions } from "../../../lib/data";

export async function getStaticPaths() {
  const structs = await getAllStructs();
  return structs.map((struct) => ({
    params: { name: struct.name },
    props: { struct },
  }));
}

const { struct } = Astro.props;
const versions = await getAllVersions();
---

<BaseLayout title={`${struct.name} layout`} description={`Field offsets for ${struct.name} per Windows version.`}>
  <Breadcrumbs
    crumbs={[
      { label: "structs", href: "/struct/" },
      { label: struct.name, href: `/struct/${struct.name}/` },
      { label: "layout" },
    ]}
  />

  <header class="struct-header">
    <h1>{struct.name}</h1>
    <p class="sublead">Field layout per Windows version</p>
  </header>

  <nav class="tabs" aria-label="Struct sections">
    <a class="tabs__tab" href={`/struct/${struct.name}/`}>Overview</a>
    <a class="tabs__tab tabs__tab--active" href={`/struct/${struct.name}/layout/`}>Layout</a>
    <a class="tabs__tab" href={`/struct/${struct.name}/used-by/`}>Used by</a>
  </nav>

  <StructLayout struct={struct} versions={versions} />
</BaseLayout>

<style>
  .struct-header { margin-bottom: var(--sp-3); }
  .struct-header h1 { font-family: var(--font-display); font-size: var(--fs-xl); }
  .sublead { color: var(--mute); font-family: var(--font-mono); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.12em; }

  .tabs {
    display: flex; gap: 0; background: var(--ink);
    margin: var(--sp-4) calc(var(--sp-5) * -1) var(--sp-5);
    padding: 0 var(--sp-5);
    border-top: 1px solid var(--border);
  }
  .tabs__tab {
    color: var(--mute-soft); text-decoration: none;
    padding: var(--sp-3) var(--sp-4);
    text-transform: uppercase; letter-spacing: 0.12em;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    border-bottom: 3px solid transparent;
  }
  .tabs__tab:hover { color: var(--paper); }
  .tabs__tab--active { color: var(--accent); border-bottom-color: var(--accent); }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/StructLayout.astro \
        apps/web/src/pages/struct/[name]/layout.astro
git commit -m "add Struct Layout tab with per-version offsets table"
```

---

## Task 18: Struct Used-by (`/struct/[name]/used-by`)

**Files:**
- Create: `apps/web/src/pages/struct/[name]/used-by.astro`

- [ ] **Step 1: Create `apps/web/src/pages/struct/[name]/used-by.astro`**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../../components/Breadcrumbs.astro";
import { getAllStructs, getAllApis } from "../../../lib/data";
import { apiPath } from "../../../lib/slug";

export async function getStaticPaths() {
  const structs = await getAllStructs();
  return structs.map((struct) => ({
    params: { name: struct.name },
    props: { struct },
  }));
}

const { struct } = Astro.props;
const allApis = new Set((await getAllApis()).map((a) => a.name));
---

<BaseLayout title={`${struct.name} used by`} description={`APIs that reference ${struct.name}.`}>
  <Breadcrumbs
    crumbs={[
      { label: "structs", href: "/struct/" },
      { label: struct.name, href: `/struct/${struct.name}/` },
      { label: "used by" },
    ]}
  />

  <header class="struct-header">
    <h1>{struct.name}</h1>
    <p class="sublead">APIs that reference this struct</p>
  </header>

  <nav class="tabs" aria-label="Struct sections">
    <a class="tabs__tab" href={`/struct/${struct.name}/`}>Overview</a>
    <a class="tabs__tab" href={`/struct/${struct.name}/layout/`}>Layout</a>
    <a class="tabs__tab tabs__tab--active" href={`/struct/${struct.name}/used-by/`}>Used by</a>
  </nav>

  {struct.usedBy.length === 0 ? (
    <p class="empty">No referencing APIs recorded yet.</p>
  ) : (
    <ul class="rels">
      {struct.usedBy.map((name) => (
        <li>
          {allApis.has(name) ? (
            <a href={apiPath(name)}>{name}</a>
          ) : (
            <span class="dim">{name}</span>
          )}
        </li>
      ))}
    </ul>
  )}
</BaseLayout>

<style>
  .struct-header { margin-bottom: var(--sp-3); }
  .struct-header h1 { font-family: var(--font-display); font-size: var(--fs-xl); }
  .sublead { color: var(--mute); font-family: var(--font-mono); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.12em; }

  .tabs {
    display: flex; gap: 0; background: var(--ink);
    margin: var(--sp-4) calc(var(--sp-5) * -1) var(--sp-5);
    padding: 0 var(--sp-5);
    border-top: 1px solid var(--border);
  }
  .tabs__tab {
    color: var(--mute-soft); text-decoration: none;
    padding: var(--sp-3) var(--sp-4);
    text-transform: uppercase; letter-spacing: 0.12em;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    border-bottom: 3px solid transparent;
  }
  .tabs__tab--active { color: var(--accent); border-bottom-color: var(--accent); }

  .rels { list-style: none; padding: 0; margin: var(--sp-4) 0; font-family: var(--font-mono); font-size: var(--fs-sm); }
  .rels li { padding: var(--sp-1) 0; border-bottom: 1px solid var(--border); }
  .empty { color: var(--mute); font-style: italic; }
  .dim { color: var(--mute); }
  .dim::after { content: " (not in dataset yet)"; font-size: var(--fs-xs); color: var(--border); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/struct/[name]/used-by.astro
git commit -m "add Struct Used-by tab"
```

---

## Task 19: DLL index + Category index

**Files:**
- Create: `apps/web/src/pages/[dll]/index.astro`
- Create: `apps/web/src/pages/[dll]/[category]/index.astro`
- Create: `apps/web/src/pages/struct/index.astro`

These are the catalog pages users land on by clicking the top nav. Each shows a filterable grid of API/struct cards.

- [ ] **Step 1: Create `apps/web/src/pages/[dll]/index.astro`**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../components/Breadcrumbs.astro";
import Tag from "../../components/Tag.astro";
import { getAllApis } from "../../lib/data";
import { apiPath, categoryPath } from "../../lib/slug";

const SUPPORTED_DLLS = ["ntdll", "kernel32", "kernelbase", "advapi32", "user32", "ws2_32"] as const;

export async function getStaticPaths() {
  return SUPPORTED_DLLS.map((dll) => ({ params: { dll } }));
}

const { dll } = Astro.params;
const apis = (await getAllApis()).filter((a) => a.dll === dll);
const categories = [...new Set(apis.map((a) => a.category))].sort();
---

<BaseLayout title={dll!.toUpperCase()} description={`All ${dll} APIs in Okuden.`}>
  <Breadcrumbs crumbs={[{ label: dll! }]} />

  <header class="dll-header">
    <h1>{dll!.toUpperCase()}</h1>
    <p class="sublead">{apis.length} entr{apis.length === 1 ? "y" : "ies"} across {categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
  </header>

  {categories.length === 0 ? (
    <p class="empty">No entries for {dll} yet. Coming as the dataset grows.</p>
  ) : (
    categories.map((cat) => {
      const list = apis.filter((a) => a.category === cat);
      return (
        <section class="cat">
          <h2>
            <a href={categoryPath(dll!, cat)}>{cat}</a>
            <span class="count">{list.length}</span>
          </h2>
          <div class="cards">
            {list.map((api) => (
              <a class="card" href={apiPath(api.name)}>
                <div class="card__name">{api.name}</div>
                <div class="card__tags">
                  {api.tags.map((t) => (
                    <Tag variant={t === "undocumented" || t === "partial" ? "accent" : "default"}>{t}</Tag>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>
      );
    })
  )}
</BaseLayout>

<style>
  .dll-header h1 { font-family: var(--font-display); font-size: var(--fs-2xl); }
  .sublead { color: var(--mute); margin-top: var(--sp-2); font-size: var(--fs-sm); }

  .cat { margin: var(--sp-6) 0; }
  .cat h2 {
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); font-family: var(--font-display);
    border-bottom: 1px solid var(--border); padding-bottom: var(--sp-2);
    display: flex; align-items: baseline; gap: var(--sp-2);
  }
  .cat h2 a { text-decoration: none; }
  .cat h2 a:hover { color: var(--accent); }
  .count {
    font-family: var(--font-mono); font-size: var(--fs-xs);
    color: var(--mute); font-weight: 400;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--sp-3);
    margin: var(--sp-3) 0;
  }
  .card {
    border: 1px solid var(--border);
    background: var(--paper);
    padding: var(--sp-3);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .card:hover { border-color: var(--accent); }
  .card__name {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--ink);
    font-size: var(--fs-sm);
  }
  .card__tags { display: inline-flex; gap: 0; }
  .empty { color: var(--mute); font-style: italic; margin: var(--sp-5) 0; }
</style>
```

- [ ] **Step 2: Create `apps/web/src/pages/[dll]/[category]/index.astro`**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../../components/Breadcrumbs.astro";
import Tag from "../../../components/Tag.astro";
import { getAllApis } from "../../../lib/data";
import { apiPath, dllPath } from "../../../lib/slug";

export async function getStaticPaths() {
  const apis = await getAllApis();
  const seen = new Set<string>();
  const paths: Array<{ params: { dll: string; category: string } }> = [];
  for (const api of apis) {
    const key = `${api.dll}/${api.category}`;
    if (seen.has(key)) continue;
    seen.add(key);
    paths.push({ params: { dll: api.dll, category: api.category } });
  }
  return paths;
}

const { dll, category } = Astro.params;
const apis = (await getAllApis())
  .filter((a) => a.dll === dll && a.category === category);
---

<BaseLayout title={`${dll} · ${category}`} description={`${dll} APIs in the ${category} category.`}>
  <Breadcrumbs
    crumbs={[
      { label: dll!, href: dllPath(dll!) },
      { label: category! },
    ]}
  />

  <header class="cat-header">
    <h1>{category}</h1>
    <p class="sublead">{apis.length} entr{apis.length === 1 ? "y" : "ies"} in {dll!.toUpperCase()}</p>
  </header>

  <div class="cards">
    {apis.map((api) => (
      <a class="card" href={apiPath(api.name)}>
        <div class="card__name">{api.name}</div>
        <p class="card__desc">{api.description}</p>
        <div class="card__tags">
          {api.tags.map((t) => (
            <Tag variant={t === "undocumented" || t === "partial" ? "accent" : "default"}>{t}</Tag>
          ))}
        </div>
      </a>
    ))}
  </div>
</BaseLayout>

<style>
  .cat-header h1 { font-family: var(--font-display); font-size: var(--fs-xl); text-transform: lowercase; }
  .sublead { color: var(--mute); margin-top: var(--sp-2); font-size: var(--fs-sm); font-family: var(--font-mono); }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--sp-3);
    margin-top: var(--sp-5);
  }
  .card {
    border: 1px solid var(--border);
    background: var(--paper);
    padding: var(--sp-3);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .card:hover { border-color: var(--accent); }
  .card__name { font-family: var(--font-mono); font-weight: 700; color: var(--ink); font-size: var(--fs-sm); }
  .card__desc { font-size: var(--fs-sm); color: var(--ink-soft); margin: 0; line-height: 1.45; }
  .card__tags { display: inline-flex; gap: 0; margin-top: auto; }
</style>
```

- [ ] **Step 3: Create `apps/web/src/pages/struct/index.astro`**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Breadcrumbs from "../../components/Breadcrumbs.astro";
import { getAllStructs } from "../../lib/data";
import { structPath } from "../../lib/slug";

const structs = await getAllStructs();
---

<BaseLayout title="Structs" description="All Windows internal structures referenced in Okuden.">
  <Breadcrumbs crumbs={[{ label: "structs" }]} />

  <header>
    <h1>Structs</h1>
    <p class="sublead">{structs.length} structure{structs.length === 1 ? "" : "s"} indexed</p>
  </header>

  <div class="cards">
    {structs.map((s) => (
      <a class="card" href={structPath(s.name)}>
        <div class="card__name">{s.name}</div>
        <p class="card__desc">{s.description}</p>
        <div class="card__meta">{s.fields.length} field{s.fields.length === 1 ? "" : "s"}</div>
      </a>
    ))}
  </div>
</BaseLayout>

<style>
  h1 { font-family: var(--font-display); font-size: var(--fs-2xl); }
  .sublead { color: var(--mute); margin-top: var(--sp-2); font-size: var(--fs-sm); font-family: var(--font-mono); }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--sp-3);
    margin-top: var(--sp-5);
  }
  .card {
    border: 1px solid var(--border);
    background: var(--paper);
    padding: var(--sp-3);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .card:hover { border-color: var(--accent); }
  .card__name { font-family: var(--font-mono); font-weight: 700; color: var(--ink); font-size: var(--fs-sm); }
  .card__desc { font-size: var(--fs-sm); color: var(--ink-soft); margin: 0; line-height: 1.45; }
  .card__meta { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--mute); }
</style>
```

- [ ] **Step 4: Verify the build**

```bash
pnpm web:build
```

Expected new pages:
- 6 `dist/<dll>/index.html` (one per supported DLL — most are empty in V1)
- ~5 `dist/<dll>/<category>/index.html` (only categories with entries: ntdll/{file,process,memory}, kernel32/{file,memory,process})
- 1 `dist/struct/index.html`

Total ~12 new pages.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/[dll]/index.astro \
        apps/web/src/pages/[dll]/[category]/index.astro \
        apps/web/src/pages/struct/index.astro
git commit -m "add DLL/category/struct catalog index pages"
```

---

## Task 20: Landing page + 404 + About

**Files:**
- Modify: `apps/web/src/pages/index.astro` (replace placeholder with real landing)
- Create: `apps/web/src/pages/404.astro`
- Create: `apps/web/src/pages/about.astro`

- [ ] **Step 1: Replace `apps/web/src/pages/index.astro` with the real landing**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getAllApis, getAllStructs, getAllVersions, getCurrentVersion } from "../lib/data";

const apis = await getAllApis();
const structs = await getAllStructs();
const versions = await getAllVersions();
const current = await getCurrentVersion();
---

<BaseLayout
  title="Okuden"
  description="Public web reference for Windows internal APIs — ntdll syscalls, undocumented helpers, Win32 user-mode DLLs, internal structures."
>
  <section class="hero">
    <h1>Okuden <span class="hero__kanji">奥伝</span></h1>
    <p class="hero__lead">
      Public reference for Windows internal APIs. ntdll syscalls and undocumented helpers,
      Win32 user-mode DLLs, internal structures (PEB, TEB, OBJECT_ATTRIBUTES, …).
    </p>
    <div class="hero__stats">
      <div><span class="stat__num">{apis.length}</span><span class="stat__label">APIs</span></div>
      <div><span class="stat__num">{structs.length}</span><span class="stat__label">structs</span></div>
      <div><span class="stat__num">{versions.length}</span><span class="stat__label">Win versions</span></div>
    </div>
  </section>

  <section class="cta">
    <h2>Browse</h2>
    <ul class="ctlinks">
      <li><a href="/ntdll/">NTDLL — syscalls and undocumented helpers</a></li>
      <li><a href="/kernel32/">KERNEL32 — Win32 user-mode wrappers</a></li>
      <li><a href="/struct/">STRUCTS — PEB, TEB, OBJECT_ATTRIBUTES, …</a></li>
      <li><a href="/graph/">GRAPH — full dependency graph</a></li>
    </ul>
  </section>

  <section class="meta">
    <p>
      Current Windows version: <strong>{current.displayName}</strong> ({current.buildNumber}, released {current.releaseDate}).
    </p>
    <p>
      Press <kbd>⌘K</kbd> or <kbd>/</kbd> to search.
      Source on <a href="https://github.com/En3nr4/Okuden">GitHub</a>.
      <a href="/about/">About this project</a>.
    </p>
  </section>
</BaseLayout>

<style>
  .hero { padding: var(--sp-6) 0; }
  .hero h1 { font-family: var(--font-display); font-size: var(--fs-2xl); display: flex; align-items: baseline; gap: var(--sp-3); }
  .hero__kanji { color: var(--accent); font-size: 0.7em; }
  .hero__lead { font-size: var(--fs-md); color: var(--ink-soft); margin: var(--sp-3) 0 var(--sp-5); max-width: 60ch; }
  .hero__stats {
    display: flex; gap: var(--sp-6); border-top: 4px solid var(--accent);
    background: var(--ink); color: var(--bg); padding: var(--sp-3) var(--sp-5);
  }
  .hero__stats div { display: flex; flex-direction: column; gap: var(--sp-1); }
  .stat__num { font-family: var(--font-mono); font-size: var(--fs-xl); font-weight: 700; color: var(--accent); }
  .stat__label { font-family: var(--font-mono); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.12em; color: var(--mute-soft); }

  .cta { margin: var(--sp-6) 0; }
  .cta h2 {
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2);
  }
  .ctlinks { list-style: none; padding: 0; margin: var(--sp-3) 0; }
  .ctlinks li { padding: var(--sp-2) 0; border-bottom: 1px solid var(--border); }
  .ctlinks a { font-family: var(--font-mono); font-size: var(--fs-sm); }

  .meta { margin-top: var(--sp-6); color: var(--mute); font-size: var(--fs-sm); }
  kbd { background: var(--ink); color: var(--bg); padding: 1px 4px; font-family: var(--font-mono); font-size: var(--fs-xs); }
</style>
```

- [ ] **Step 2: Create `apps/web/src/pages/404.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="404" description="Not found.">
  <section class="nf">
    <h1>404</h1>
    <p>This page does not exist (yet).</p>
    <p>
      Try the <a href="/">homepage</a>, or use <kbd>⌘K</kbd> to search.
      If you think this should be a real page, open an issue on <a href="https://github.com/En3nr4/Okuden">GitHub</a>.
    </p>
  </section>
</BaseLayout>

<style>
  .nf { padding: var(--sp-8) 0; }
  .nf h1 { font-family: var(--font-display); font-size: 6rem; color: var(--accent); line-height: 1; }
  .nf p { color: var(--ink-soft); margin-top: var(--sp-3); }
  kbd { background: var(--ink); color: var(--bg); padding: 1px 4px; font-family: var(--font-mono); font-size: var(--fs-xs); }
</style>
```

- [ ] **Step 3: Create `apps/web/src/pages/about.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout
  title="About"
  description="What Okuden is, where its data comes from, and how to contribute."
>
  <h1>About</h1>

  <h2>What this is</h2>
  <p>
    Okuden (奥伝) — "secret transmission" — is a public reference for Windows internal APIs.
    It indexes ntdll syscalls, undocumented helpers, Win32 user-mode DLLs, and internal
    structures, with version-aware metadata (syscall numbers per Windows build, struct field
    offsets per build, etc.).
  </p>

  <h2>Where the data comes from</h2>
  <p>The Okuden ingest pipeline (see Plan 3 in the repo) pulls data from:</p>
  <ul>
    <li><strong>Microsoft PDBs</strong> — symbols and struct layouts, fetched from Microsoft's symbol server</li>
    <li><strong>phnt headers</strong> (Process Hacker / SystemInformer) — undocumented prototypes</li>
    <li><strong>ReactOS / Wine sources</strong> — behavior cross-references</li>
    <li><strong>j00ru's syscall tables</strong> — SSN values per Windows build</li>
  </ul>
  <p>Every page has a <strong>Source</strong> tab linking the specific provenance for that entry.</p>

  <h2>How to contribute</h2>
  <p>
    Open a pull request against <a href="https://github.com/En3nr4/Okuden"><code>En3nr4/Okuden</code></a>.
    Edit the JSON files under <code>packages/data/</code> and ensure <code>pnpm validate:data</code>
    passes — that's the only gate.
  </p>

  <h2>License</h2>
  <p>
    The site code is MIT, the dataset is CC BY-SA 4.0. See per-package <code>LICENSE</code> files
    in the repo for details.
  </p>
</BaseLayout>

<style>
  h1 { font-family: var(--font-display); font-size: var(--fs-2xl); margin-bottom: var(--sp-4); }
  h2 {
    text-transform: uppercase; letter-spacing: 0.08em;
    font-size: var(--fs-sm); border-bottom: 1px solid var(--border);
    padding-bottom: var(--sp-2); margin-top: var(--sp-6);
  }
  ul { padding-left: var(--sp-5); }
  ul li { margin: var(--sp-2) 0; }
</style>
```

- [ ] **Step 4: Verify the build**

```bash
pnpm web:build
```

Expected: `dist/index.html` shows the real landing page with stats. `dist/about/index.html` exists. `dist/404.html` exists.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/index.astro \
        apps/web/src/pages/404.astro \
        apps/web/src/pages/about.astro
git commit -m "add real landing, 404, and about pages"
```

---

## Task 21: Pagefind setup verification

**Files:**
- Modify: `apps/web/src/components/TopNav.astro` (add `data-pagefind-body` boundary; this is a small no-op for now, search island arrives in Task 22)

Pagefind is already invoked by the `web:build` script (`astro build && pagefind --site dist`). After Task 20, Pagefind has real content to index. This task verifies the index is built and inspects it.

- [ ] **Step 1: Run a clean build**

```bash
rm -rf /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/apps/web/dist
pnpm web:build
```

Expected: Pagefind indexes the rendered HTML pages and produces `apps/web/dist/pagefind/` containing `pagefind.js`, `pagefind-ui.js`, and several `.pf_*` index files.

- [ ] **Step 2: Verify the Pagefind output**

```bash
ls -la /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/apps/web/dist/pagefind/ 2>&1 | head -20
```

Expected: at least `pagefind.js` (~50 KB) and one or more `.pf_meta`/`.pf_*` files.

- [ ] **Step 3: Configure Pagefind to ignore non-content elements**

By default Pagefind indexes the entire page including the TopNav. Add `data-pagefind-ignore` to the TopNav so it's not in the index. Use Edit on `apps/web/src/components/TopNav.astro`. Find:

```astro
<nav class="topnav">
```

Replace with:

```astro
<nav class="topnav" data-pagefind-ignore="all">
```

- [ ] **Step 4: Rebuild and verify**

```bash
pnpm web:build
```

Expected: build still succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/TopNav.astro
git commit -m "exclude TopNav from Pagefind index"
```

---

## Task 22: Search island (cmd-K palette)

**Files:**
- Create: `apps/web/src/islands/Search.tsx`
- Modify: `apps/web/src/layouts/BaseLayout.astro` (mount the Search island; client:load directive)

The Search island uses Pagefind's runtime API to query the static index built by Task 21. Renders as a modal palette triggered by `⌘K` / `Ctrl+K` / `/`.

- [ ] **Step 1: Create `apps/web/src/islands/Search.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";

interface Hit {
  url: string;
  title: string;
  excerpt: string;
}

declare global {
  interface Window {
    pagefind?: {
      search: (query: string) => Promise<{
        results: Array<{ data: () => Promise<Hit & { meta: { title: string } }> }>;
      }>;
    };
  }
}

async function loadPagefind() {
  if (typeof window === "undefined") return null;
  if (window.pagefind) return window.pagefind;
  try {
    // @ts-expect-error — runtime path served by Pagefind, no types
    const pf = await import(/* @vite-ignore */ "/pagefind/pagefind.js");
    window.pagefind = pf;
    return pf;
  } catch {
    return null;
  }
}

export default function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (!open && e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setOpen(true);
      } else if (open && e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (query.trim().length < 2) {
        setHits([]);
        return;
      }
      const pf = await loadPagefind();
      if (!pf) return;
      const search = await pf.search(query);
      const data = await Promise.all(search.results.slice(0, 10).map((r) => r.data()));
      if (!cancelled) {
        setHits(data.map((d) => ({ url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt })));
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-overlay__backdrop" onClick={() => setOpen(false)} />
      <div className="search-overlay__panel">
        <input
          ref={inputRef}
          className="search-overlay__input"
          type="text"
          placeholder="Search APIs, structs, syscalls…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-overlay__hits">
          {hits.length === 0 && query.trim().length >= 2 && (
            <div className="search-overlay__empty">No results</div>
          )}
          {hits.map((h) => (
            <a key={h.url} className="search-overlay__hit" href={h.url}>
              <div className="search-overlay__hit-title">{h.title}</div>
              <div
                className="search-overlay__hit-excerpt"
                dangerouslySetInnerHTML={{ __html: h.excerpt }}
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the search overlay styles to `apps/web/src/styles/global.css`**

Append to the bottom of `apps/web/src/styles/global.css` (use the Edit tool, append after the `::selection` line):

```css
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}
.search-overlay__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}
.search-overlay__panel {
  position: relative;
  width: 100%;
  max-width: 640px;
  background: var(--bg);
  border: 4px solid var(--accent);
  font-family: var(--font-mono);
}
.search-overlay__input {
  width: 100%;
  border: none;
  background: var(--ink);
  color: var(--bg);
  padding: var(--sp-3) var(--sp-4);
  font-family: var(--font-mono);
  font-size: var(--fs-md);
  outline: none;
}
.search-overlay__hits {
  max-height: 60vh;
  overflow-y: auto;
}
.search-overlay__hit {
  display: block;
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--ink);
}
.search-overlay__hit:hover { background: var(--bg-alt); border-color: var(--accent); }
.search-overlay__hit-title { font-weight: 700; font-family: var(--font-mono); }
.search-overlay__hit-excerpt {
  font-family: var(--font-body);
  font-size: var(--fs-sm);
  color: var(--ink-soft);
  margin-top: var(--sp-1);
}
.search-overlay__hit-excerpt :global(mark) {
  background: var(--accent);
  color: var(--paper);
  padding: 0 2px;
}
.search-overlay__empty {
  padding: var(--sp-4);
  color: var(--mute);
  font-style: italic;
}
```

- [ ] **Step 3: Mount the island in `BaseLayout.astro`**

Use the Edit tool. Find:

```astro
import TopNav from "../components/TopNav.astro";
```

Add a line after it:

```astro
import Search from "../islands/Search.tsx";
```

Then find the closing `</body>` tag in BaseLayout. Replace:

```astro
    <main>
      <slot />
    </main>
```

with:

```astro
    <main>
      <slot />
    </main>
    <Search client:load />
```

- [ ] **Step 4: Wire the TopNav search button to open the overlay**

Use the Edit tool on `apps/web/src/components/TopNav.astro`. Find:

```astro
<button class="search-trigger" type="button" aria-label="Open search (press / or cmd+k)">
```

Replace with:

```astro
<button class="search-trigger" type="button" aria-label="Open search (press / or cmd+k)" onclick="window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))">
```

(This is a small bridge: clicking the button synthesizes the cmd-K keydown that the Search island listens for. Cleaner than wiring a custom event.)

- [ ] **Step 5: Verify the build, then test manually**

```bash
pnpm web:build
pnpm web:preview
```

Open `http://localhost:4321/` (or whichever port Preview uses), press `Cmd+K` (or `Ctrl+K`), type "Nt" — results should appear. Press `Escape` to close.

If the search returns no results, Pagefind may not have indexed the dist. Re-run `pnpm web:build` and confirm `dist/pagefind/` exists.

Stop the preview with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/islands/Search.tsx \
        apps/web/src/styles/global.css \
        apps/web/src/layouts/BaseLayout.astro \
        apps/web/src/components/TopNav.astro
git commit -m "add cmd-K search island (Pagefind)"
```

---

## Task 23: Version selector island

**Files:**
- Create: `apps/web/src/lib/version.ts` (stub for now — future shared state if needed)
- Create: `apps/web/src/islands/VersionSelector.tsx`
- Modify: `apps/web/src/components/TopNav.astro` (replace static pill with the island)

The version selector reads `?v=<id>` from the URL and shows a dropdown. Selecting a version updates the URL. Pages that care about the current version (Syscall tab, Struct Layout tab) are static and rendered with all versions in the table — the version selector serves as a visual hint of "which one to focus on" rather than re-rendering.

(For V1.5 we may want the selector to actually filter table rows; for V1 it's a header indicator.)

- [ ] **Step 1: Create `apps/web/src/lib/version.ts`**

```ts
// Stable version-id list. Update when adding more Windows versions to the dataset.
export const KNOWN_VERSIONS = [
  { id: "win10-22h2", label: "Win10 22H2" },
  { id: "win11-23h2", label: "Win11 23H2" },
  { id: "win11-24h2", label: "Win11 24H2" },
] as const;

export const DEFAULT_VERSION_ID = "win11-24h2";
```

- [ ] **Step 2: Create `apps/web/src/islands/VersionSelector.tsx`**

```tsx
import { useEffect, useState } from "react";
import { KNOWN_VERSIONS, DEFAULT_VERSION_ID } from "../lib/version";

function readVersionFromURL(): string {
  if (typeof window === "undefined") return DEFAULT_VERSION_ID;
  const params = new URLSearchParams(window.location.search);
  const v = params.get("v");
  if (v && KNOWN_VERSIONS.some((kv) => kv.id === v)) return v;
  return DEFAULT_VERSION_ID;
}

function writeVersionToURL(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("v", id);
  window.history.replaceState(null, "", url.toString());
}

export default function VersionSelector() {
  const [versionId, setVersionId] = useState<string>(DEFAULT_VERSION_ID);

  useEffect(() => {
    setVersionId(readVersionFromURL());
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setVersionId(id);
    writeVersionToURL(id);
  }

  return (
    <select
      className="version-select"
      value={versionId}
      onChange={onChange}
      aria-label="Windows version"
    >
      {KNOWN_VERSIONS.map((v) => (
        <option key={v.id} value={v.id}>{v.label}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 3: Add styles for the selector to `apps/web/src/styles/global.css`**

Append:

```css
.version-select {
  background: var(--accent);
  color: var(--paper);
  border: none;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--sp-1) var(--sp-3);
  cursor: pointer;
  appearance: none;
}
.version-select:hover { filter: brightness(1.1); }
```

- [ ] **Step 4: Replace the static pill in TopNav with the island**

Use the Edit tool on `apps/web/src/components/TopNav.astro`. Find:

```astro
---
interface Props {
  currentVersion?: string;
}
const { currentVersion = "Win11 24H2" } = Astro.props;
---
```

Replace with:

```astro
---
import VersionSelector from "../islands/VersionSelector.tsx";
---
```

Then find:

```astro
<span class="version-pill">{currentVersion}</span>
```

Replace with:

```astro
<VersionSelector client:load />
```

Also remove the now-unused `.version-pill` CSS rule from the same file's `<style>` block.

- [ ] **Step 5: Verify the build**

```bash
pnpm web:build
pnpm web:preview
```

The TopNav now has an interactive dropdown. Switching versions updates the URL `?v=...`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/version.ts \
        apps/web/src/islands/VersionSelector.tsx \
        apps/web/src/styles/global.css \
        apps/web/src/components/TopNav.astro
git commit -m "add version selector island (URL state)"
```

---

## Task 24: Filters island for index pages

**Files:**
- Create: `apps/web/src/islands/Filters.tsx`
- Modify: `apps/web/src/pages/[dll]/index.astro` (add Filters island above the categories grid)

Client-side filters that toggle visibility of cards on the DLL index page (and any future catalog page). State: undocumented-only, deprecated-only, free-text name match.

- [ ] **Step 1: Create `apps/web/src/islands/Filters.tsx`**

```tsx
import { useEffect, useState } from "react";

interface Props {
  /** CSS selector for card elements to filter */
  selector: string;
}

export default function Filters({ selector }: Props) {
  const [name, setName] = useState("");
  const [undocOnly, setUndocOnly] = useState(false);
  const [hideDeprecated, setHideDeprecated] = useState(false);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(selector);
    const nameLower = name.trim().toLowerCase();
    cards.forEach((card) => {
      const cardName = card.dataset.name?.toLowerCase() ?? "";
      const cardTags = (card.dataset.tags ?? "").split(",");

      let visible = true;
      if (nameLower && !cardName.includes(nameLower)) visible = false;
      if (undocOnly && !cardTags.some((t) => t === "undocumented" || t === "partial")) visible = false;
      if (hideDeprecated && cardTags.includes("deprecated")) visible = false;

      card.style.display = visible ? "" : "none";
    });
  }, [name, undocOnly, hideDeprecated, selector]);

  return (
    <div className="filters">
      <input
        className="filters__name"
        type="text"
        placeholder="Filter by name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="filters__check">
        <input type="checkbox" checked={undocOnly} onChange={(e) => setUndocOnly(e.target.checked)} />
        Undocumented only
      </label>
      <label className="filters__check">
        <input type="checkbox" checked={hideDeprecated} onChange={(e) => setHideDeprecated(e.target.checked)} />
        Hide deprecated
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Add Filters styles to `apps/web/src/styles/global.css`**

Append:

```css
.filters {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
  margin: var(--sp-4) 0 var(--sp-5);
  padding: var(--sp-3);
  background: var(--bg-alt);
  border: 1px solid var(--border);
  flex-wrap: wrap;
}
.filters__name {
  flex: 1;
  min-width: 200px;
  background: var(--paper);
  border: 1px solid var(--ink);
  padding: var(--sp-2) var(--sp-3);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}
.filters__check {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
  cursor: pointer;
}
.filters__check input[type="checkbox"] {
  accent-color: var(--accent);
}
```

- [ ] **Step 3: Wire Filters into the DLL index**

Use the Edit tool on `apps/web/src/pages/[dll]/index.astro`. Find:

```astro
import { getAllApis } from "../../lib/data";
import { apiPath, categoryPath } from "../../lib/slug";
```

Add:

```astro
import Filters from "../../islands/Filters.tsx";
```

Then find:

```astro
            {list.map((api) => (
              <a class="card" href={apiPath(api.name)}>
```

Replace with:

```astro
            {list.map((api) => (
              <a class="card" href={apiPath(api.name)} data-name={api.name} data-tags={api.tags.join(",")}>
```

Also find:

```astro
  ) : (
    categories.map((cat) => {
```

Insert just before this `categories.map`:

```astro
  ) : (
    <>
      <Filters client:load selector=".card" />
      {categories.map((cat) => {
```

And the corresponding closing — find:

```astro
      );
    })
  )}
```

Replace with:

```astro
      );
    })}
    </>
  )}
```

- [ ] **Step 4: Verify build**

```bash
pnpm web:build
pnpm web:preview
```

Visit `/ntdll/`, type "Create" in the filter input — the cards filter live.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/islands/Filters.tsx \
        apps/web/src/styles/global.css \
        apps/web/src/pages/[dll]/index.astro
git commit -m "add Filters island for catalog pages (name/undoc/deprecated)"
```

---

## Task 25: Cytoscape graph + `/graph` page + mini-graph

**Files:**
- Create: `apps/web/src/islands/DepGraph.tsx`
- Create: `apps/web/src/components/EmbeddedGraph.astro`
- Create: `apps/web/src/pages/graph.astro`
- Modify: `apps/web/src/pages/api/[name]/used-by.astro` (embed mini-graph)

The DepGraph island uses Cytoscape with the cose-bilkent layout. It accepts `nodes` and `edges` as props (passed from Astro at build time as JSON), then renders client-side. The mini-graph variant is a 1-hop view embedded in the Used-by tab.

- [ ] **Step 1: Create `apps/web/src/islands/DepGraph.tsx`**

```tsx
import { useEffect, useRef } from "react";
import cytoscape, { type ElementDefinition } from "cytoscape";
// @ts-expect-error — cose-bilkent has no types
import coseBilkent from "cytoscape-cose-bilkent";

cytoscape.use(coseBilkent);

interface Props {
  nodes: Array<{ id: string; label: string; type: "api" | "struct"; href: string }>;
  edges: Array<{ source: string; target: string }>;
  height?: number;
}

export default function DepGraph({ nodes, edges, height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements: ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: { id: n.id, label: n.label, type: n.type, href: n.href },
      })),
      ...edges.map((e, i) => ({
        data: { id: `e${i}`, source: e.source, target: e.target },
      })),
    ];
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#0a0a0a",
            "border-color": "#ff3d2e",
            "border-width": 2,
            label: "data(label)",
            "font-family": "JetBrains Mono, monospace",
            "font-size": 11,
            "font-weight": 700,
            color: "#0a0a0a",
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: 24,
            height: 24,
          },
        },
        {
          selector: 'node[type="struct"]',
          style: { "background-color": "#ff3d2e", "border-color": "#0a0a0a" },
        },
        {
          selector: "edge",
          style: {
            "line-color": "#7a7468",
            "target-arrow-color": "#7a7468",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            width: 1,
          },
        },
        {
          selector: "node:selected",
          style: { "border-color": "#ff3d2e", "border-width": 4 },
        },
      ],
      layout: {
        name: "cose-bilkent",
        animate: false,
        nodeRepulsion: 8000,
        idealEdgeLength: 80,
      } as cytoscape.LayoutOptions,
    });

    cy.on("tap", "node", (evt) => {
      const href = evt.target.data("href");
      if (href) window.location.href = href;
    });

    return () => {
      cy.destroy();
    };
  }, [nodes, edges]);

  return <div ref={containerRef} className="depgraph" style={{ height }} />;
}
```

- [ ] **Step 2: Add DepGraph styles**

Append to `apps/web/src/styles/global.css`:

```css
.depgraph {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--ink);
  margin: var(--sp-4) 0;
}
```

- [ ] **Step 3: Create `apps/web/src/pages/graph.astro` (full graph)**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import DepGraph from "../islands/DepGraph.tsx";
import { getAllApis, getAllStructs } from "../lib/data";
import { apiPath, structPath } from "../lib/slug";

const apis = await getAllApis();
const structs = await getAllStructs();

const nodes = [
  ...apis.map((a) => ({ id: `api:${a.name}`, label: a.name, type: "api" as const, href: apiPath(a.name) })),
  ...structs.map((s) => ({ id: `struct:${s.name}`, label: s.name, type: "struct" as const, href: structPath(s.name) })),
];

const edges: Array<{ source: string; target: string }> = [];
for (const api of apis) {
  for (const callee of api.calls) {
    edges.push({ source: `api:${api.name}`, target: `api:${callee}` });
  }
  for (const used of api.structsUsed) {
    edges.push({ source: `api:${api.name}`, target: `struct:${used}` });
  }
}

// Drop edges that point at nodes not in the dataset (avoid Cytoscape errors)
const nodeIds = new Set(nodes.map((n) => n.id));
const validEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
---

<BaseLayout
  title="Dependency graph"
  description="Visual graph of API and struct relationships in Okuden."
>
  <h1>Dependency graph</h1>
  <p class="lead">
    Drag nodes to reposition. Click a node to jump to its page. Black squares are APIs;
    red squares are structs.
  </p>
  <DepGraph nodes={nodes} edges={validEdges} height={700} client:only="react" />
</BaseLayout>

<style>
  h1 { font-family: var(--font-display); font-size: var(--fs-2xl); }
  .lead { color: var(--ink-soft); margin: var(--sp-3) 0 var(--sp-4); }
</style>
```

- [ ] **Step 4: Create `apps/web/src/components/EmbeddedGraph.astro` (1-hop helper)**

```astro
---
import DepGraph from "../islands/DepGraph.tsx";
import { getAllApis, getAllStructs } from "../lib/data";
import { apiPath, structPath } from "../lib/slug";

interface Props {
  centerApiName: string;
  height?: number;
}
const { centerApiName, height = 320 } = Astro.props;

const apis = await getAllApis();
const structs = await getAllStructs();
const center = apis.find((a) => a.name === centerApiName);

const nodes: Array<{ id: string; label: string; type: "api" | "struct"; href: string }> = [];
const edges: Array<{ source: string; target: string }> = [];

if (center) {
  nodes.push({ id: `api:${center.name}`, label: center.name, type: "api", href: apiPath(center.name) });
  const apisByName = new Map(apis.map((a) => [a.name, a]));
  const structsByName = new Map(structs.map((s) => [s.name, s]));

  for (const callee of center.calls) {
    const a = apisByName.get(callee);
    if (a) {
      nodes.push({ id: `api:${a.name}`, label: a.name, type: "api", href: apiPath(a.name) });
      edges.push({ source: `api:${center.name}`, target: `api:${a.name}` });
    }
  }
  for (const struct of center.structsUsed) {
    const s = structsByName.get(struct);
    if (s) {
      nodes.push({ id: `struct:${s.name}`, label: s.name, type: "struct", href: structPath(s.name) });
      edges.push({ source: `api:${center.name}`, target: `struct:${s.name}` });
    }
  }
  for (const caller of center.usedBy) {
    const a = apisByName.get(caller);
    if (a) {
      nodes.push({ id: `api:${a.name}`, label: a.name, type: "api", href: apiPath(a.name) });
      edges.push({ source: `api:${a.name}`, target: `api:${center.name}` });
    }
  }
}
---

{nodes.length <= 1 ? (
  <p class="empty">Not enough graph data yet for {centerApiName}.</p>
) : (
  <DepGraph nodes={nodes} edges={edges} height={height} client:only="react" />
)}

<style>
  .empty { color: var(--mute); font-style: italic; margin: var(--sp-4) 0; }
</style>
```

- [ ] **Step 5: Embed the mini-graph in the Used-by tab**

Use the Edit tool on `apps/web/src/pages/api/[name]/used-by.astro`. Find:

```astro
import { getAllApis, getAllStructs } from "../../../lib/data";
import { apiPath, structPath } from "../../../lib/slug";
```

Add:

```astro
import EmbeddedGraph from "../../../components/EmbeddedGraph.astro";
```

Then find:

```astro
<ApiLayout api={api} active="used-by">
  <section class="rels">
```

Replace with:

```astro
<ApiLayout api={api} active="used-by">
  <h2 class="graph-heading">Mini graph</h2>
  <EmbeddedGraph centerApiName={api.name} height={280} />

  <section class="rels">
```

Add to the `<style>` block at the bottom:

```css
.graph-heading {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--fs-sm);
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--sp-2);
  margin-top: var(--sp-4);
}
```

- [ ] **Step 6: Verify the build**

```bash
pnpm web:build
pnpm web:preview
```

Visit `/graph/` — see the full graph. Visit `/api/NtCreateFile/used-by/` — see the mini-graph at the top.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/islands/DepGraph.tsx \
        apps/web/src/styles/global.css \
        apps/web/src/pages/graph.astro \
        apps/web/src/components/EmbeddedGraph.astro \
        apps/web/src/pages/api/[name]/used-by.astro
git commit -m "add Cytoscape dependency graph (full + 1-hop embedded)"
```

---

## Task 26: Snapshot tests + Cloudflare Pages deploy + robots.txt

**Files:**
- Create: `apps/web/tests/snapshot.test.ts`
- Create: `apps/web/tests/fixtures/snapshot-pages.json`
- Create: `apps/web/public/robots.txt`
- Create: `apps/web/vitest.config.ts`
- Create: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/verify.yml` (add a `web` job that runs `pnpm web:build` and `pnpm web:test`)

Snapshot tests render representative pages and assert key markers stay present. The deploy workflow pushes the built `dist/` to Cloudflare Pages on every main commit.

- [ ] **Step 1: Create `apps/web/vitest.config.ts`**

```ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
});
```

- [ ] **Step 2: Create `apps/web/tests/fixtures/snapshot-pages.json`**

```json
{
  "pages": [
    { "path": "dist/index.html", "expect": ["Okuden", "Public reference for Windows internal APIs"] },
    { "path": "dist/api/NtCreateFile/index.html", "expect": ["NtCreateFile", "NTSTATUS NtCreateFile", "PHANDLE FileHandle"] },
    { "path": "dist/api/NtCreateFile/syscall/index.html", "expect": ["NtCreateFile", "Syscall Numbers", "Win11 24H2"] },
    { "path": "dist/struct/_PEB/layout/index.html", "expect": ["_PEB", "BeingDebugged", "Ldr"] },
    { "path": "dist/ntdll/index.html", "expect": ["NTDLL", "NtCreateFile", "NtAllocateVirtualMemory"] }
  ]
}
```

- [ ] **Step 3: Create `apps/web/tests/snapshot.test.ts`**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import fixtures from "./fixtures/snapshot-pages.json";

const root = resolve(__dirname, "..");

describe("rendered HTML snapshots", () => {
  beforeAll(() => {
    // dist/ must exist; CI runs `pnpm web:build` before tests.
    const distExists = existsSync(resolve(root, "dist/index.html"));
    if (!distExists) {
      throw new Error(
        "dist/ does not exist — run `pnpm web:build` before `pnpm web:test`.",
      );
    }
  });

  for (const page of fixtures.pages) {
    it(`renders ${page.path}`, () => {
      const fullPath = resolve(root, page.path);
      expect(existsSync(fullPath), `${page.path} does not exist in dist/`).toBe(true);
      const html = readFileSync(fullPath, "utf-8");
      for (const marker of page.expect) {
        expect(html, `expected "${marker}" in ${page.path}`).toContain(marker);
      }
    });
  }
});
```

- [ ] **Step 4: Run the tests**

```bash
pnpm web:build
pnpm web:test
```

Expected: 5 tests pass.

- [ ] **Step 5: Create `apps/web/public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://okuden.dev/sitemap-index.xml
```

(Note: a sitemap integration can be added later via `@astrojs/sitemap`. Documenting the URL up front so crawlers know where to look once it's there.)

- [ ] **Step 6: Add the `web` job to `.github/workflows/verify.yml`**

Use the Edit tool. Find:

```yaml
  ingest:
    name: ingest tests (Python)
```

Add the `web` job above `ingest` (so it appears between `data` and `ingest`):

```yaml
  web:
    name: web build + tests (Astro)
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
      - run: pnpm web:build
      - run: pnpm web:test

  ingest:
    name: ingest tests (Python)
```

- [ ] **Step 7: Create `.github/workflows/deploy.yml`**

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: deploy to Cloudflare Pages
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
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
      - run: pnpm web:build
      - name: Publish to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/web/dist --project-name=okuden --branch=main
```

(Note: this requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets to be set in the GitHub repo settings before the first run. The deploy job will fail until those exist — that's expected and documented in the README's deferred operational concerns.)

- [ ] **Step 8: Verify CI workflow YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/verify.yml')); yaml.safe_load(open('.github/workflows/deploy.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 9: Final smoke test — run the same commands CI will run**

```bash
pnpm install --frozen-lockfile
pnpm validate:data
pnpm web:build
pnpm web:test
```

All four should exit 0.

- [ ] **Step 10: Commit**

```bash
git add apps/web/vitest.config.ts \
        apps/web/tests/snapshot.test.ts \
        apps/web/tests/fixtures/snapshot-pages.json \
        apps/web/public/robots.txt \
        .github/workflows/verify.yml \
        .github/workflows/deploy.yml
git commit -m "add snapshot tests, robots.txt, deploy workflow, web CI job"
```

---

## Final verification

After all 26 tasks are committed, run a clean end-to-end check from the repo root:

```bash
cd /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden

pnpm install --frozen-lockfile
pnpm validate:data
pnpm web:build
pnpm web:test

# Python validator still works
/home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/packages/ingest/.venv/bin/pytest /home/st4ban/Documents/BACKUP/CODE/ENENRA/Okuden/packages/ingest/tests/ -v

# Inspect output
ls apps/web/dist/
ls apps/web/dist/api/
ls apps/web/dist/struct/
ls apps/web/dist/pagefind/
```

Expected:
- All commands exit 0
- `dist/index.html`, `dist/about/index.html`, `dist/404.html` exist
- `dist/api/<name>/index.html` for all 8 APIs
- `dist/api/<name>/syscall/index.html` for all 5 syscall APIs
- `dist/api/<name>/{examples,used-by,source}/index.html` for all 8 APIs
- `dist/struct/<name>/index.html` for both structs (`_PEB`, `_OBJECT_ATTRIBUTES`) plus their `layout/` and `used-by/` sub-pages
- `dist/<dll>/index.html` for all 6 supported DLLs
- `dist/<dll>/<category>/index.html` for each populated `(dll, category)` pair
- `dist/graph/index.html`
- `dist/pagefind/` directory with the search index

The site is now ready to deploy. Once Cloudflare Pages secrets are configured in GitHub, the next push to `main` triggers the deploy workflow.

---

## Out of scope for this plan

Documented to prevent scope creep:

- Real PDB / phnt / ReactOS / Wine / j00ru ingest → Plan 3
- Cross-version side-by-side diff UI → V2
- Markdown / PDF export → V2
- Public JSON API → V2
- In-site contribution forms → V2
- Dark mode → V1.1 (variables already structured to support it)
- OPSEC overlay (hooked-by-EDR badges) → V2
- More DLLs (shell32, ole32, crypt32, ws2_32 entries beyond stub) → as the dataset grows in Plan 3
- Sitemap / `@astrojs/sitemap` integration → small follow-up after first deploy
- Cloudflare Pages preview deploys for PRs → optional follow-up
