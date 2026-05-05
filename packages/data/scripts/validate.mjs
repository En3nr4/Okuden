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
