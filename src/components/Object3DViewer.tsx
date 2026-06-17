import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Vector3 } from "three";
import type { SimulationInput, SimulationPoint } from "../types";
import { clamp, formatNumber } from "../utils/units";

interface Object3DViewerProps {
  input: SimulationInput;
  currentPoint: SimulationPoint;
}

function SceneLine({ points, color }: { points: Array<[number, number, number]>; color: string }) {
  const geometry = useMemo(() => {
    const next = new BufferGeometry();
    next.setFromPoints(points.map(([x, y, z]) => new Vector3(x, y, z)));
    return next;
  }, [points]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}

function HingeModel({ input, currentPoint }: Object3DViewerProps) {
  const panelWidth = clamp(input.objectWidthMm / 100, 2.4, 6.2);
  const panelLength = clamp(input.objectHeightMm / 100, 1.8, 5.8);
  const panelDepth = clamp(input.objectDepthMm / 120, 0.28, 1.0);
  const angleRad = ((input.initialAngleDeg + input.currentAngleDeg) * Math.PI) / 180;
  const cgZ = clamp(input.cgXmm / 100, 0.25, panelLength);
  const cgY = clamp(input.cgYmm / 120, -0.7, 1.2);
  const statusColor = currentPoint.status === "ng" ? "#c2413d" : currentPoint.status === "check" ? "#b7791f" : "#0f8b65";

  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, panelWidth * 1.22, 32]} />
        <meshStandardMaterial color="#20262e" metalness={0.45} roughness={0.32} />
      </mesh>
      <group rotation={[angleRad, 0, 0]}>
        <mesh position={[0, panelDepth / 2, panelLength / 2]}>
          <boxGeometry args={[panelWidth, panelDepth, panelLength]} />
          <meshStandardMaterial color={statusColor} roughness={0.55} metalness={0.08} transparent opacity={0.86} />
        </mesh>
        <mesh position={[0, panelDepth + cgY, cgZ]}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial color="#c2413d" />
        </mesh>
        <mesh position={[0, panelDepth + 0.08, clamp(input.handleDistanceMm / 100, 0.4, panelLength)]}>
          <sphereGeometry args={[0.1, 24, 24]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        <SceneLine points={[[0, panelDepth + cgY, cgZ], [0, panelDepth + cgY - 1.1, cgZ]]} color="#c2413d" />
      </group>
      <SceneLine points={[[-panelWidth * 0.65, 0, 0], [panelWidth * 0.65, 0, 0]]} color="#20262e" />
      <SceneLine points={[[0, 0, 0], [0, 0, panelLength + 0.5]]} color="#9aa5a1" />
      <SceneLine points={[[0, 0, 0], [0, 1.8, 0]]} color="#9aa5a1" />
    </group>
  );
}

export function Object3DViewer({ input, currentPoint }: Object3DViewerProps) {
  return (
    <div className="viewer three-viewer">
      <Canvas camera={{ position: [5.4, 4.2, 6.2], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#f8faf8"]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 7, 5]} intensity={1.35} />
        <directionalLight position={[-4, 3, -2]} intensity={0.45} />
        <HingeModel input={input} currentPoint={currentPoint} />
      </Canvas>
      <div className="viewer-stats">
        <span>{input.currentAngleDeg.toFixed(0)}°</span>
        <strong>必要 {formatNumber(currentPoint.requiredTorqueKgfcm, 1)} kgf·cm</strong>
        <strong>余裕 {formatNumber(currentPoint.holdingMarginKgfcm, 1)} kgf·cm</strong>
      </div>
    </div>
  );
}
