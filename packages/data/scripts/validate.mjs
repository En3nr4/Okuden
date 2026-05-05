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
