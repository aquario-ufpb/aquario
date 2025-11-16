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

  // Colors matching the real building
  const floorColor = isDark ? "#e8e8e8" : "#f5f5f5"; // Light gray/white
  const windowColor = isDark ? "#2a2a2a" : "#1a1a1a"; // Dark windows
  const highlightColor = isDark ? "#60a5fa" : "#3b82f6";

  return (
    <group ref={meshRef}>
      {/* Main floor structure - White/light gray body */}
      <mesh
        position={[0, floorHeight / 2, 0]}
        onClick={onFloorClick}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[buildingWidth, floorHeight, buildingDepth]} />
        <meshStandardMaterial
          color={isHovered ? highlightColor : floorColor}
          metalness={0.1}
          roughness={0.7}
          emissive={isHovered ? highlightColor : "#000000"}
          emissiveIntensity={isHovered ? 0.2 : 0}
        />
      </mesh>

      {/* Horizontal window band - Dark stripe (back side) */}
      <mesh position={[0, floorHeight / 2, -buildingDepth / 2 - 1.5]} castShadow>
        <boxGeometry args={[buildingWidth - 4, floorHeight * 0.55, 2]} />
        <meshStandardMaterial
          color={windowColor}
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Window reflections - back side */}
      <mesh position={[0, floorHeight / 2, -buildingDepth / 2 - 2.5]}>
        <boxGeometry args={[buildingWidth - 6, floorHeight * 0.5, 0.3]} />
        <meshStandardMaterial
          color="#4a5568"
          transparent
          opacity={0.5}
          metalness={0.9}
          roughness={0.1}
          polygonOffset={true}
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {/* Front side - smaller windows */}
      <mesh position={[0, floorHeight / 2, buildingDepth / 2 + 1.5]} castShadow>
        <boxGeometry args={[buildingWidth - 30, floorHeight * 0.4, 2]} />
        <meshStandardMaterial
          color={windowColor}
          metalness={0.7}
          roughness={0.3}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
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
      {/* Sky background color */}
      <color attach="background" args={[isDark ? "#0a0a0a" : "#87ceeb"]} />
      <fog attach="fog" args={[isDark ? "#0a0a0a" : "#b8d9f5", 100, 800]} />

      {/* Lighting - Bright daytime */}
      <ambientLight intensity={isDark ? 0.5 : 0.8} />
      <directionalLight
        position={[200, 300, 200]}
        intensity={isDark ? 1 : 1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />
      <directionalLight position={[-150, 200, -150]} intensity={isDark ? 0.5 : 0.8} />
      <pointLight position={[0, 200, 100]} intensity={isDark ? 0.3 : 0.5} color="#ffffff" />
      <hemisphereLight
        color={isDark ? "#87ceeb" : "#b8d9f5"}
        groundColor={isDark ? "#4a5568" : "#c8dfc9"}
        intensity={isDark ? 0.4 : 0.7}
      />

      {/* Ground - Grass and pavement */}
      <mesh position={[0, -5, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color={isDark ? "#1a3a2e" : "#8bc34a"} roughness={0.8} />
      </mesh>

      {/* Pavement around building */}
      <mesh position={[0, -4.5, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[buildingWidth + 40, buildingDepth + 40]} />
        <meshStandardMaterial color={isDark ? "#4a5568" : "#b8c1cc"} roughness={0.6} />
      </mesh>

      {/* Base/Foundation - More defined */}
      <mesh position={[0, -2, 0]} castShadow receiveShadow>
        <boxGeometry args={[buildingWidth + 8, 4, buildingDepth + 8]} />
        <meshStandardMaterial
          color={isDark ? "#374151" : "#6b7280"}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Ground floor entrance area */}
      <mesh position={[0, 8, buildingDepth / 2 - 2]} castShadow>
        <boxGeometry args={[40, 16, 4]} />
        <meshStandardMaterial
          color={isDark ? "#2d3748" : "#4a5568"}
          roughness={0.6}
          metalness={0.2}
        />
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

      {/* Vertical tower on the right side - Dark shaft */}
      <mesh
        position={[buildingWidth / 2 + 15, (building.floors.length * floorHeight) / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[25, building.floors.length * floorHeight + 15, 25]} />
        <meshStandardMaterial
          color={isDark ? "#1a1a1a" : "#2d3748"}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Tower windows/vents */}
      {Array.from({ length: building.floors.length }).map((_, i) => (
        <mesh
          key={`tower-detail-${i}`}
          position={[buildingWidth / 2 + 15, i * floorHeight + floorHeight / 2, 13]}
        >
          <boxGeometry args={[18, floorHeight * 0.3, 1]} />
          <meshStandardMaterial
            color="#4a5568"
            metalness={0.7}
            roughness={0.3}
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      ))}

      {/* Antenna structure on top */}
      <group position={[buildingWidth / 2 + 15, building.floors.length * floorHeight + 10, 0]}>
        {/* Main antenna pole */}
        <mesh castShadow>
          <cylinderGeometry args={[0.8, 0.8, 25, 8]} />
          <meshStandardMaterial
            color={isDark ? "#9ca3af" : "#6b7280"}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Antenna details */}
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry args={[2, 0.5, 4, 8]} />
          <meshStandardMaterial
            color={isDark ? "#9ca3af" : "#6b7280"}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0, -5, 0]}>
          <cylinderGeometry args={[0.5, 1.5, 3, 8]} />
          <meshStandardMaterial
            color={isDark ? "#9ca3af" : "#6b7280"}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

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
            camera={{
              fov: 50,
              position: [200, 150, 300],
              near: 1,
              far: 2000,
            }}
            gl={{
              antialias: true,
              alpha: true,
              logarithmicDepthBuffer: true,
            }}
            style={{
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
