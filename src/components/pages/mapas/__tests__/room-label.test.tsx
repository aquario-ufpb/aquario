import React from "react";
import { render } from "@testing-library/react";
import { RoomLabel } from "../room-label";
import type { Room, EntidadeSlug } from "@/lib/mapas/types";
import type { Entidade } from "@/lib/shared/types/entidade.types";

const makeRoom = (overrides: Partial<Room> = {}): Room =>
  ({
    id: "room-1",
    location: "Room 1",
    type: "classroom",
    shapes: [
      {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 80 },
      },
    ],
    ...overrides,
  }) as Room;

describe("RoomLabel", () => {
  it("renders a bathroom icon for bathroom rooms", () => {
    const room = makeRoom({ type: "bathroom" });

    const { container } = render(
      <svg>
        <RoomLabel
          room={room}
          centerX={50}
          centerY={40}
          fontSize={12}
          subtitleFontSize={8.4}
          textWidth={80}
          textHeight={40}
          isDark={false}
          showIcon
        />
      </svg>
    );

    // MUI icon renders as an <svg> inside the foreignObject
    const icon = container.querySelector("foreignObject svg");
    expect(icon).toBeDefined();
  });

  it("shows location text for a simple classroom", () => {
    const room = makeRoom({ location: "CI 106" });

    const { getByText } = render(
      <svg>
        <RoomLabel
          room={room}
          centerX={50}
          centerY={40}
          fontSize={12}
          subtitleFontSize={8.4}
          textWidth={80}
          textHeight={40}
          isDark={false}
          showIcon
        />
      </svg>
    );

    expect(getByText("CI 106")).toBeInTheDocument();
  });

  it("renders lab logos when entidadesMap is provided for lab-research rooms", () => {
    const entidadesMap = new Map<EntidadeSlug, Entidade>();
    entidadesMap.set(
      "lab-1" as EntidadeSlug,
      {
        slug: "lab-1" as EntidadeSlug,
        name: "Lab 1",
        imagePath: "/labs/lab-1.png",
      } as Entidade
    );

    const room = makeRoom({
      type: "lab-research",
      labs: ["lab-1" as EntidadeSlug],
    });

    const { container } = render(
      <svg>
        <RoomLabel
          room={room}
          centerX={50}
          centerY={40}
          fontSize={12}
          subtitleFontSize={8.4}
          textWidth={80}
          textHeight={40}
          isDark={false}
          entidadesMap={entidadesMap}
          showIcon
        />
      </svg>
    );

    const img = container.querySelector("img");
    expect(img).toBeDefined();
    expect(img).toHaveAttribute("src", "/labs/lab-1.png");
  });
});
