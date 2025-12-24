/**
 * Unit tests for BlueprintViewer component
 * Tests edge-sharing logic for multi-shape rooms (e.g., L-shaped rooms)
 */

// Mock the entidades provider to avoid require.context issues
jest.mock("@/lib/client/api/entidades_providers/local-file-entidades-provider", () => {
  return {
    LocalFileEntidadesProvider: jest.requireActual(
      "@/lib/client/api/entidades_providers/__mocks__/local-file-entidades-provider"
    ).LocalFileEntidadesProvider,
  };
});

import { render } from "@testing-library/react";
import BlueprintViewer from "../blueprint-viewer";
import type { Floor, RoomShape, Room } from "@/lib/client/mapas/types";

// Helper to create a test floor
const createTestFloor = (rooms: Floor["rooms"]): Floor => ({
  id: "test-floor",
  name: "Test Floor",
  level: 1,
  blueprint: {
    width: 500,
    height: 400,
  },
  rooms,
});

// Helper to create a simple room
const createRoom = (
  id: string,
  location: string,
  shapes: RoomShape[],
  type: Room["type"] = "classroom"
): Room => {
  const baseRoom = {
    id,
    location,
    shapes,
    type,
  };

  // Add type-specific properties
  if (type === "corridor") {
    return { ...baseRoom, type: "corridor" };
  }

  return { ...baseRoom, type: "classroom" };
};

