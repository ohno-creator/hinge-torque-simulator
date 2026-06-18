import { AlertTriangle, CheckCircle2, Gauge, Ruler, ShieldCheck, Weight } from "lucide-react";
import type { HingeProduct, SimulationInput, SimulationPoint, SimulationResult } from "../types";
import { formatRanges } from "../utils/calculations";
import { formatForce, formatNumber, formatTorque } from "../utils/units";
import { FormulaTooltip } from "./FormulaTooltip";

interface ResultSummaryProps {
  input: SimulationInput;
  product: HingeProduct;
  result: SimulationResult;
  currentPoint: SimulationPoint;
}

function StatusIcon({ status }: { status: SimulationResult["overallStatus"] }) {
  if (status === "ok") {
    return <CheckCircle2 size={18} />;
  }
  if (status === "check") {
    return <AlertTriangle size={18} />;
  }
  return <AlertTriangle size={18} />;
}

const resultHelp = {
  maxRequiredTorque:
    "各角度で 必要トルク = |重量×9.80665×回転後X距離| ÷ ヒンジ個数 × 安全率 を計算し、その最大値を表示します。",
  minHoldingMargin: "保持余裕 = ヒンジ規格下限 - 必要トルク。全角度の中で最も小さい余裕を表示します。",
  holdableRanges: "保持可能範囲は、保持余裕が0以上になる角度区間です。トルクカーブ外の角度は判定外として扱います。",
  maxOperationForce:
    "操作力 = 操作トルク N·m ÷ (操作点距離 mm ÷ 1000)。開方向・閉方向それぞれの最大値を表示します。",
  currentAngle: "現在角度の計算点です。2D/3D図とグラフの縦線、現在値サマリーがこの角度に連動します。",
  currentRequired: "現在角度での必要トルクです。|対象物モーメント| × 安全率で計算します。",
  currentLower: "現在角度のヒンジトルク規格下限です。標準トルクから許容差を差し引いた値を使います。",
  currentMargin: "現在角度の保持余裕です。規格下限 - 必要トルクで計算します。",
};

function MetricLabel({ children, help }: { children: string; help: string }) {
  return (
    <span className="metric-label">
      <span>{children}</span>
      <FormulaTooltip>{help}</FormulaTooltip>
    </span>
  );
}

export function ResultSummary({ input, product, result, currentPoint }: ResultSummaryProps) {
  const statusText = result.overallStatus === "ok" ? "保持可能" : result.overallStatus === "check" ? "余裕小" : "保持不足";
  const currentMargin = currentPoint.holdingMarginKgfcm;

  return (
    <section className="panel result-summary">
      <div className="summary-head">
        <div>
          <div className="panel-title inline-title">
            <StatusIcon status={result.overallStatus} />
            <h2>計算結果</h2>
          </div>
          <p>
            {product.productCode} / {product.productName}
          </p>
        </div>
        <span className={`status-pill status-${result.overallStatus}`}>{statusText}</span>
      </div>

      <div className="metric-grid">
        <article className="metric">
          <Weight size={18} />
          <MetricLabel help={resultHelp.maxRequiredTorque}>最大必要トルク</MetricLabel>
          <strong>{formatTorque(result.maxRequiredTorqueKgfcm)} / hinge</strong>
        </article>
        <article className="metric">
          <ShieldCheck size={18} />
          <MetricLabel help={resultHelp.minHoldingMargin}>最小保持余裕</MetricLabel>
          <strong className={currentMargin !== null && currentMargin < 0 ? "danger-text" : ""}>
            {formatTorque(result.minHoldingMarginKgfcm)}
          </strong>
          <small>{result.minHoldingMarginAngleDeg === null ? "-" : `${formatNumber(result.minHoldingMarginAngleDeg, 0)}°付近`}</small>
        </article>
        <article className="metric">
          <Ruler size={18} />
          <MetricLabel help={resultHelp.holdableRanges}>保持可能範囲</MetricLabel>
          <strong>{formatRanges(result.holdableRanges)}</strong>
        </article>
        <article className="metric">
          <Gauge size={18} />
          <MetricLabel help={resultHelp.maxOperationForce}>最大操作力</MetricLabel>
          <strong>
            開 {formatForce(result.maxOpenForceN, input.forceUnit)} / 閉 {formatForce(result.maxCloseForceN, input.forceUnit)}
          </strong>
          <small>{result.operationLabel}</small>
        </article>
      </div>

      <div className="current-strip">
        <span className="current-strip-item">
          {input.currentAngleDeg.toFixed(0)}°
          <FormulaTooltip>{resultHelp.currentAngle}</FormulaTooltip>
        </span>
        <b className="current-strip-item">
          必要 {formatTorque(currentPoint.requiredTorqueKgfcm)}
          <FormulaTooltip>{resultHelp.currentRequired}</FormulaTooltip>
        </b>
        <b className="current-strip-item">
          規格下限 {formatTorque(currentPoint.hingeMinKgfcm)}
          <FormulaTooltip>{resultHelp.currentLower}</FormulaTooltip>
        </b>
        <b className="current-strip-item">
          余裕 {formatTorque(currentPoint.holdingMarginKgfcm)}
          <FormulaTooltip>{resultHelp.currentMargin}</FormulaTooltip>
        </b>
      </div>
    </section>
  );
}
