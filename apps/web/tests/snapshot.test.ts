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