describe("BlueprintViewer - Edge Sharing Logic", () => {
  describe("L-shaped room (CI 106 example)", () => {
    it("should hide only the shared portion of the bottom edge, not the entire edge", () => {
      // CI 106: Large rectangle (0,0,115,115) + small rectangle (0,115,55,20)
      // The large rectangle's bottom edge goes from x=0 to x=115
      // The shared portion is x=0 to x=55 (where it touches the small rectangle)
      // The non-shared portion x=55 to x=115 should still be visible

      const lShapedRoom = createRoom("ci-106", "CI 106", [
        { position: { x: 0, y: 0 }, size: { width: 115, height: 115 } }, // Large rectangle
        { position: { x: 0, y: 115 }, size: { width: 55, height: 20 } }, // Small rectangle
      ]);

      const floor = createTestFloor([lShapedRoom]);
      const mockOnRoomClick = jest.fn();

      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      // Get all line elements (edges)
      const lines = container.querySelectorAll("line");
      const bottomEdges = Array.from(lines).filter(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        // Bottom edge of large rectangle is at y=115
        return y1 === 115 && y2 === 115;
      });

      // Should have at least one bottom edge line (the non-shared portion)
      expect(bottomEdges.length).toBeGreaterThan(0);

      // Check that there's a line segment for the non-shared portion (x=55 to x=115)
      const nonSharedSegment = bottomEdges.find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        // Should have a segment starting at or after x=55
        return x1 >= 55 && x2 > x1;
      });

      expect(nonSharedSegment).toBeDefined();
    });

    it("should hide the shared portion of the bottom edge", () => {
      const lShapedRoom = createRoom("ci-106", "CI 106", [
        { position: { x: 0, y: 0 }, size: { width: 115, height: 115 } },
        { position: { x: 0, y: 115 }, size: { width: 55, height: 20 } },
      ]);

      const floor = createTestFloor([lShapedRoom]);
      const mockOnRoomClick = jest.fn();

      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const lines = container.querySelectorAll("line");
      const bottomEdges = Array.from(lines).filter(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        return y1 === 115 && y2 === 115;
      });

      // Should NOT have a line segment covering the entire bottom edge (x=0 to x=115)
      const fullBottomEdge = bottomEdges.find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 0 && x2 === 115;
      });

      expect(fullBottomEdge).toBeUndefined();
    });
  });

  describe("Simple rectangular room", () => {
    it("should render all four edges when no shapes share edges", () => {
      const simpleRoom = createRoom("room-1", "Room 1", [
        { position: { x: 10, y: 10 }, size: { width: 100, height: 80 } },
      ]);

      const floor = createTestFloor([simpleRoom]);
      const mockOnRoomClick = jest.fn();

      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const lines = container.querySelectorAll("line");

      // Should have 4 edges (top, bottom, left, right)
      expect(lines.length).toBeGreaterThanOrEqual(4);

      // Check for top edge (y=10)
      const topEdge = Array.from(lines).find(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        return y1 === 10 && y2 === 10;
      });
      expect(topEdge).toBeDefined();

      // Check for bottom edge (y=90)
      const bottomEdge = Array.from(lines).find(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        return y1 === 90 && y2 === 90;
      });
      expect(bottomEdge).toBeDefined();

      // Check for left edge (x=10)
      const leftEdge = Array.from(lines).find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 10 && x2 === 10;
      });
      expect(leftEdge).toBeDefined();

      // Check for right edge (x=110)
      const rightEdge = Array.from(lines).find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 110 && x2 === 110;
      });
      expect(rightEdge).toBeDefined();
    });
  });

  describe("Multiple shapes with shared edges", () => {
    it("should handle vertical adjacency correctly", () => {
      // Two rectangles stacked vertically, sharing a horizontal edge
      const stackedRoom = createRoom("stacked", "Stacked Room", [
        { position: { x: 0, y: 0 }, size: { width: 100, height: 50 } }, // Top rectangle
        { position: { x: 0, y: 50 }, size: { width: 100, height: 50 } }, // Bottom rectangle
      ]);

      const floor = createTestFloor([stackedRoom]);
      const mockOnRoomClick = jest.fn();

      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const lines = container.querySelectorAll("line");

      // The shared edge at y=50 should be hidden
      // Top rectangle's bottom edge should be hidden
      // Bottom rectangle's top edge should be hidden

      // Check that there's no line at the shared edge (y=50) for the full width
      const sharedEdgeLines = Array.from(lines).filter(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        return y1 === 50 && y2 === 50;
      });

      // The shared portion (x=0 to x=100) should not be rendered
      const fullSharedEdge = sharedEdgeLines.find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 0 && x2 === 100;
      });

      expect(fullSharedEdge).toBeUndefined();
    });

    it("should handle horizontal adjacency correctly", () => {
      // Two rectangles side by side, sharing a vertical edge
      const sideBySideRoom = createRoom("side-by-side", "Side by Side Room", [
        { position: { x: 0, y: 0 }, size: { width: 50, height: 100 } }, // Left rectangle
        { position: { x: 50, y: 0 }, size: { width: 50, height: 100 } }, // Right rectangle
      ]);

      const floor = createTestFloor([sideBySideRoom]);
      const mockOnRoomClick = jest.fn();

      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const lines = container.querySelectorAll("line");

      // The shared edge at x=50 should be hidden
      // Left rectangle's right edge should be hidden
      // Right rectangle's left edge should be hidden

      // Check that there's no line at the shared edge (x=50) for the full height
      const sharedEdgeLines = Array.from(lines).filter(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 50 && x2 === 50;
      });

      // The shared portion (y=0 to y=100) should not be rendered
      const fullSharedEdge = sharedEdgeLines.find(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        return y1 === 0 && y2 === 100;
      });

      expect(fullSharedEdge).toBeUndefined();
    });
  });

  describe("Partial edge sharing", () => {
    it("should only hide the overlapping portion when shapes partially share an edge", () => {
      // Large rectangle with a smaller rectangle attached to part of its bottom edge
      // Large: (0,0,100,100), Small: (20,100,40,20)
      // Shared portion: x=20 to x=60 on the bottom edge of large rectangle
      // Non-shared portions: x=0 to x=20 and x=60 to x=100 should be visible

      const partialSharedRoom = createRoom("partial", "Partial Shared Room", [
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }, // Large rectangle
        { position: { x: 20, y: 100 }, size: { width: 40, height: 20 } }, // Small rectangle
      ]);

      const floor = createTestFloor([partialSharedRoom]);
      const mockOnRoomClick = jest.fn();

      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const lines = container.querySelectorAll("line");
      const bottomEdges = Array.from(lines).filter(line => {
        const y1 = parseFloat(line.getAttribute("y1") || "0");
        const y2 = parseFloat(line.getAttribute("y2") || "0");
        return y1 === 100 && y2 === 100;
      });

      // Should have segments for the non-shared portions
      // Left gap: x=0 to x=20
      const leftGap = bottomEdges.find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 0 && x2 === 20;
      });

      // Right gap: x=60 to x=100
      const rightGap = bottomEdges.find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 60 && x2 === 100;
      });

      expect(leftGap).toBeDefined();
      expect(rightGap).toBeDefined();

      // Should NOT have a line covering the shared portion (x=20 to x=60)
      const sharedPortion = bottomEdges.find(line => {
        const x1 = parseFloat(line.getAttribute("x1") || "0");
        const x2 = parseFloat(line.getAttribute("x2") || "0");
        return x1 === 20 && x2 === 60;
      });

      expect(sharedPortion).toBeUndefined();
    });
  });

  describe("Component rendering", () => {
    it("should render the blueprint with correct dimensions", () => {
      const floor = createTestFloor([
        createRoom("room-1", "Room 1", [
          { position: { x: 10, y: 10 }, size: { width: 100, height: 80 } },
        ]),
      ]);

      const mockOnRoomClick = jest.fn();
      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeDefined();
      expect(svg).toHaveAttribute("viewBox", expect.stringContaining("500"));
      expect(svg).toHaveAttribute("viewBox", expect.stringContaining("400"));
    });

    it("should call onRoomClick when a room is clicked", () => {
      const room = createRoom("room-1", "Room 1", [
        { position: { x: 10, y: 10 }, size: { width: 100, height: 80 } },
      ]);
      const floor = createTestFloor([room]);

      const mockOnRoomClick = jest.fn();
      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      // Find the room rectangle and click it
      const rects = container.querySelectorAll("rect");
      const roomRect = Array.from(rects).find(rect => {
        const x = parseFloat(rect.getAttribute("x") || "0");
        const y = parseFloat(rect.getAttribute("y") || "0");
        return x === 10 && y === 10;
      });

      expect(roomRect).toBeDefined();
      if (roomRect) {
        roomRect.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(mockOnRoomClick).toHaveBeenCalledWith(room);
      }
    });

    it("should not make corridors clickable", () => {
      const corridor = createRoom(
        "corridor",
        "Corridor",
        [{ position: { x: 0, y: 0 }, size: { width: 100, height: 20 } }],
        "corridor"
      );

      const floor = createTestFloor([corridor]);
      const mockOnRoomClick = jest.fn();
      const { container } = render(
        <BlueprintViewer floor={floor} onRoomClick={mockOnRoomClick} isDark={false} />
      );

      const rects = container.querySelectorAll("rect");
      const corridorRect = Array.from(rects).find(rect => {
        const x = parseFloat(rect.getAttribute("x") || "0");
        const y = parseFloat(rect.getAttribute("y") || "0");
        return x === 0 && y === 0;
      });

      expect(corridorRect).toBeDefined();
      if (corridorRect) {
        // Check that pointer-events is disabled
        expect(corridorRect).toHaveClass("pointer-events-none");

        // Click should not trigger onRoomClick
        corridorRect.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(mockOnRoomClick).not.toHaveBeenCalled();
      }
    });
  });
});
