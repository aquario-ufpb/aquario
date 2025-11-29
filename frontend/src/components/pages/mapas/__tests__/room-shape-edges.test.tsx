import React from "react";
import { render } from "@testing-library/react";
import { RoomShapeEdges } from "../room-shape-edges";
import type { RoomShape } from "@/lib/mapas/types";

const makeShape = (x: number, y: number, width: number, height: number): RoomShape => ({
  position: { x, y },
  size: { width, height },
});

describe("RoomShapeEdges", () => {
  it("renders only non-shared bottom edge segments for an L-shaped room", () => {
    const large = makeShape(0, 0, 115, 115);
    const small = makeShape(0, 115, 55, 20);
    const allShapes = [large, small];

    const { container } = render(
      <svg>
        <RoomShapeEdges
          shape={large}
          shapeIndex={0}
          allShapes={allShapes}
          strokeColor="black"
          strokeWidth={1}
        />
      </svg>
    );

    const lines = container.querySelectorAll("line");
    const bottomEdges = Array.from(lines).filter(line => {
      const y1 = parseFloat(line.getAttribute("y1") || "0");
      const y2 = parseFloat(line.getAttribute("y2") || "0");
      return y1 === 115 && y2 === 115;
    });

    // Should have a segment for the non-shared part of the large rectangle's bottom edge
    const nonSharedSegment = bottomEdges.find(line => {
      const x1 = parseFloat(line.getAttribute("x1") || "0");
      const x2 = parseFloat(line.getAttribute("x2") || "0");
      return x1 === 55 && x2 === 115;
    });

    // Should not render a line covering the shared part (0 to 55)
    const sharedSegment = bottomEdges.find(line => {
      const x1 = parseFloat(line.getAttribute("x1") || "0");
      const x2 = parseFloat(line.getAttribute("x2") || "0");
      return x1 === 0 && x2 === 55;
    });

    expect(nonSharedSegment).toBeDefined();
    expect(sharedSegment).toBeUndefined();
  });
});
