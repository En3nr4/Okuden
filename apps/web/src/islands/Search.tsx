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
    // Build the path dynamically so Vite/Rollup does not try to resolve it at build time.
    // Pagefind serves /pagefind/pagefind.js at runtime from the static site root.
    const path = "/" + "pagefind/pagefind.js";
    // @ts-expect-error — runtime path served by Pagefind, no types
    const pf = await import(/* @vite-ignore */ path);
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
