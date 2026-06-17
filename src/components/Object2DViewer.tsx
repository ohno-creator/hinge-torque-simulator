import type { HingeProduct, SimulationInput, SimulationPoint } from "../types";
import { clamp, formatForce, formatNumber } from "../utils/units";

interface Object2DViewerProps {
  input: SimulationInput;
  currentPoint: SimulationPoint;
  product: HingeProduct;
}

interface Point {
  x: number;
  y: number;
}

function pointsToString(points: Point[]): string {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

export function Object2DViewer({ input, currentPoint, product }: Object2DViewerProps) {
  const width = 760;
  const height = 430;
  const hinge = { x: 118, y: 250 };
  const lengthMm = Math.max(input.objectHeightMm, Math.abs(input.cgXmm) + 90, input.handleDistanceMm + 40);
  const thicknessMm = clamp(input.objectDepthMm * 0.32, 28, 92);
  const scale = Math.min(1.15, 430 / Math.max(lengthMm + 90, 260));
  const angleRad = ((input.initialAngleDeg + input.currentAngleDeg) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  function toSvg(localX: number, localY: number): Point {
    const worldX = localX * cos - localY * sin;
    const worldY = localX * sin + localY * cos;
    return {
      x: hinge.x + worldX * scale,
      y: hinge.y - worldY * scale,
    };
  }

  const objectPoints = [
    toSvg(0, -thicknessMm / 2),
    toSvg(lengthMm, -thicknessMm / 2),
    toSvg(lengthMm, thicknessMm / 2),
    toSvg(0, thicknessMm / 2),
  ];
  const cgPoint = toSvg(input.cgXmm, input.cgYmm);
  const handlePoint = toSvg(input.handleDistanceMm, 0);
  const tangent = { x: -sin, y: -cos };
  const operationEnd = {
    x: handlePoint.x + tangent.x * 58,
    y: handlePoint.y + tangent.y * 58,
  };
  const momentArmX = hinge.x + (input.cgXmm * cos - input.cgYmm * sin) * scale;
  const statusClass = currentPoint.status === "ok" ? "ok" : currentPoint.status === "check" ? "check" : "ng";

  return (
    <div className="viewer">
      <svg className="object-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="2Dヒンジ保持確認図">
        <defs>
          <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#c2413d" />
          </marker>
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
          </marker>
          <marker id="arrow-gray" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#394150" />
          </marker>
        </defs>

        <rect x="0" y="0" width={width} height={height} rx="8" fill="#f8faf8" />
        <path d={`M 64 ${hinge.y} H 700`} stroke="#d8ded8" strokeDasharray="8 8" />
        <path d={`M ${hinge.x} 52 V 374`} stroke="#d8ded8" strokeDasharray="8 8" />
        <polygon
          points={pointsToString(objectPoints)}
          fill={statusClass === "ng" ? "#fde2de" : statusClass === "check" ? "#fff2d6" : "#e4f5ee"}
          stroke={statusClass === "ng" ? "#c2413d" : statusClass === "check" ? "#b7791f" : "#0f8b65"}
          strokeWidth="3"
        />
        <circle cx={hinge.x} cy={hinge.y} r="12" fill="#20262e" />
        <circle cx={hinge.x} cy={hinge.y} r="5" fill="#ffffff" />
        <line x1={hinge.x} y1={hinge.y} x2={momentArmX} y2={hinge.y} stroke="#7c5c2e" strokeWidth="3" strokeDasharray="7 6" />
        <line x1={momentArmX} y1={hinge.y} x2={cgPoint.x} y2={cgPoint.y} stroke="#7c5c2e" strokeWidth="2" strokeDasharray="4 5" />
        <circle cx={cgPoint.x} cy={cgPoint.y} r="9" fill="#c2413d" />
        <line x1={cgPoint.x} y1={cgPoint.y + 12} x2={cgPoint.x} y2={cgPoint.y + 88} stroke="#c2413d" strokeWidth="4" markerEnd="url(#arrow-red)" />
        <circle cx={handlePoint.x} cy={handlePoint.y} r="7" fill="#2563eb" />
        <line x1={handlePoint.x} y1={handlePoint.y} x2={operationEnd.x} y2={operationEnd.y} stroke="#2563eb" strokeWidth="4" markerEnd="url(#arrow-blue)" />
        <path
          d={`M ${hinge.x + 36} ${hinge.y - 18} A 58 58 0 0 0 ${hinge.x + 72 * Math.cos(angleRad)} ${hinge.y - 72 * Math.sin(angleRad)}`}
          fill="none"
          stroke="#394150"
          strokeWidth="3"
          markerEnd="url(#arrow-gray)"
        />
        <text x={hinge.x - 36} y={hinge.y + 38} className="svg-label">
          ヒンジ
        </text>
        <text x={cgPoint.x + 14} y={cgPoint.y - 12} className="svg-label">
          重心
        </text>
        <text x={handlePoint.x + 12} y={handlePoint.y + 24} className="svg-label">
          操作点
        </text>
        <text x={width - 172} y={44} className="svg-badge">
          {input.currentAngleDeg.toFixed(0)}°
        </text>
      </svg>

      <div className="viewer-stats">
        <span>{product.productCode}</span>
        <strong>モーメントアーム {formatNumber(Math.abs(currentPoint.signedLoadMomentKgfcm), 1)} kgf·cm</strong>
        <strong>保持余裕 {formatNumber(currentPoint.holdingMarginKgfcm, 1)} kgf·cm</strong>
        <strong>開操作 {formatForce(currentPoint.openForceN, input.forceUnit)}</strong>
      </div>
    </div>
  );
}
