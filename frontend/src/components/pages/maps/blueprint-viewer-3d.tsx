"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Floor, Room, RoomShape } from "@/lib/maps/types";
import WcIcon from "@mui/icons-material/Wc";

type BlueprintViewer3DProps = {
  floor: Floor;
  onRoomClick: (room: Room) => void;
  isDark: boolean;
};

type RoomMeshProps = {
  room: Room;
  onClick: () => void;
  isDark: boolean;
  floorHeight: number;
};

function getRoomColor(room: Room, isHovered: boolean, isDark: boolean): string {
  const isCorridor = room.metadata?.type === "corridor";

  if (isCorridor) {
    return isDark ? "#1e3a5f" : "#93c5fd";
  }

  if (isHovered) {
    return isDark ? "#3b82f6" : "#2563eb";
  }

  switch (room.metadata?.type) {
    case "classroom":
      return isDark ? "#4ade80" : "#22c55e";
    case "lab (aula)":
    case "lab (pesquisa)":
      return isDark ? "#f59e0b" : "#f97316";
    case "office":
      return isDark ? "#8b5cf6" : "#7c3aed";
    case "library":
      return isDark ? "#ec4899" : "#db2777";
    case "bathroom":
      return isDark ? "#06b6d4" : "#0891b2";
    case "stairs":
      return isDark ? "#6b7280" : "#9ca3af";
    case "shared-space":
      return isDark ? "#eab308" : "#facc15";
    default:
      return isDark ? "#3b82f6" : "#60a5fa";
  }
}

function getRoomCenter(shapes: RoomShape[]): { x: number; y: number } {
  const totalX = shapes.reduce((sum, shape) => sum + shape.position.x + shape.size.width / 2, 0);
  const totalY = shapes.reduce((sum, shape) => sum + shape.position.y + shape.size.height / 2, 0);
  return {
    x: totalX / shapes.length,
    y: totalY / shapes.length,
  };
}

function RoomMesh({ room, onClick, isDark, floorHeight }: RoomMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isCorridor = room.metadata?.type === "corridor";

  const color = getRoomColor(room, hovered, isDark);
  const center = getRoomCenter(room.shapes);

  const roomGeometries = useMemo(() => {
    return room.shapes.map(shape => {
      const geometry = new THREE.BoxGeometry(shape.size.width, floorHeight, shape.size.height);
      return {
        geometry,
        position: [
          shape.position.x + shape.size.width / 2,
          floorHeight / 2,
          shape.position.y + shape.size.height / 2,
        ] as [number, number, number],
      };
    });
  }, [room.shapes, floorHeight]);

  useFrame(() => {
    if (meshRef.current && hovered && !isCorridor) {
      meshRef.current.position.y = Math.sin(Date.now() * 0.003) * 2 + floorHeight / 2;
    } else if (meshRef.current) {
      meshRef.current.position.y = floorHeight / 2;
    }
  });

  return (
    <group ref={meshRef}>
      {roomGeometries.map((geo, index) => (
        <mesh
          key={index}
          geometry={geo.geometry}
          position={geo.position}
          onClick={isCorridor ? undefined : onClick}
          onPointerOver={isCorridor ? undefined : () => setHovered(true)}
          onPointerOut={isCorridor ? undefined : () => setHovered(false)}
        >
          <meshStandardMaterial
            color={color}
            transparent
            opacity={isCorridor ? 0.3 : hovered ? 0.9 : 0.8}
            emissive={hovered ? color : "#000000"}
            emissiveIntensity={hovered ? 0.3 : 0}
          />
        </mesh>
      ))}

      {!isCorridor && (
        <Html
          position={[center.x, floorHeight + 5, center.y]}
          center
          distanceFactor={15}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              background: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
              color: isDark ? "#C8E6FA" : "#0e3a6c",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              whiteSpace: "nowrap",
              border: `1px solid ${isDark ? "rgba(200, 230, 250, 0.3)" : "rgba(14, 58, 108, 0.3)"}`,
            }}
          >
            {room.metadata?.type === "bathroom" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <WcIcon style={{ fontSize: "14px" }} />
                {room.name}
              </div>
            ) : (
              <>
                {room.title && <div style={{ fontSize: "10px", opacity: 0.8 }}>{room.title}</div>}
                <div>{room.name}</div>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ floor, onRoomClick, isDark }: BlueprintViewer3DProps) {
  const { camera } = useThree();
  const floorHeight = 30;

  React.useEffect(() => {
    const centerX = floor.blueprint.width / 2;
    const centerZ = floor.blueprint.height / 2;
    camera.position.set(
      centerX,
      floor.blueprint.height * 0.8,
      centerZ + floor.blueprint.height * 0.6
    );
    camera.lookAt(centerX, 0, centerZ);
  }, [floor, camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.4 : 0.6} />
      <directionalLight position={[100, 200, 100]} intensity={isDark ? 0.8 : 1} castShadow />
      <directionalLight position={[-100, 200, -100]} intensity={isDark ? 0.5 : 0.7} />
      <pointLight position={[0, 100, 0]} intensity={isDark ? 0.3 : 0.5} />

      {/* Floor base */}
      <mesh position={[floor.blueprint.width / 2, -2, floor.blueprint.height / 2]} receiveShadow>
        <boxGeometry args={[floor.blueprint.width, 4, floor.blueprint.height]} />
        <meshStandardMaterial color={isDark ? "#1a1a1a" : "#e5e7eb"} />
      </mesh>

      {/* Grid helper */}
      <gridHelper
        args={[Math.max(floor.blueprint.width, floor.blueprint.height), 20]}
        position={[floor.blueprint.width / 2, 0, floor.blueprint.height / 2]}
      />

      {/* Rooms */}
      {floor.rooms.map(room => (
        <RoomMesh
          key={room.id}
          room={room}
          onClick={() => onRoomClick(room)}
          isDark={isDark}
          floorHeight={floorHeight}
        />
      ))}

      {/* Floor label */}
      <Text
        position={[floor.blueprint.width / 2, floorHeight + 30, -30]}
        fontSize={20}
        color={isDark ? "#C8E6FA" : "#0e3a6c"}
        anchorX="center"
        anchorY="middle"
      >
        {floor.name}
      </Text>

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={100}
        maxDistance={1000}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// Main component
export default function BlueprintViewer3D({ floor, onRoomClick, isDark }: BlueprintViewer3DProps) {
  return (
    <div className="w-full" style={{ height: "600px" }}>
      <Canvas
        shadows
        camera={{ fov: 50, position: [0, 200, 400] }}
        style={{
          background: isDark ? "#0a0a0a" : "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <Scene floor={floor} onRoomClick={onRoomClick} isDark={isDark} />
      </Canvas>

      {/* Instructions */}
      <div className="mt-4 text-sm text-center" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
        <p>
          🖱️ Clique e arraste para rotacionar | 🔍 Scroll para zoom | ⌨️ Clique direito para mover
        </p>
      </div>
    </div>
  );
}
