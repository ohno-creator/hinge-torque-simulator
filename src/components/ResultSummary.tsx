import { AlertTriangle, CheckCircle2, Gauge, Ruler, ShieldCheck, Weight } from "lucide-react";
import type { HingeProduct, SimulationInput, SimulationPoint, SimulationResult } from "../types";
import { formatRanges } from "../utils/calculations";
import { formatForce, formatNumber } from "../utils/units";

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
          <span>最大必要トルク</span>
          <strong>{formatNumber(result.maxRequiredTorqueKgfcm, 1)} kgf·cm / hinge</strong>
        </article>
        <article className="metric">
          <ShieldCheck size={18} />
          <span>最小保持余裕</span>
          <strong className={currentMargin !== null && currentMargin < 0 ? "danger-text" : ""}>
            {formatNumber(result.minHoldingMarginKgfcm, 1)} kgf·cm
          </strong>
          <small>{result.minHoldingMarginAngleDeg === null ? "-" : `${formatNumber(result.minHoldingMarginAngleDeg, 0)}°付近`}</small>
        </article>
        <article className="metric">
          <Ruler size={18} />
          <span>保持可能範囲</span>
          <strong>{formatRanges(result.holdableRanges)}</strong>
        </article>
        <article className="metric">
          <Gauge size={18} />
          <span>最大操作力</span>
          <strong>
            開 {formatForce(result.maxOpenForceN, input.forceUnit)} / 閉 {formatForce(result.maxCloseForceN, input.forceUnit)}
          </strong>
          <small>{result.operationLabel}</small>
        </article>
      </div>

      <div className="current-strip">
        <span>{input.currentAngleDeg.toFixed(0)}°</span>
        <b>必要 {formatNumber(currentPoint.requiredTorqueKgfcm, 1)} kgf·cm</b>
        <b>ヒンジ最小 {formatNumber(currentPoint.hingeMinKgfcm, 1)} kgf·cm</b>
        <b>余裕 {formatNumber(currentPoint.holdingMarginKgfcm, 1)} kgf·cm</b>
      </div>
    </section>
  );
}
