import { useEffect, useState } from "react";

interface Props {
  /** CSS selector for card elements to filter */
  selector: string;
}

export default function Filters({ selector }: Props) {
  const [name, setName] = useState("");
  const [undocOnly, setUndocOnly] = useState(false);
  const [hideDeprecated, setHideDeprecated] = useState(false);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(selector);
    const nameLower = name.trim().toLowerCase();
    cards.forEach((card) => {
      const cardName = card.dataset.name?.toLowerCase() ?? "";
      const cardTags = (card.dataset.tags ?? "").split(",");

      let visible = true;
      if (nameLower && !cardName.includes(nameLower)) visible = false;
      if (undocOnly && !cardTags.some((t) => t === "undocumented" || t === "partial")) visible = false;
      if (hideDeprecated && cardTags.includes("deprecated")) visible = false;

      card.style.display = visible ? "" : "none";
    });
  }, [name, undocOnly, hideDeprecated, selector]);

  return (
    <div className="filters">
      <input
        className="filters__name"
        type="text"
        placeholder="Filter by name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="filters__check">
        <input type="checkbox" checked={undocOnly} onChange={(e) => setUndocOnly(e.target.checked)} />
        Undocumented only
      </label>
      <label className="filters__check">
        <input type="checkbox" checked={hideDeprecated} onChange={(e) => setHideDeprecated(e.target.checked)} />
        Hide deprecated
      </label>
    </div>
  );
}
