"use client";

import React, { useState, useEffect } from "react";
import WcIcon from "@mui/icons-material/Wc";
import type { Floor, Room, RoomShape } from "@/lib/maps/types";

type BlueprintViewerProps = {
  floor: Floor;
  onRoomClick: (room: Room) => void;
  isDark: boolean;
};

// Check if two rectangles share an edge
function sharesEdge(shape1: RoomShape, shape2: RoomShape): boolean {
  const { position: p1, size: s1 } = shape1;
  const { position: p2, size: s2 } = shape2;

  const right1 = p1.x + s1.width;
  const bottom1 = p1.y + s1.height;
  const right2 = p2.x + s2.width;
  const bottom2 = p2.y + s2.height;

  // Check if shapes are adjacent (touching) and overlap along the shared edge
  // Horizontal adjacency: shapes share a vertical edge (left/right)
  const horizontalAdjacent =
    (right1 === p2.x || right2 === p1.x) &&
    // They must overlap vertically (not just touch at a corner)
    Math.max(p1.y, p2.y) < Math.min(bottom1, bottom2);

  // Vertical adjacency: shapes share a horizontal edge (top/bottom)
  const verticalAdjacent =
    (bottom1 === p2.y || bottom2 === p1.y) &&
    // They must overlap horizontally (not just touch at a corner)
    Math.max(p1.x, p2.x) < Math.min(right1, right2);

  return horizontalAdjacent || verticalAdjacent;
}

// Get the overlapping segments of an edge that are shared with other shapes
function getSharedSegments(
  shape: RoomShape,
  edge: "top" | "bottom" | "left" | "right",
  allShapes: RoomShape[]
): Array<{ start: number; end: number }> {
  const { position: p1, size: s1 } = shape;
  const right1 = p1.x + s1.width;
  const bottom1 = p1.y + s1.height;
  const sharedSegments: Array<{ start: number; end: number }> = [];

  allShapes.forEach(otherShape => {
    if (otherShape === shape) {
      return;
    }
    if (!sharesEdge(shape, otherShape)) {
      return;
    }

    const { position: p2, size: s2 } = otherShape;
    const right2 = p2.x + s2.width;
    const bottom2 = p2.y + s2.height;

    switch (edge) {
      case "top":
        // Shape's top edge - check if another shape's bottom edge touches it
        if (bottom2 === p1.y) {
          const overlapStart = Math.max(p1.x, p2.x);
          const overlapEnd = Math.min(right1, right2);
          if (overlapStart < overlapEnd) {
            sharedSegments.push({ start: overlapStart, end: overlapEnd });
          }
        }
        break;
      case "bottom":
        // Shape's bottom edge - check if another shape's top edge touches it
        if (bottom1 === p2.y) {
          const overlapStart = Math.max(p1.x, p2.x);
          const overlapEnd = Math.min(right1, right2);
          if (overlapStart < overlapEnd) {
            sharedSegments.push({ start: overlapStart, end: overlapEnd });
          }
        }
        break;
      case "left":
        // Shape's left edge - check if another shape's right edge touches it
        if (right2 === p1.x) {
          const overlapStart = Math.max(p1.y, p2.y);
          const overlapEnd = Math.min(bottom1, bottom2);
          if (overlapStart < overlapEnd) {
            sharedSegments.push({ start: overlapStart, end: overlapEnd });
          }
        }
        break;
      case "right":
        // Shape's right edge - check if another shape's left edge touches it
        if (right1 === p2.x) {
          const overlapStart = Math.max(p1.y, p2.y);
          const overlapEnd = Math.min(bottom1, bottom2);
          if (overlapStart < overlapEnd) {
            sharedSegments.push({ start: overlapStart, end: overlapEnd });
          }
        }
        break;
    }
  });

  return sharedSegments;
}

