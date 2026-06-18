import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, CanvasTexture, Vector3 } from "three";
import type { SimulationInput, SimulationPoint } from "../types";
import { clamp, formatTorque } from "../utils/units";

interface Object3DViewerProps {
  input: SimulationInput;
  currentPoint: SimulationPoint;
}

interface SceneLineProps {
  points: Array<[number, number, number]>;
  color: string;
  depthTest?: boolean;
}

function SceneLine({ points, color, depthTest = true }: SceneLineProps) {
  const geometry = useMemo(() => {
    const next = new BufferGeometry();
    next.setFromPoints(points.map(([x, y, z]) => new Vector3(x, y, z)));
    return next;
  }, [points]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color={color} depthTest={depthTest} linewidth={2} />
    </line>
  );
}

function AxisLabel({ color, position, text }: { color: string; position: [number, number, number]; text: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext("2d");

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "900 34px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = 8;
      context.strokeStyle = "#f8faf8";
      context.strokeText(text, canvas.width / 2, canvas.height / 2);
      context.fillStyle = color;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.needsUpdate = true;
    return nextTexture;
  }, [color, text]);

  return (
    <sprite position={position} scale={[0.55, 0.28, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

function AxisArrow({
  color,
  direction,
  label,
  length,
  rotation,
}: {
  color: string;
  direction: [number, number, number];
  label: string;
  length: number;
  rotation: [number, number, number];
}) {
  const coneHeight = 0.18;
  const vector = useMemo(() => new Vector3(...direction).normalize(), [direction]);
  const end = vector.clone().multiplyScalar(length);
  const coneCenter = vector.clone().multiplyScalar(length - coneHeight / 2);
  const labelPosition = vector.clone().multiplyScalar(length + 0.34);

  return (
    <group>
      <SceneLine points={[[0, 0, 0], [end.x, end.y, end.z]]} color={color} depthTest={false} />
      <mesh position={[coneCenter.x, coneCenter.y, coneCenter.z]} rotation={rotation}>
        <coneGeometry args={[0.075, coneHeight, 24]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <AxisLabel color={color} position={[labelPosition.x, labelPosition.y, labelPosition.z]} text={`+${label}`} />
    </group>
  );
}

function CoordinateAxes({ panelLength, panelWidth }: { panelLength: number; panelWidth: number }) {
  const xLength = Math.max(panelLength + 0.55, 2.5);
  const yLength = 1.95;
  const zLength = Math.max(panelWidth * 0.72, 2.2);

  return (
    <group>
      <AxisArrow color="#dc2626" direction={[1, 0, 0]} label="X" length={xLength} rotation={[0, 0, -Math.PI / 2]} />
      <AxisArrow color="#16a34a" direction={[0, 1, 0]} label="Y" length={yLength} rotation={[0, 0, 0]} />
      <AxisArrow color="#2563eb" direction={[0, 0, 1]} label="Z" length={zLength} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

function HingeModel({ input, currentPoint }: Object3DViewerProps) {
  const objectLengthMm = Math.max(1, input.objectHeightMm);
  const panelWidth = clamp(input.objectWidthMm / 100, 2.4, 6.2);
  const panelLength = clamp(objectLengthMm / 100, 1.8, 5.8);
  const panelDepth = clamp(input.objectDepthMm / 120, 0.28, 1.0);
  const angleRad = ((input.initialAngleDeg + input.currentAngleDeg) * Math.PI) / 180;
  const lengthScale = panelLength / objectLengthMm;
  const cgX = clamp(input.cgXmm * lengthScale, 0, panelLength);
  const cgY = clamp(input.cgYmm / 120, -0.7, 1.2);
  const handleX = clamp(input.handleDistanceMm * lengthScale, 0, panelLength);
  const statusColor = currentPoint.status === "ng" ? "#c2413d" : currentPoint.status === "check" ? "#b7791f" : "#0f8b65";
  const cgWorldX = cgX * Math.cos(angleRad) - cgY * Math.sin(angleRad);
  const cgWorldY = cgX * Math.sin(angleRad) + cgY * Math.cos(angleRad);

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, panelWidth * 1.22, 32]} />
        <meshStandardMaterial color="#20262e" metalness={0.45} roughness={0.32} />
      </mesh>
      <group rotation={[0, 0, angleRad]}>
        <mesh position={[panelLength / 2, 0, 0]}>
          <boxGeometry args={[panelLength, panelDepth, panelWidth]} />
          <meshStandardMaterial color={statusColor} roughness={0.55} metalness={0.08} transparent opacity={0.86} />
        </mesh>
        <mesh position={[cgX, cgY, 0]}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial color="#c2413d" />
        </mesh>
        <mesh position={[handleX, 0, 0]}>
          <sphereGeometry args={[0.1, 24, 24]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
      </group>
      <SceneLine points={[[cgWorldX, cgWorldY, 0], [cgWorldX, cgWorldY - 1.1, 0]]} color="#c2413d" />
      <CoordinateAxes panelLength={panelLength} panelWidth={panelWidth} />
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
        <strong>必要 {formatTorque(currentPoint.requiredTorqueKgfcm)}</strong>
        <strong>余裕 {formatTorque(currentPoint.holdingMarginKgfcm)}</strong>
      </div>
    </div>
  );
}
