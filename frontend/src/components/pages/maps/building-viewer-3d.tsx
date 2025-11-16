"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { Building, Floor, Room } from "@/lib/maps/types";
import BlueprintViewer3D from "./blueprint-viewer-3d";
import { Button } from "@/components/ui/button";
import { Home, Maximize2 } from "lucide-react";

type BuildingViewer3DProps = {
  building: Building;
  onRoomClick: (room: Room) => void;
  isDark: boolean;
};

type FloorMeshProps = {
  floor: Floor;
  floorIndex: number;
  totalFloors: number;
  isHovered: boolean;
  onFloorClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  isDark: boolean;
};

// Floor mesh component - represents one floor of the building
function FloorMesh({
  floor,
  floorIndex,
  totalFloors,
  isHovered,
  onFloorClick,
  onHoverStart,
  onHoverEnd,
  isDark,
}: FloorMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const floorHeight = 40;
  const buildingWidth = 200;
  const buildingDepth = 120;

  // Animate on hover
  useFrame(() => {
    if (meshRef.current && isHovered) {
      meshRef.current.position.y = floorIndex * floorHeight + Math.sin(Date.now() * 0.003) * 2;
    } else if (meshRef.current) {
      meshRef.current.position.y = floorIndex * floorHeight;
    }
  });

  // Colors based on floor type
  const floorColor = isDark ? "#e5e7eb" : "#f3f4f6";
  const windowColor = isDark ? "#1e293b" : "#334155";
  const highlightColor = isDark ? "#3b82f6" : "#2563eb";

  return (
    <group ref={meshRef}>
      {/* Main floor structure */}
      <mesh
        position={[0, floorHeight / 2, 0]}
        onClick={onFloorClick}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
      >
        <boxGeometry args={[buildingWidth, floorHeight, buildingDepth]} />
        <meshStandardMaterial
          color={isHovered ? highlightColor : floorColor}
          transparent
          opacity={isHovered ? 0.9 : 0.85}
          emissive={isHovered ? highlightColor : "#000000"}
          emissiveIntensity={isHovered ? 0.3 : 0}
        />
      </mesh>

      {/* Windows - horizontal stripe */}
      <mesh position={[0, floorHeight / 2, -buildingDepth / 2 + 1]}>
        <boxGeometry args={[buildingWidth - 10, floorHeight * 0.6, 2]} />
        <meshStandardMaterial color={windowColor} transparent opacity={0.7} />
      </mesh>

      {/* Windows - front */}
      <mesh position={[0, floorHeight / 2, buildingDepth / 2 - 1]}>
        <boxGeometry args={[buildingWidth - 20, floorHeight * 0.5, 2]} />
        <meshStandardMaterial color={windowColor} transparent opacity={0.6} />
      </mesh>

      {/* Floor label */}
      <Text
        position={[0, floorHeight / 2, buildingDepth / 2 + 2]}
        fontSize={8}
        color={isDark ? "#C8E6FA" : "#0e3a6c"}
        anchorX="center"
        anchorY="middle"
      >
        {floor.name}
      </Text>

      {/* Hover label */}
      {isHovered && (
        <Text
          position={[0, floorHeight + 10, 0]}
          fontSize={6}
          color={isDark ? "#fbbf24" : "#f59e0b"}
          anchorX="center"
          anchorY="middle"
        >
          Clique para entrar
        </Text>
      )}
    </group>
  );
}

