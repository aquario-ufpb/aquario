"use client";

import type { Floor, Room, RoomShape, EntidadeSlug } from "@/lib/mapas/types";
import type { Entidade } from "@/lib/shared/types/entidade.types";
import {
  formatLabsForDisplay,
  formatProfessorsForDisplay,
  isLabResearch,
  isProfessorOffice,
} from "@/lib/mapas/utils";

// Check if two rectangles share an edge
export function sharesEdge(shape1: RoomShape, shape2: RoomShape): boolean {
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
export function getSharedSegments(
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
export function getNonSharedSegments(
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
export function getRoomColors(
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
export function getRoomCenter(room: Room): { centerX: number; centerY: number } {
  if (room.shapes.length === 0) {
    return { centerX: 0, centerY: 0 };
  }

  // Use the largest shape (by area) as the anchor for the label/icon center
  const largestShape = room.shapes.reduce((largest, current) => {
    const largestArea = largest.size.width * largest.size.height;
    const currentArea = current.size.width * current.size.height;
    return currentArea > largestArea ? current : largest;
  });

  const centerX = largestShape.position.x + largestShape.size.width / 2;
  const centerY = largestShape.position.y + largestShape.size.height / 2;

  return { centerX, centerY };
}

// Calculate text sizing and dimensions
export function getTextDimensions(
  room: Room,
  entidadesMap?: Map<EntidadeSlug, Entidade>
): {
  fontSize: number;
  subtitleFontSize: number;
  textWidth: number;
  textHeight: number;
  showIcon: boolean;
} {
  // Calculate bounding box of all shapes (for multi-shape rooms)
  const minY = Math.min(...room.shapes.map(shape => shape.position.y));
  const maxY = Math.max(...room.shapes.map(shape => shape.position.y + shape.size.height));

  const boundingHeight = maxY - minY;

  // Use minimum width of individual shapes for text width (to ensure it fits in narrow parts)
  const minWidth = Math.min(...room.shapes.map(shape => shape.size.width));
  // Use labs if available (for lab research), then professors (first names), otherwise use location
  const hasLabs = isLabResearch(room) && room.labs && room.labs.length > 0;
  const hasProfessorsCheck =
    isProfessorOffice(room) && room.professors && room.professors.length > 0;
  const textToDisplay =
    hasLabs && isLabResearch(room) && room.labs
      ? formatLabsForDisplay(room.labs, entidadesMap)
      : hasProfessorsCheck && isProfessorOffice(room) && room.professors
        ? formatProfessorsForDisplay(room.professors)
        : room.location;

  // Estimate character width (roughly 0.6 * fontSize for most fonts)
  const baseFontSize = 12;
  const subtitleFontSize = 8.4; // 70% of 12px - fixed size for subtitle
  const charWidth = baseFontSize * 0.6;
  const maxChars = Math.floor(minWidth / charWidth);
  const textLength = textToDisplay.length;

  // Scale down if text is too long, but don't go below 8px
  const fontSize = Math.max(
    8,
    Math.min(baseFontSize, (maxChars / textLength) * baseFontSize * 0.9)
  );

  // Calculate text container dimensions
  // Use bounding box height for better sizing in multi-shape rooms
  const textWidth = Math.max(minWidth * 0.9, 40);
  // Account for icon height if there's an icon, plus text lines
  const hasIcon = room.type !== "bathroom" && room.type !== "corridor";
  // Check if we'll show logos (for labs) or icon.
  // Only consider logos when we have entidades and at least one has an imagePath.
  const willShowLogos =
    hasLabs &&
    entidadesMap &&
    room.labs?.some(slug => {
      const entidade = entidadesMap.get(slug);
      return entidade && Boolean(entidade.imagePath);
    });
  const iconHeight = willShowLogos
    ? Math.min(fontSize * 1.5, 32) + 4 // logo height + margin
    : hasIcon
      ? fontSize * 1.2 + 4 // icon size + margin
      : 0;
  // Determine if we'll show subtitle (room location when there are labs/professors)
  const willShowSubtitle = hasLabs || hasProfessorsCheck;
  const textLinesHeight = willShowSubtitle
    ? fontSize + subtitleFontSize + 6 // title + subtitle (fixed 8.4px) + margins
    : fontSize + 4; // name only + margin
  const textHeight = Math.max(boundingHeight * 0.6, iconHeight + textLinesHeight);

  // Only show icon when there's enough vertical space in the room itself
  const canFitIcon = boundingHeight >= iconHeight + textLinesHeight + 15;
  const showIcon = hasIcon && !willShowLogos && canFitIcon;

  return { fontSize, subtitleFontSize, textWidth, textHeight, showIcon };
}

// Calculate blueprint scale based on viewport
export function getBlueprintScale(
  blueprint: Floor["blueprint"],
  windowWidth: number,
  options?: {
    compact?: boolean;
  }
): { scale: number; scaledWidth: number; scaledHeight: number } {
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  let maxWidth = isDesktop ? 1400 : isTablet ? 1400 : 1000;
  let maxHeight = isDesktop ? 600 : isTablet ? 1000 : 700;

  if (options?.compact) {
    maxWidth = isDesktop ? 700 : isTablet ? 650 : 550;
    maxHeight = isDesktop ? 350 : isTablet ? 400 : 350;
  }

  const scaleX = maxWidth / blueprint.width;
  const scaleY = maxHeight / blueprint.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = blueprint.width * scale;
  const scaledHeight = blueprint.height * scale;

  return { scale, scaledWidth, scaledHeight };
}
