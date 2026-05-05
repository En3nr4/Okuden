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