// Get the non-shared segments of an edge (gaps between shared portions)
function getNonSharedSegments(
  edgeStart: number,
  edgeEnd: number,
  sharedSegments: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (sharedSegments.length === 0) {
    return [{ start: edgeStart, end: edgeEnd }];
  }

  // Sort shared segments by start position
  const sorted = [...sharedSegments].sort((a, b) => a.start - b.start);

  // Merge overlapping shared segments
  const merged: Array<{ start: number; end: number }> = [];
  for (const seg of sorted) {
    if (merged.length === 0 || merged[merged.length - 1].end < seg.start) {
      merged.push({ ...seg });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, seg.end);
    }
  }

  // Calculate gaps (non-shared segments)
  const gaps: Array<{ start: number; end: number }> = [];
  let current = edgeStart;

  for (const seg of merged) {
    if (current < seg.start) {
      gaps.push({ start: current, end: seg.start });
    }
    current = Math.max(current, seg.end);
  }

  if (current < edgeEnd) {
    gaps.push({ start: current, end: edgeEnd });
  }

  return gaps;
}

// Calculate room colors based on state
function getRoomColors(
  isCorridor: boolean,
  isHovered: boolean,
  isDark: boolean
): { fillColor: string; strokeColor: string } {
  const fillColor = isCorridor
    ? isDark
      ? "rgba(59, 130, 246, 0.15)"
      : "rgba(59, 130, 246, 0.13)"
    : isHovered
      ? isDark
        ? "rgba(59, 130, 246, 0.6)"
        : "rgba(59, 130, 246, 0.4)"
      : isDark
        ? "rgba(59, 130, 246, 0.2)"
        : "rgba(59, 130, 246, 0.15)";

  const strokeColor = isHovered
    ? isDark
      ? "rgb(59, 130, 246)"
      : "rgb(37, 99, 235)"
    : isDark
      ? "rgba(59, 130, 246, 0.5)"
      : "rgba(59, 130, 246, 0.3)";

  return { fillColor, strokeColor };
}

// Calculate room center point (average of all shapes)
function getRoomCenter(room: Room): { centerX: number; centerY: number } {
  const centerX =
    room.shapes.reduce((sum, shape) => sum + shape.position.x + shape.size.width / 2, 0) /
    room.shapes.length;
  const centerY =
    room.shapes.reduce((sum, shape) => sum + shape.position.y + shape.size.height / 2, 0) /
    room.shapes.length;

  return { centerX, centerY };
}

// Calculate text sizing and dimensions
function getTextDimensions(room: Room): {
  fontSize: number;
  textWidth: number;
  textHeight: number;
} {
  const minWidth = Math.min(...room.shapes.map(shape => shape.size.width));
  const minHeight = Math.min(...room.shapes.map(shape => shape.size.height));
  const textToDisplay = room.title || room.name;

  // Estimate character width (roughly 0.6 * fontSize for most fonts)
  const baseFontSize = 12;
  const charWidth = baseFontSize * 0.6;
  const maxChars = Math.floor(minWidth / charWidth);
  const textLength = textToDisplay.length;

  // Scale down if text is too long, but don't go below 8px
  const fontSize = Math.max(
    8,
    Math.min(baseFontSize, (maxChars / textLength) * baseFontSize * 0.9)
  );

  // Calculate text container dimensions (leave some padding)
  const textWidth = Math.max(minWidth * 0.9, 40);
  const textHeight = room.title ? minHeight * 0.7 : minHeight * 0.5;

  return { fontSize, textWidth, textHeight };
}

// Calculate blueprint scale based on viewport
function getBlueprintScale(
  blueprint: { width: number; height: number },
  windowWidth: number
): { scale: number; scaledWidth: number; scaledHeight: number } {
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const maxWidth = isDesktop ? 1400 : isTablet ? 1400 : 1000;
  const maxHeight = isDesktop ? 600 : isTablet ? 1000 : 700;

  const scaleX = maxWidth / blueprint.width;
  const scaleY = maxHeight / blueprint.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = blueprint.width * scale;
  const scaledHeight = blueprint.height * scale;

  return { scale, scaledWidth, scaledHeight };
}

