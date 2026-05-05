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
