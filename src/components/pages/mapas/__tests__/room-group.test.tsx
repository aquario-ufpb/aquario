import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { RoomGroup } from "../room-group";
import type { Room } from "@/lib/mapas/types";

const makeRoom = (overrides: Partial<Room> = {}): Room =>
  ({
    id: "room-1",
    location: "Room 1",
    type: "classroom",
    shapes: [
      {
        position: { x: 10, y: 20 },
        size: { width: 100, height: 80 },
      },
    ],
    ...overrides,
  }) as Room;

describe("RoomGroup", () => {
  it("calls onClick for non-corridor rooms", () => {
    const room = makeRoom();
    const handleClick = jest.fn();
    const handleHover = jest.fn();

    const { container } = render(
      <svg>
        <RoomGroup
          room={room}
          isDark={false}
          isHovered={false}
          onHover={handleHover}
          onClick={handleClick}
        />
      </svg>
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeDefined();
    if (!rect) {
      return;
    }

    fireEvent.click(rect);
    expect(handleClick).toHaveBeenCalledWith(room);
  });

  it("does not call onClick for corridors and uses pointer-events-none", () => {
    const room = makeRoom({
      id: "corridor",
      type: "corridor",
      location: "Corridor",
    });
    const handleClick = jest.fn();
    const handleHover = jest.fn();

    const { container } = render(
      <svg>
        <RoomGroup
          room={room}
          isDark={false}
          isHovered={false}
          onHover={handleHover}
          onClick={handleClick}
        />
      </svg>
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeDefined();
    if (!rect) {
      return;
    }

    expect(rect).toHaveClass("pointer-events-none");

    fireEvent.click(rect);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("calls onHover on mouse enter and leave", () => {
    const room = makeRoom();
    const handleClick = jest.fn();
    const handleHover = jest.fn();

    const { container } = render(
      <svg>
        <RoomGroup
          room={room}
          isDark={false}
          isHovered={false}
          onHover={handleHover}
          onClick={handleClick}
        />
      </svg>
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeDefined();
    if (!rect) {
      return;
    }

    fireEvent.mouseEnter(rect);
    fireEvent.mouseLeave(rect);

    expect(handleHover).toHaveBeenCalledWith(room.id);
    expect(handleHover).toHaveBeenCalledWith(null);
  });
});