// Building scene component
function BuildingScene({
  building,
  onFloorSelect,
  isDark,
}: {
  building: Building;
  onFloorSelect: (floor: Floor) => void;
  isDark: boolean;
}) {
  const { camera } = useThree();
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);

  const floorHeight = 40;
  const buildingWidth = 200;
  const buildingDepth = 120;

  // Position camera to view the entire building
  React.useEffect(() => {
    const totalHeight = building.floors.length * floorHeight;
    camera.position.set(buildingWidth * 0.8, totalHeight * 0.7, buildingDepth * 1.5);
    camera.lookAt(0, totalHeight / 2, 0);
  }, [building, camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.5 : 0.7} />
      <directionalLight position={[200, 300, 200]} intensity={isDark ? 0.8 : 1} castShadow />
      <directionalLight position={[-200, 300, -200]} intensity={isDark ? 0.5 : 0.7} />
      <pointLight position={[0, 200, 200]} intensity={isDark ? 0.4 : 0.6} />

      {/* Ground */}
      <mesh position={[0, -5, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color={isDark ? "#0f172a" : "#cbd5e1"} />
      </mesh>

      {/* Base/Foundation */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[buildingWidth + 10, 4, buildingDepth + 10]} />
        <meshStandardMaterial color={isDark ? "#1e293b" : "#94a3b8"} />
      </mesh>

      {/* Floors */}
      {building.floors.map((floor, index) => (
        <FloorMesh
          key={floor.id}
          floor={floor}
          floorIndex={index}
          totalFloors={building.floors.length}
          isHovered={hoveredFloorId === floor.id}
          onFloorClick={() => onFloorSelect(floor)}
          onHoverStart={() => setHoveredFloorId(floor.id)}
          onHoverEnd={() => setHoveredFloorId(null)}
          isDark={isDark}
        />
      ))}

      {/* Elevator shaft / Tower on the side */}
      <mesh position={[buildingWidth / 2 + 15, (building.floors.length * floorHeight) / 2, 0]}>
        <boxGeometry args={[20, building.floors.length * floorHeight + 10, 20]} />
        <meshStandardMaterial color={isDark ? "#334155" : "#64748b"} />
      </mesh>

      {/* Antenna on top */}
      <mesh position={[buildingWidth / 2 + 15, building.floors.length * floorHeight + 10, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
        <meshStandardMaterial color={isDark ? "#94a3b8" : "#475569"} />
      </mesh>

      {/* Building name */}
      <Text
        position={[0, building.floors.length * floorHeight + 20, buildingDepth / 2 + 5]}
        fontSize={12}
        color={isDark ? "#C8E6FA" : "#0e3a6c"}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {building.name}
      </Text>

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={150}
        maxDistance={600}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// Main component
export default function BuildingViewer3D({ building, onRoomClick, isDark }: BuildingViewer3DProps) {
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [viewMode, setViewMode] = useState<"exterior" | "interior">("exterior");

  const handleFloorSelect = (floor: Floor) => {
    setSelectedFloor(floor);
    setViewMode("interior");
  };

  const handleBackToBuilding = () => {
    setViewMode("exterior");
    setSelectedFloor(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* View mode toggle */}
      <div className="flex gap-2 justify-center">
        <Button
          onClick={handleBackToBuilding}
          variant={viewMode === "exterior" ? "default" : "outline"}
          size="sm"
          style={{
            backgroundColor:
              viewMode === "exterior"
                ? isDark
                  ? "#1a3a5c"
                  : "#0e3a6c"
                : isDark
                  ? "rgba(255,255,255,0.05)"
                  : "#fff",
            color: isDark ? "#C8E6FA" : viewMode === "exterior" ? "#fff" : "#0e3a6c",
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
          }}
        >
          <Home className="w-4 h-4 mr-2" />
          Vista Externa
        </Button>
        {selectedFloor && (
          <Button
            onClick={() => setViewMode("interior")}
            variant={viewMode === "interior" ? "default" : "outline"}
            size="sm"
            style={{
              backgroundColor:
                viewMode === "interior"
                  ? isDark
                    ? "#1a3a5c"
                    : "#0e3a6c"
                  : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#fff",
              color: isDark ? "#C8E6FA" : viewMode === "interior" ? "#fff" : "#0e3a6c",
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            }}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Interior - {selectedFloor.name}
          </Button>
        )}
      </div>

      {/* 3D Viewer */}
      {viewMode === "exterior" ? (
        <div className="w-full" style={{ height: "600px" }}>
          <Canvas
            shadows
            camera={{ fov: 50, position: [200, 150, 300] }}
            style={{
              background: isDark ? "#0a0a0a" : "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <BuildingScene building={building} onFloorSelect={handleFloorSelect} isDark={isDark} />
          </Canvas>
          <div
            className="mt-4 text-sm text-center"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            <p>
              🖱️ Clique em um andar para ver o interior | 🔄 Arraste para rotacionar | 🔍 Scroll
              para zoom
            </p>
          </div>
        </div>
      ) : (
        selectedFloor && (
          <BlueprintViewer3D floor={selectedFloor} onRoomClick={onRoomClick} isDark={isDark} />
        )
      )}
    </div>
  );
}
