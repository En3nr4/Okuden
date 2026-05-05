# Okuden — Design Spec

**Date**: 2026-05-05
**Status**: Approved (brainstorming phase)
**Project**: Okuden — public web reference for Windows internal APIs

---

## 1. Vision & Scope

Okuden is a public web reference for the offensive security community, indexing Windows internal APIs that are otherwise scattered across PDBs, MSDN, third-party header projects, and reverse-engineering blog posts.

### V1 content scope

- **ntdll complete**: syscalls (`Nt*` / `Zw*`) and undocumented helpers (`Rtl*`, `Ldr*`, `Csr*`)
- **Win32 user-mode**: `kernel32`, `kernelbase`, `advapi32`, `user32`, `ws2_32`, and other primary user-mode DLLs
- **Internal structures**: `_PEB`, `_TEB`, `_LDR_DATA_TABLE_ENTRY`, `_OBJECT_ATTRIBUTES`, `_IO_STATUS_BLOCK`, etc.

### Explicitly out of V1 (deferred)

- Kernel-mode APIs (ntoskrnl exports, `Io*`, `Ob*`, `Mm*`)
- COM internals (`IWbemServices` and similar)
- OPSEC overlays (per-API hooked-by-EDR badges, behavioral IOCs, alternative-API suggestions)
- Cross-version side-by-side diff UI
- Markdown/PDF export per page
- Public JSON API
- Dark mode
- In-site contribution forms (V1 contributions go through GitHub PRs against the data package)

### Audience

Primary: red teamers, malware authors, security researchers, Windows internals enthusiasts. Public site, SEO-friendly, intended to attract community contributions.

### Success criteria

- Every entry's data is traceable to a verifiable source (PDB symbol, header file, ReactOS/Wine source, or j00ru SSN table).
- Users can find any API in under 3 seconds via cmd-K search.
- Every API and structure has a stable permalink.
- 8,000+ entries indexed at V1 launch (rough target — actual count depends on pipeline yield).
- Builds complete in under 5 minutes end-to-end at V1 scale.

---

## 2. High-Level Architecture

Single git monorepo, three packages, static-site delivery.

```
okuden/
├── apps/
│   └── web/                  # Astro site (this is what gets deployed)
├── packages/
│   ├── data/                 # JSON dataset (committed, source of truth for content)
│   └── ingest/               # Python pipeline that produces data/
├── docs/                     # Project docs and specs
└── pnpm-workspace.yaml       # Workspaces config
```

### Data flow

