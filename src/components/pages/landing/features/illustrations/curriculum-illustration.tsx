"use client";

import { cn } from "@/lib/client/utils";
import { type CSSProperties, useEffect, useState } from "react";
import type { FeatureIllustrationAppearance } from "../types";

const curriculumColumns = [12, 53, 94, 135, 176, 217, 258];
const curriculumRows = [12, 39, 66, 93, 120];
const curriculumNodes = curriculumRows.flatMap(y =>
  curriculumColumns.map(x => ({ id: `${x}-${y}`, x, y }))
);
const curriculumNodeMap = new Map(curriculumNodes.map(node => [node.id, node]));
const curriculumEdges = [
  { id: "core-1", from: "12-12", to: "53-12" },
  { id: "core-2", from: "53-12", to: "94-12" },
  { id: "core-3", from: "94-12", to: "135-39" },
  { id: "core-4", from: "135-39", to: "176-39" },
  { id: "core-5", from: "176-39", to: "217-66" },
  { id: "core-6", from: "217-66", to: "258-66" },
  { id: "mid-1", from: "12-39", to: "53-39" },
  { id: "mid-2", from: "53-39", to: "94-66" },
  { id: "mid-3", from: "94-66", to: "135-66" },
  { id: "mid-4", from: "135-66", to: "176-66" },
  { id: "mid-5", from: "176-66", to: "217-93" },
  { id: "mid-6", from: "217-93", to: "258-93" },
  { id: "low-1", from: "12-66", to: "53-66" },
  { id: "low-2", from: "53-66", to: "94-66" },
  { id: "low-3", from: "94-66", to: "135-93" },
  { id: "low-4", from: "135-93", to: "176-93" },
  { id: "low-5", from: "176-93", to: "217-93" },
  { id: "low-6", from: "217-93", to: "258-120" },
  { id: "bottom-1", from: "12-120", to: "53-120" },
  { id: "bottom-2", from: "53-120", to: "94-120" },
  { id: "bottom-3", from: "94-120", to: "135-93" },
  { id: "bottom-4", from: "135-93", to: "176-66" },
  { id: "bottom-5", from: "176-66", to: "217-66" },
  { id: "bottom-6", from: "217-66", to: "258-39" },
  { id: "branch-1", from: "53-12", to: "94-39" },
  { id: "branch-2", from: "94-39", to: "135-66" },
  { id: "branch-3", from: "135-39", to: "176-12" },
  { id: "branch-4", from: "176-12", to: "217-39" },
  { id: "branch-5", from: "53-93", to: "94-120" },
  { id: "branch-6", from: "94-120", to: "135-120" },
  { id: "branch-7", from: "135-120", to: "176-93" },
  { id: "branch-8", from: "176-93", to: "217-66" },
];
const curriculumEdgeMap = new Map(curriculumEdges.map(edge => [edge.id, edge]));
const curriculumHighlightRoutes = [
  {
    id: "core-chain",
    edgeIds: ["core-1", "core-2", "core-3", "core-4", "core-5", "core-6"],
  },
  {
    id: "middle-chain",
    edgeIds: ["mid-1", "mid-2", "mid-3", "mid-4", "mid-5", "mid-6"],
  },
  {
    id: "systems-chain",
    edgeIds: ["low-1", "low-2", "low-3", "low-4", "low-5", "low-6"],
  },
  {
    id: "bottom-chain",
    edgeIds: ["bottom-1", "bottom-2", "bottom-3", "bottom-4", "bottom-5", "bottom-6"],
  },
  {
    id: "branch-chain",
    edgeIds: ["core-1", "branch-1", "branch-2", "mid-4", "mid-5", "mid-6"],
  },
];

function getCurriculumEdgeStyle(edge: (typeof curriculumEdges)[number]): CSSProperties {
  const from = curriculumNodeMap.get(edge.from);
  const to = curriculumNodeMap.get(edge.to);

  if (!from || !to) {
    return {};
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    left: `${from.x}px`,
    top: `${from.y}px`,
    width: `${length}px`,
    transform: `translateY(-50%) rotate(${angle}deg)`,
    transformOrigin: "left center",
  };
}

type CurriculumIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function CurriculumIllustration({ appearance = "underwater" }: CurriculumIllustrationProps) {
  const isSurface = appearance === "surface";
  const [highlightedRoute, setHighlightedRoute] = useState(0);
  const [isRouteVisible, setIsRouteVisible] = useState(true);
  const activeRoute = isRouteVisible
    ? (curriculumHighlightRoutes[highlightedRoute] ?? curriculumHighlightRoutes[0])
    : null;
  const activeEdgeIds = new Set(activeRoute?.edgeIds ?? []);
  const highlightedNodes = new Set(
    (activeRoute?.edgeIds ?? []).flatMap(edgeId => {
      const edge = curriculumEdgeMap.get(edgeId);
      return edge ? [edge.from, edge.to] : [];
    })
  );

  useEffect(() => {
    let nextRouteTimeoutId: number | undefined;

    const chooseNextRoute = () => {
      setIsRouteVisible(false);

      nextRouteTimeoutId = window.setTimeout(() => {
        setHighlightedRoute(current => {
          const randomStep = 1 + Math.floor(Math.random() * (curriculumHighlightRoutes.length - 1));
          return (current + randomStep) % curriculumHighlightRoutes.length;
        });
        setIsRouteVisible(true);
      }, 750);
    };

    const intervalId = window.setInterval(chooseNextRoute, 3750);

    return () => {
      window.clearInterval(intervalId);
      if (nextRouteTimeoutId) {
        window.clearTimeout(nextRouteTimeoutId);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "relative h-48 overflow-hidden rounded-2xl border p-2 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
      role="img"
      aria-label="Disciplinas conectadas por pré-requisitos"
    >
      <div className="absolute left-1/2 top-1/2 h-[132px] w-[270px] -translate-x-1/2 -translate-y-1/2">
        {curriculumEdges.map(edge => {
          const isActive = activeEdgeIds.has(edge.id);

          return (
            <div
              key={edge.id}
              className={`absolute h-[1.5px] rounded-full transition-all duration-700 ease-in-out ${
                isActive
                  ? isSurface
                    ? "z-10 bg-blue-500 opacity-95"
                    : "z-10 bg-sky-50 opacity-95"
                  : isSurface
                    ? "z-0 bg-slate-300 opacity-100"
                    : "z-0 bg-sky-200/55 opacity-100"
              }`}
              style={getCurriculumEdgeStyle(edge)}
            />
          );
        })}

        {curriculumNodes.map(node => {
          const isActive = highlightedNodes.has(node.id);

          return (
            <div
              key={node.id}
              className={`absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-700 ease-in-out ${
                isActive
                  ? isSurface
                    ? "border-blue-500 bg-blue-500"
                    : "border-sky-50 bg-sky-50"
                  : isSurface
                    ? "border-slate-400 bg-slate-50"
                    : "border-sky-200/60 bg-sky-900"
              }`}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}
