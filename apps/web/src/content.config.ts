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