1. **Ingest** (offline, runs on a maintainer's machine or CI nightly): Python pipeline pulls PDBs from Microsoft symsrv, parses `phnt` headers, scrapes ReactOS/Wine source listings, ingests j00ru SSN tables. Outputs normalized JSON to `packages/data/`.
2. **Build**: `apps/web` Astro build reads `packages/data/*.json` via content collections (Zod-validated schemas), generates static HTML for every API page, structure page, and index/catalog page.
3. **Deploy**: `pnpm build` output (`dist/`) deployed to Cloudflare Pages on push to `main`.
4. **Search index**: Pagefind runs as a post-build step over the rendered HTML, producing a static search index that the client loads on demand.

### Why this shape

- **Static delivery** — the dataset is read-mostly; no need for a server. Trivial to host, infinite scale on Cloudflare's free tier, great SEO.
- **Astro** — built for content-heavy sites. Partial hydration ships JS only for interactive islands (cmd-K, filters, Cytoscape graph). Build perf at 8k+ pages stays acceptable.
- **Monorepo** — atomic schema changes (data + site stay in sync in one PR). Single CI. We can split later if the dataset matures into an independently-consumed artifact.
- **Python ingest** — the PDB / construct / pefile ecosystem is mature in Python. Nothing in JS-land matches it for binary-format parsing. Keeping ingest separate (its own package) means it doesn't pollute the site's tooling.

---

## 3. Tech Stack

| Layer                | Choice                                 | Why                                                                   |
| -------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Site framework       | Astro 5+                               | SSG-first, built for docs-scale, partial hydration                    |
| Content layer        | Astro content collections + Zod        | Typed schemas, build-time validation                                  |
| Interactive islands  | React (or Preact for size)             | cmd-K, filters, version selector, dep graph                           |
| Styling              | Tailwind CSS + custom CSS for layout   | Brutalist aesthetic needs hand-tuned spacing and borders              |
| Search               | Pagefind                               | Static full-text index, designed for SSG                              |
| Dependency graph     | Cytoscape.js                           | Mature, performant for the medium graphs we'll render                 |
| Code highlighting    | Shiki (Astro built-in integration)     | Build-time highlighting, no runtime cost                              |
| Ingest pipeline      | Python 3.12                            | Mature PDB/PE ecosystem (`pdbparse`, `construct`, `pefile`)           |
| Schema validation    | Zod (web) + Pydantic (ingest)          | Both ends typed, schemas live in `packages/data/schemas/`             |
| Hosting              | Cloudflare Pages                       | Free tier covers this, edge global, simple                            |
| Package manager      | pnpm + workspaces                      | Standard for monorepos                                                |
| CI                   | GitHub Actions                         | Free for public repos, plenty of integrations                         |

### What we are NOT using and why

- **Starlight** — too opinionated for the brutalist identity we want. We use Astro raw, building the layout ourselves.
- **Next.js** — heavier, slower builds at this scale, no benefit when the entire site is static.
- **Docusaurus / VitePress** — too rigid for our custom catalog/tabbed-API page layouts.
- **Algolia DocSearch** — Pagefind is static, free, and gives us the same UX without an external dependency.

---

## 4. Visual Identity

**Direction**: Engineering Brutalist (selected from three brainstormed options).

### Palette (V1)

| Token         | Hex       | Usage                                      |
| ------------- | --------- | ------------------------------------------ |
| `bg`          | `#f5f3ee` | Page background (cream)                    |
| `bg-alt`      | `#ebe8e0` | Panels, asides, secondary surfaces         |
| `ink`         | `#0a0a0a` | Text, top nav, code blocks                 |
| `ink-soft`    | `#1a1a1a` | Body text variant                          |
| `accent`      | `#ff3d2e` | Single accent — borders, hover, undoc tags |
| `mute`        | `#7a7468` | Secondary text, labels                     |
| `mute-soft`   | `#b8b3a8` | Tertiary text on dark backgrounds          |
| `border`      | `#d8d4cc` | Hairlines                                  |
| `paper`       | `#fff`    | Specific high-contrast surfaces            |

### Typography

- Display / headings: **Space Grotesk** (700, tight tracking)
- Body / UI: **Inter** (400/500/600)
- Code / monospace / tags / SSN values: **JetBrains Mono**

### Component conventions

- Tags are uppercase, monospace, rectangular (no rounded corners), with a single solid fill. Undocumented status uses the accent red.
- Top nav is solid ink with a 4px accent-red bottom border.
- Code blocks are solid ink with cream foreground.
- Tables use ink headers with cream foreground; row separators are 1px `border` lines.
- No drop shadows, no glassmorphism, no gradients. Hard edges, flat fills, strong type.

A `tokens.css` file in `apps/web/src/styles/` defines all colors, spacing, and font sizes as CSS custom properties so the dark mode (V1.1) can swap them.

---

## 5. App Shell (Navigation)

**Catalog-driven**, no left sidebar.

### Top nav (sticky, ink background, accent-red 4px bottom border)

- Left: `OKUDEN` wordmark (Space Grotesk, accent-red color)
- Center: top-level category links (NTDLL · KERNEL32 · KERNELBASE · ADVAPI32 · STRUCTS · GRAPH)
- cmd-K search trigger (also bound to `/`)
- Right: Windows version selector (dropdown) — controls global filter for SSN values, struct offsets, etc.

### Page types

| Route                        | Page type                                          |
| ---------------------------- | -------------------------------------------------- |
| `/`                          | Landing — what Okuden is, search bar, latest data updates |
| `/[dll]/`                    | DLL index — catalog of all APIs in that DLL, paginated, filterable |
| `/[dll]/[category]/`         | Category index within a DLL (file, memory, process, …) |
| `/api/[name]`                | API detail — Overview tab (default)               |
| `/api/[name]/syscall`        | API detail — Syscall tab                          |
| `/api/[name]/examples`       | API detail — Examples tab                         |
| `/api/[name]/used-by`        | API detail — Used-by tab + mini dep graph         |
| `/api/[name]/source`         | API detail — Source provenance tab                |
| `/struct/[name]`             | Struct detail — Overview tab                       |
| `/struct/[name]/layout`      | Struct detail — Layout tab (offsets per version)  |
| `/struct/[name]/used-by`     | Struct detail — Used-by tab                       |
| `/graph`                     | Full dependency graph (Cytoscape, filterable)      |
| `/about`                     | About page (data sources, license, contributing)   |

### Navigation behaviors

- cmd-K (`Cmd+K` / `Ctrl+K` / `/`) opens the search palette from anywhere.
- Pagefind powers full-text search across API names, prototypes, descriptions, struct names.
- Search results group by type: APIs, structs, categories.
- Breadcrumbs on every detail page (`/ ntdll / file / NtCreateFile`).
- Filters on index pages: DLL, category, undocumented-only, deprecated.

### Why no left sidebar

At ~8k+ entries, a left tree is either unusable (scroll-of-doom) or requires aggressive virtualization that fights against SSG. Catalog pages are crawlable (good for SEO), and cmd-K covers fast jumping for power users.

---

## 6. API Detail Page (the most-consumed surface)

**Tabbed sections, each tab a routable URL** — so search engines see five focused pages per API rather than one giant scroll page.

### Tabs

1. **Overview** (`/api/[name]`) — name, badges, one-paragraph description, prototype, parameters table, return value, brief "see also"
2. **Syscall** (`/api/[name]/syscall`) — only rendered for syscall APIs (the tab and route do not exist for non-syscall APIs). SSN per Windows version (table), syscall stub example (asm), hash for syscall-resolution techniques (Hell's Gate / Halo's Gate)
3. **Examples** (`/api/[name]/examples`) — code samples, one or more languages: C, asm. Examples are stored as separate files in `packages/data/examples/<api>/`
4. **Used by** (`/api/[name]/used-by`) — what calls this API, what this API calls, with a small embedded Cytoscape mini-graph (1-hop) and link to the full graph filtered to this node
5. **Source** (`/api/[name]/source`) — provenance: which PDB version, which header (e.g., `phnt/ntsysapi.h:142`), which ReactOS file, which j00ru table revision. Last verified date.

### Page structure (per tab)

- Sticky page header (smaller than top nav): API name, DLL chip, badges (SYSCALL · UNDOC · DEPRECATED), tab strip
- Body: scrollable, max-width ~720px for readability
- Tabs preserve the version selector state in the URL query string

### Why tabs over a single long page

The user explicitly chose this. The SEO concern is mitigated by giving each tab its own URL — every tab is a real page with its own focused content, increasing the surface available to search.

### Why these specific tabs

- **Syscall** is its own tab because the SSN table + asm stub is a workflow-critical block for offensive tooling — it deserves to be linkable directly.
- **Used by** as a tab gives the dep graph a place to live without bloating the overview.
- **Source** as a tab encodes data provenance prominently. For a reference site that wants to be trusted, "where did this come from" is a first-class concern.

---

## 7. Struct Detail Page

Same tabbed pattern for consistency.

1. **Overview** (`/struct/[name]`) — purpose, where it lives, brief description, summary of fields
2. **Layout** (`/struct/[name]/layout`) — full struct rendered C-like with field types, names, offsets, sizes. Offsets are version-aware (driven by the global version selector).
3. **Used by** (`/struct/[name]/used-by`) — which APIs reference this struct, embedded mini-graph

---

## 8. Dependency Graph

Two surfaces:

- **Embedded mini-graph** in the "Used by" tab of each API/struct (Cytoscape, 1-hop, ~50 nodes max)
- **Full graph** at `/graph` — the entire dataset, filterable by DLL / category / search-term, draggable layout, click-to-jump

Layout algorithm: Cytoscape's `cose-bilkent` (force-directed) for interactive views; pre-computed positions cached in `packages/data/graph-layout.json` for the full graph to avoid expensive client-side layout on first load.

---

## 9. Data Pipeline

Python 3.12 package at `packages/ingest/`.

### Inputs

- **Microsoft PDBs** — fetched on demand from `https://msdl.microsoft.com/download/symbols` (symsrv protocol). Cached locally per Windows version. Versions to support at V1: Win10 22H2, Win11 23H2, Win11 24H2, Server 2022 (more added as needed).
- **phnt headers** — vendored as a git submodule pointing at `winsiderss/systeminformer` (the `phnt` subtree). Parsed with `pycparser` + custom shim for MSVC-isms.
- **ReactOS source** — vendored or fetched on demand for cross-reference. Searched textually rather than parsed.
- **Wine source** — same approach as ReactOS.
- **j00ru tables** — committed as a versioned snapshot at `packages/ingest/sources/j00ru-syscalls/`. Updated when j00ru publishes new tables.

### Pipeline stages

1. **Resolve PDB symbols** for each supported Windows version → emit `pdb-symbols.json`
2. **Parse phnt** → emit `prototypes.json` (function signatures including undocumented)
3. **Cross-reference** PDB structs with phnt structs → reconcile naming, fill in offsets per version
4. **Map SSNs** from j00ru tables → tag syscall APIs with their SSN per version
5. **Locate ReactOS / Wine references** for each API by name → store source-file links for the "Source" tab
6. **Compute dependency edges** (kernel32 → ntdll, etc.) by parsing import tables of each DLL
7. **Emit normalized JSON** to `packages/data/{api,struct,version}/<name>.json`
8. **Validate** all output against the shared Zod/Pydantic schemas; fail the build on any schema mismatch

### Schema location

Schemas live in `packages/data/schemas/` as JSON Schema files. Both Zod (web) and Pydantic (ingest) generate types from them. This avoids drift between the two ends.

### Frequency

Pipeline runs in CI on a nightly schedule (GitHub Actions cron) and on demand (workflow_dispatch). It commits its output back to the repo via a bot account, opening a PR for human review of any large-diff changes.

---

## 10. Quality, Testing, Error Handling

### Testing

- **Schema validation** (build-time, both Python and TypeScript) — every JSON file passes its schema or the build fails
- **Astro content collection validation** — Zod schemas catch malformed data at build time
- **Snapshot tests** for representative pages (Vitest + Astro testing): the API detail page for `NtCreateFile` (a well-known syscall API exercising every tab), the struct page for `_PEB`, and the `ntdll/` index page
- **Pagefind smoke test** in CI — assert that searching for `NtCreateFile` returns at least one result with the expected URL
- **Link checker** — fail CI if any internal link 404s (`lychee` or similar)

### Error handling philosophy

- Pipeline failures are **loud**: any source unreachable, any schema mismatch, any unexpected struct shape → CI red. We do not accept silently-corrupted data.
- Runtime UI failures (cmd-K, graph) are **silent and non-blocking**: a broken graph viewer must not break the page. Components fall back gracefully (e.g., graph shows a textual list if Cytoscape fails to load).
- Missing fields render as visible `—` rather than hidden — incompleteness is a signal to contributors, not a bug to hide.

---

## 11. License

| Component                              | License        |
| -------------------------------------- | -------------- |
| `apps/web/` (site code)                | MIT            |
| `packages/ingest/` (Python pipeline)   | MIT            |
| `packages/data/` (JSON dataset)        | CC BY-SA 4.0   |

The data license intentionally requires share-alike: anyone who forks or redistributes the dataset must keep it open and attribute Okuden. This protects the community value while keeping all code permissive.

`LICENSE` files are placed at the package level so each is unambiguous.

---

## 12. Repository Layout

```
okuden/
├── README.md
├── LICENSE                          # repo-level pointer to per-package licenses
├── pnpm-workspace.yaml
├── package.json
├── .github/workflows/
│   ├── build.yml                    # build + deploy site on push to main
│   ├── ingest-nightly.yml           # run pipeline nightly, open PR
│   └── verify.yml                   # schema validation + link check + snapshot tests
├── apps/
│   └── web/
│       ├── astro.config.mjs
│       ├── package.json
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── content/
│       │   │   └── config.ts        # Astro content collection schemas (Zod)
│       │   ├── islands/             # interactive React components (cmd-K, filters, graph)
│       │   ├── layouts/
│       │   ├── pages/
│       │   │   ├── index.astro
│       │   │   ├── [dll]/
│       │   │   ├── api/[name]/
│       │   │   ├── struct/[name]/
│       │   │   └── graph.astro
│       │   ├── styles/
│       │   │   └── tokens.css
│       │   └── lib/
│       └── LICENSE                  # MIT
├── packages/
│   ├── data/
│   │   ├── api/
│   │   ├── struct/
│   │   ├── version/
│   │   ├── examples/
│   │   ├── schemas/                 # JSON Schema (source of truth for both ends)
│   │   ├── graph-layout.json
│   │   └── LICENSE                  # CC BY-SA 4.0
│   └── ingest/
│       ├── pyproject.toml
│       ├── okuden_ingest/
│       │   ├── pdb.py
│       │   ├── phnt.py
│       │   ├── reactos.py
│       │   ├── wine.py
│       │   ├── j00ru.py
│       │   ├── reconcile.py
│       │   └── emit.py
│       ├── tests/
│       └── LICENSE                  # MIT
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-05-okuden-design.md   # this file
```

---

## 13. Open questions (deferred, do not block V1 plan)

- **Domain name**: not chosen yet. Candidates to consider — `okuden.dev`, `okuden.org`, `okuden.sh`. Decide before deploy.
- **Bot account for nightly PRs**: needs setup before nightly ingest goes live.
- **Cloudflare Pages account**: needs to be linked to the GitHub repo before the first deploy.

These are operational concerns — they don't change the implementation plan.

---

## 14. Out-of-scope confirmations (V2+)

To prevent scope creep during implementation, the following are **explicitly deferred**:

- OPSEC overlay (hooked-by-EDR badges, alternative-API suggestions)
- Kernel APIs, COM internals
- Cross-version side-by-side comparison UI
- Markdown / PDF export
- Public JSON API
- In-site contribution forms
- Dark mode (V1.1 if user demand)
- External source aggregation beyond the pipeline inputs (MSDN scraping, ntinternals.net, Geoff Chappell)

Any of these reaching V1 requires re-opening this spec.
