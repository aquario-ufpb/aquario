import type { GradeDisciplinaNode } from "@/lib/shared/types";

const ARROW_SIZE = 8;

type GraphEdgesProps = {
  disciplines: GradeDisciplinaNode[];
  nodeRefs: Map<string, DOMRect>;
  containerRect: DOMRect | null;
  highlightedCodes: Set<string> | null;
  hoveredCode: string | null;
};

export function GraphEdges({
  disciplines,
  nodeRefs,
  containerRect,
  highlightedCodes,
  hoveredCode,
}: GraphEdgesProps) {
  if (!containerRect || nodeRefs.size === 0) {
    return null;
  }

  // Build code → discipline map
  const codeToDisc = new Map<string, GradeDisciplinaNode>();
  for (const d of disciplines) {
    codeToDisc.set(d.codigo, d);
  }

  // Build edges: prerequisite → dependent
  const edges: {
    fromCode: string;
    toCode: string;
    highlighted: boolean;
    hovered: boolean;
  }[] = [];

  for (const disc of disciplines) {
    for (const reqCode of disc.preRequisitos) {
      if (codeToDisc.has(reqCode)) {
        const highlighted =
          highlightedCodes !== null &&
          highlightedCodes.has(disc.codigo) &&
          highlightedCodes.has(reqCode);
        const hovered =
          highlightedCodes === null &&
          hoveredCode !== null &&
          (disc.codigo === hoveredCode || reqCode === hoveredCode);
        edges.push({
          fromCode: reqCode,
          toCode: disc.codigo,
          highlighted,
          hovered,
        });
      }
    }
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      width={containerRect.width}
      height={containerRect.height}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          refX={ARROW_SIZE}
          refY={ARROW_SIZE / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points={`0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}`}
            className="fill-slate-400 dark:fill-slate-500"
          />
        </marker>
        <marker
          id="arrowhead-hovered"
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          refX={ARROW_SIZE}
          refY={ARROW_SIZE / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points={`0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}`}
            className="fill-blue-400/60 dark:fill-blue-400/60"
          />
        </marker>
        <marker
          id="arrowhead-highlighted"
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          refX={ARROW_SIZE}
          refY={ARROW_SIZE / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points={`0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}`}
            className="fill-blue-500 dark:fill-blue-400"
          />
        </marker>
      </defs>
      {edges.map(({ fromCode, toCode, highlighted, hovered }) => {
        const fromRect = nodeRefs.get(fromCode);
        const toRect = nodeRefs.get(toCode);
        if (!fromRect || !toRect) {
          return null;
        }

        // Calculate positions relative to the container
        const x1 = fromRect.right - containerRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
        const x2 = toRect.left - containerRect.left;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;

        const dx = x2 - x1;
        const cp = dx * 0.4;

        const d = `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;

        const markerId = highlighted
          ? "arrowhead-highlighted"
          : hovered
            ? "arrowhead-hovered"
            : "arrowhead";

        return (
          <path
            key={`${fromCode}-${toCode}`}
            d={d}
            fill="none"
            className={
              highlighted
                ? "stroke-blue-500 dark:stroke-blue-400"
                : hovered
                  ? "stroke-blue-400/60 dark:stroke-blue-400/60"
                  : "stroke-slate-300 dark:stroke-slate-600"
            }
            strokeWidth={highlighted || hovered ? 2 : 1.5}
            opacity={highlightedCodes !== null && !highlighted ? 0.15 : 1}
            markerEnd={`url(#${markerId})`}
            style={{ transition: "stroke 0.15s, stroke-width 0.15s, opacity 0.15s" }}
          />
        );
      })}
    </svg>
  );
}