// Render room edges (non-shared segments only)
function renderRoomEdges(
  shape: RoomShape,
  shapeIndex: number,
  allShapes: RoomShape[],
  strokeColor: string,
  strokeWidth: number
): React.ReactNode {
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

// Render room label (text or icon)
function renderRoomLabel(
  room: Room,
  centerX: number,
  centerY: number,
  fontSize: number,
  textWidth: number,
  textHeight: number,
  isDark: boolean
): React.ReactNode {
  if (room.metadata?.type === "bathroom") {
    return (
      <foreignObject
        x={centerX - 8}
        y={centerY - 14}
        width="24"
        height="24"
        className="pointer-events-none"
      >
        <WcIcon
          sx={{
            fontSize: 16,
            color: isDark ? "#C8E6FA" : "#0e3a6c",
          }}
        />
      </foreignObject>
    );
  }

  const textColor = isDark ? "#C8E6FA" : "#0e3a6c";
  const textStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center" as const,
    color: textColor,
    lineHeight: "1.2",
    wordWrap: "break-word" as const,
    overflowWrap: "break-word" as const,
    overflow: "hidden" as const,
  };

  if (room.title) {
    return (
      <foreignObject
        x={centerX - textWidth / 2}
        y={centerY - textHeight / 2}
        width={textWidth}
        height={textHeight}
        className="pointer-events-none"
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            color: textColor,
            lineHeight: "1.2",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            overflow: "hidden",
          }}
        >
          {/* Display title */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 600,
              marginBottom: "2px",
            }}
          >
            {room.title}
          </div>
          {/* Display name as subtitle */}
          <div
            style={{
              fontSize: `${fontSize * 0.7}px`,
              fontWeight: 400,
              marginTop: "2px",
            }}
          >
            {room.name}
          </div>
        </div>
      </foreignObject>
    );
  }

  // Display name only
  return (
    <foreignObject
      x={centerX - textWidth / 2}
      y={centerY - textHeight / 2}
      width={textWidth}
      height={textHeight}
      className="pointer-events-none"
    >
      <div
        style={{
          ...textStyle,
          fontSize: `${fontSize}px`,
          fontWeight: 600,
        }}
      >
        {room.name}
      </div>
    </foreignObject>
  );
}

export default function BlueprintViewer({ floor, onRoomClick, isDark }: BlueprintViewerProps) {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  const { blueprint, rooms } = floor;

  // Track window width for responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const { scaledWidth, scaledHeight } = getBlueprintScale(blueprint, windowWidth);

  return (
    <div className="w-full overflow-auto">
      <div className="flex justify-center items-center" style={{ minHeight: "100%" }}>
        <svg
          width={scaledWidth}
          height={scaledHeight}
          viewBox={`0 0 ${blueprint.width} ${blueprint.height}`}
          className="border rounded"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
          }}
        >
          {/* Background image if available */}
          {blueprint.backgroundImage && (
            <image
              href={blueprint.backgroundImage}
              x="0"
              y="0"
              width={blueprint.width}
              height={blueprint.height}
              opacity={0.3}
            />
          )}

          {/* Render rooms */}
          {rooms.map(room => {
            const isCorridor = room.metadata?.type === "corridor";
            const isHovered = hoveredRoomId === room.id;
            const { fillColor, strokeColor } = getRoomColors(isCorridor, isHovered, isDark);
            const { centerX, centerY } = getRoomCenter(room);
            const { fontSize, textWidth, textHeight } = getTextDimensions(room);

            return (
              <g key={room.id}>
                {/* Render all shapes for this room with fill only */}
                {room.shapes.map((shape, shapeIndex) => (
                  <rect
                    key={shapeIndex}
                    x={shape.position.x}
                    y={shape.position.y}
                    width={shape.size.width}
                    height={shape.size.height}
                    fill={fillColor}
                    stroke="none"
                    className={isCorridor ? "pointer-events-none" : "cursor-pointer transition-all"}
                    onClick={isCorridor ? undefined : () => onRoomClick(room)}
                    onMouseEnter={isCorridor ? undefined : () => setHoveredRoomId(room.id)}
                    onMouseLeave={isCorridor ? undefined : () => setHoveredRoomId(null)}
                  />
                ))}
                {/* Render only non-shared edge segments as strokes - skip for corridors */}
                {!isCorridor &&
                  room.shapes.map((shape, shapeIndex) =>
                    renderRoomEdges(shape, shapeIndex, room.shapes, strokeColor, isHovered ? 2 : 1)
                  )}
                {/* Room label (centered on all shapes) - skip for corridors */}
                {!isCorridor &&
                  renderRoomLabel(room, centerX, centerY, fontSize, textWidth, textHeight, isDark)}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
