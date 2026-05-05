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
