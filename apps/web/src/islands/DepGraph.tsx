import { useEffect, useRef } from "react";
import cytoscape, { type ElementDefinition } from "cytoscape";
// @ts-expect-error — cose-bilkent has no types
import coseBilkent from "cytoscape-cose-bilkent";

cytoscape.use(coseBilkent);

interface Props {
  nodes: Array<{ id: string; label: string; type: "api" | "struct"; href: string }>;
  edges: Array<{ source: string; target: string }>;
  height?: number;
}

export default function DepGraph({ nodes, edges, height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements: ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: { id: n.id, label: n.label, type: n.type, href: n.href },
      })),
      ...edges.map((e, i) => ({
        data: { id: `e${i}`, source: e.source, target: e.target },
      })),
    ];
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#0a0a0a",
            "border-color": "#ff3d2e",
            "border-width": 2,
            label: "data(label)",
            "font-family": "JetBrains Mono, monospace",
            "font-size": 11,
            "font-weight": 700,
            color: "#0a0a0a",
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: 24,
            height: 24,
          },
        },
        {
          selector: 'node[type="struct"]',
          style: { "background-color": "#ff3d2e", "border-color": "#0a0a0a" },
        },
        {
          selector: "edge",
          style: {
            "line-color": "#7a7468",
            "target-arrow-color": "#7a7468",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            width: 1,
          },
        },
        {
          selector: "node:selected",
          style: { "border-color": "#ff3d2e", "border-width": 4 },
        },
      ],
      layout: {
        name: "cose-bilkent",
        animate: false,
        nodeRepulsion: 8000,
        idealEdgeLength: 80,
      } as cytoscape.LayoutOptions,
    });

    cy.on("tap", "node", (evt) => {
      const href = evt.target.data("href");
      if (href) window.location.href = href;
    });

    return () => {
      cy.destroy();
    };
  }, [nodes, edges]);

  return <div ref={containerRef} className="depgraph" style={{ height }} />;
}
