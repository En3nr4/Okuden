// Stable version-id list. Update when adding more Windows versions to the dataset.
export const KNOWN_VERSIONS = [
  { id: "win10-22h2", label: "Win10 22H2" },
  { id: "win11-23h2", label: "Win11 23H2" },
  { id: "win11-24h2", label: "Win11 24H2" },
] as const;

export const DEFAULT_VERSION_ID = "win11-24h2";
