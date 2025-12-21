"use client";

import React from "react";
import type { RoomShape } from "@/lib/mapas/types";
import { getNonSharedSegments, getSharedSegments } from "./blueprint-utils";

type RoomShapeEdgesProps = {
  shape: RoomShape;
  shapeIndex: number;
  allShapes: RoomShape[];
  strokeColor: string;
  strokeWidth: number;
};

export function RoomShapeEdges({
  shape,
  shapeIndex,
  allShapes,
  strokeColor,
  strokeWidth,
}: RoomShapeEdgesProps) {
  const { position: p, size: s } = shape;
  const right = p.x + s.width;
  const bottom = p.y + s.height;

  // Get shared segments for each edge
  const topShared = getSharedSegments(shape, "top", allShapes);
  const bottomShared = getSharedSegments(shape, "bottom", allShapes);
  const leftShared = getSharedSegments(shape, "left", allShapes);
  const rightShared = getSharedSegments(shape, "right", allShapes);

  // Calculate non-shared segments (gaps)
  const topGaps = getNonSharedSegments(p.x, right, topShared);
  const bottomGaps = getNonSharedSegments(p.x, right, bottomShared);
  const leftGaps = getNonSharedSegments(p.y, bottom, leftShared);
  const rightGaps = getNonSharedSegments(p.y, bottom, rightShared);

  return (
    <g key={`edges-${shapeIndex}`}>
      {/* Top edge - render only non-shared segments */}
      {topGaps.map((gap, gapIndex) => (
        <line
          key={`top-${gapIndex}`}
          x1={gap.start}
          y1={p.y}
          x2={gap.end}
          y2={p.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="pointer-events-none"
        />
      ))}
      {/* Bottom edge - render only non-shared segments */}
      {bottomGaps.map((gap, gapIndex) => (
        <line
          key={`bottom-${gapIndex}`}
          x1={gap.start}
          y1={bottom}
          x2={gap.end}
          y2={bottom}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="pointer-events-none"
        />
      ))}
      {/* Left edge - render only non-shared segments */}
      {leftGaps.map((gap, gapIndex) => (
        <line
          key={`left-${gapIndex}`}
          x1={p.x}
          y1={gap.start}
          x2={p.x}
          y2={gap.end}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="pointer-events-none"
        />
      ))}
      {/* Right edge - render only non-shared segments */}
      {rightGaps.map((gap, gapIndex) => (
        <line
          key={`right-${gapIndex}`}
          x1={right}
          y1={gap.start}
          x2={right}
          y2={gap.end}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="pointer-events-none"
        />
      ))}
    </g>
  );
}
