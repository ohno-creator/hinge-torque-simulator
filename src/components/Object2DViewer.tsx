import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { HingeProduct, SimulationInput, SimulationPoint } from "../types";
import { clamp, formatForce, formatTorque } from "../utils/units";

interface Object2DViewerProps {
  input: SimulationInput;
  currentPoint: SimulationPoint;
  product: HingeProduct;
  onHandleDistanceChange?: (handleDistanceMm: number) => void;
}

interface Point {
  x: number;
  y: number;
}

function pointsToString(points: Point[]): string {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function createBounds(points: Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function Object2DViewer({ input, currentPoint, product, onHandleDistanceChange }: Object2DViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const width = 760;
  const height = 430;
  const objectLengthMm = Math.max(1, input.objectHeightMm);
  const thicknessMm = clamp(input.objectDepthMm * 0.32, 28, 92);
  const angleRad = ((input.initialAngleDeg + input.currentAngleDeg) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  function rotatePoint(localX: number, localY: number): Point {
    return {
      x: localX * cos - localY * sin,
      y: localX * sin + localY * cos,
    };
  }

  const objectWorldPoints = [
    rotatePoint(0, -thicknessMm / 2),
    rotatePoint(objectLengthMm, -thicknessMm / 2),
    rotatePoint(objectLengthMm, thicknessMm / 2),
    rotatePoint(0, thicknessMm / 2),
  ];
  const cgWorld = rotatePoint(input.cgXmm, input.cgYmm);
  const handleWorld = rotatePoint(input.handleDistanceMm, 0);
  const arrowLengthMm = clamp(objectLengthMm * 0.22, 56, 110);
  const gravityEndWorld = { x: cgWorld.x, y: cgWorld.y - arrowLengthMm };
  const operationEndWorld = {
    x: handleWorld.x - sin * arrowLengthMm,
    y: handleWorld.y + cos * arrowLengthMm,
  };
  const momentArmWorld = { x: cgWorld.x, y: 0 };
  const bounds = createBounds([
    ...objectWorldPoints,
    cgWorld,
    gravityEndWorld,
    handleWorld,
    operationEndWorld,
    momentArmWorld,
    { x: 0, y: 0 },
  ]);
  const margins = { top: 76, right: 72, bottom: 72, left: 72 };
  const availableWidth = width - margins.left - margins.right;
  const availableHeight = height - margins.top - margins.bottom;
  const boundsWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const boundsHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(1.18, availableWidth / boundsWidth, availableHeight / boundsHeight);
  const offsetX = margins.left + (availableWidth - boundsWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = margins.top + (availableHeight - boundsHeight * scale) / 2 + bounds.maxY * scale;

  function toSvg(worldPoint: Point): Point {
    return {
      x: offsetX + worldPoint.x * scale,
      y: offsetY - worldPoint.y * scale,
    };
  }

  function labelPoint(point: Point, dx: number, dy: number): Point {
    return {
      x: clamp(point.x + dx, 18, width - 112),
      y: clamp(point.y + dy, 24, height - 18),
    };
  }

  const objectPoints = objectWorldPoints.map(toSvg);
  const hinge = toSvg({ x: 0, y: 0 });
  const cgPoint = toSvg(cgWorld);
  const gravityEnd = toSvg(gravityEndWorld);
  const handlePoint = toSvg(handleWorld);
  const operationEnd = toSvg(operationEndWorld);
  const momentArm = toSvg(momentArmWorld);
  const hingeLabel = labelPoint(hinge, -36, 38);
  const cgLabel = labelPoint(cgPoint, 14, -12);
  const handleLabel = labelPoint(handlePoint, 12, 24);
  const xAxisLabel = { x: width - 64, y: clamp(hinge.y - 10, 26, height - 18) };
  const yAxisLabel = { x: clamp(hinge.x + 12, 22, width - 58), y: 44 };
  const statusClass = currentPoint.status === "ok" ? "ok" : currentPoint.status === "check" ? "check" : "ng";
  const isHandleDragging = activePointerId !== null;

  function updateHandleDistanceFromPointer(event: ReactPointerEvent<SVGElement>) {
    if (!onHandleDistanceChange) {
      return;
    }

    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) {
      return;
    }

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const pointerPoint = svgPoint.matrixTransform(matrix.inverse());
    const worldX = (pointerPoint.x - offsetX) / scale;
    const worldY = (offsetY - pointerPoint.y) / scale;
    const localDistanceMm = worldX * cos + worldY * sin;
    onHandleDistanceChange(Math.round(clamp(localDistanceMm, 0, objectLengthMm)));
  }

  function startHandleDrag(event: ReactPointerEvent<SVGElement>) {
    event.preventDefault();
    event.stopPropagation();
    setActivePointerId(event.pointerId);
    svgRef.current?.setPointerCapture(event.pointerId);
    updateHandleDistanceFromPointer(event);
  }

  function dragHandle(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    event.preventDefault();
    updateHandleDistanceFromPointer(event);
  }

  function stopHandleDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    setActivePointerId(null);
  }

  return (
    <div className="viewer">
      <svg
        ref={svgRef}
        className="object-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="2Dヒンジ保持確認図"
        onPointerMove={dragHandle}
        onPointerUp={stopHandleDrag}
        onPointerCancel={stopHandleDrag}
      >
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
          <marker id="arrow-axis" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#9aa5a1" />
          </marker>
        </defs>

        <rect x="0" y="0" width={width} height={height} rx="8" fill="#f8faf8" />
        <line
          x1="42"
          y1={hinge.y}
          x2={width - 42}
          y2={hinge.y}
          className="axis-line"
          markerEnd="url(#arrow-axis)"
        />
        <line
          x1={hinge.x}
          y1={height - 54}
          x2={hinge.x}
          y2="54"
          className="axis-line"
          markerEnd="url(#arrow-axis)"
        />
        <text x={xAxisLabel.x} y={xAxisLabel.y} className="axis-label">
          +X
        </text>
        <text x={yAxisLabel.x} y={yAxisLabel.y} className="axis-label">
          +Y
        </text>
        <polygon
          points={pointsToString(objectPoints)}
          fill={statusClass === "ng" ? "#fde2de" : statusClass === "check" ? "#fff2d6" : "#e4f5ee"}
          stroke={statusClass === "ng" ? "#c2413d" : statusClass === "check" ? "#b7791f" : "#0f8b65"}
          strokeWidth="3"
        />
        <circle cx={hinge.x} cy={hinge.y} r="12" fill="#20262e" />
        <circle cx={hinge.x} cy={hinge.y} r="5" fill="#ffffff" />
        <line x1={hinge.x} y1={hinge.y} x2={momentArm.x} y2={hinge.y} stroke="#7c5c2e" strokeWidth="3" strokeDasharray="7 6" />
        <line x1={momentArm.x} y1={hinge.y} x2={cgPoint.x} y2={cgPoint.y} stroke="#7c5c2e" strokeWidth="2" strokeDasharray="4 5" />
        <circle cx={cgPoint.x} cy={cgPoint.y} r="9" fill="#c2413d" />
        <line x1={cgPoint.x} y1={cgPoint.y + 12} x2={gravityEnd.x} y2={gravityEnd.y} stroke="#c2413d" strokeWidth="4" markerEnd="url(#arrow-red)" />
        <line x1={handlePoint.x} y1={handlePoint.y} x2={operationEnd.x} y2={operationEnd.y} stroke="#2563eb" strokeWidth="4" markerEnd="url(#arrow-blue)" />
        <g
          className={`operation-point${isHandleDragging ? " dragging" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={`操作点距離 ${input.handleDistanceMm.toFixed(0)} mm`}
          onPointerDown={startHandleDrag}
        >
          <title>操作点をドラッグして距離を変更</title>
          <circle className="operation-hit-target" cx={handlePoint.x} cy={handlePoint.y} r="19" />
          <circle cx={handlePoint.x} cy={handlePoint.y} r="7" fill="#2563eb" />
        </g>
        <path
          d={`M ${hinge.x + 36} ${hinge.y - 18} A 58 58 0 0 0 ${hinge.x + 72 * Math.cos(angleRad)} ${hinge.y - 72 * Math.sin(angleRad)}`}
          fill="none"
          stroke="#394150"
          strokeWidth="3"
          markerEnd="url(#arrow-gray)"
        />
        <text x={hingeLabel.x} y={hingeLabel.y} className="svg-label">
          ヒンジ
        </text>
        <text x={cgLabel.x} y={cgLabel.y} className="svg-label">
          重心
        </text>
        <text x={handleLabel.x} y={handleLabel.y} className="svg-label">
          操作点
        </text>
        <text x={width - 172} y={44} className="svg-badge">
          {input.currentAngleDeg.toFixed(0)}°
        </text>
      </svg>

      <div className="viewer-stats">
        <span>{product.productCode}</span>
        <strong>対象物モーメント {formatTorque(Math.abs(currentPoint.signedLoadMomentKgfcm))}</strong>
        <strong>保持余裕 {formatTorque(currentPoint.holdingMarginKgfcm)}</strong>
        <strong>開操作 {formatForce(currentPoint.openForceN, input.forceUnit)}</strong>
      </div>
    </div>
  );
}
