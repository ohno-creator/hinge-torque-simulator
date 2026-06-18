import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { ForceUnit, HoldStatus, Recommendation } from "../types";
import { formatForce, formatNumber, formatTorque } from "../utils/units";
import { FormulaTooltip } from "./FormulaTooltip";

interface ProductRecommendationsProps {
  recommendations: Recommendation[];
  forceUnit: ForceUnit;
}

function StatusMark({ status }: { status: HoldStatus }) {
  if (status === "ok") {
    return <CheckCircle2 size={18} />;
  }
  if (status === "check") {
    return <CircleDashed size={18} />;
  }
  return <AlertTriangle size={18} />;
}

const recommendationHelp = {
  minMargin: "この候補ヒンジで、全角度の 保持余裕 = 規格下限 - 必要トルク の最小値です。",
  marginRatio: "余裕率 = 規格下限 ÷ 必要トルク。1.0未満は保持不足、1.1未満は余裕小として扱います。",
  maxForce: "操作力 = 操作トルク N·m ÷ 操作点距離 m。開方向・閉方向の絶対値の最大です。",
};

export function ProductRecommendations({ recommendations, forceUnit }: ProductRecommendationsProps) {
  return (
    <div className="recommendation-list">
      {recommendations.slice(0, 4).map((recommendation, index) => {
        const maxForce = Math.max(recommendation.result.maxOpenForceN ?? 0, recommendation.result.maxCloseForceN ?? 0);
        return (
          <article className={`recommendation status-${recommendation.status}`} key={recommendation.product.productCode}>
            <div className="recommendation-head">
              <span>第{index + 1}候補</span>
              <StatusMark status={recommendation.status} />
            </div>
            <h3>{recommendation.product.productName}</h3>
            <p>
              {recommendation.product.productCode} / {recommendation.product.note}
            </p>
            <dl>
              <div>
                <dt className="definition-label">
                  <span>最小余裕</span>
                  <FormulaTooltip>{recommendationHelp.minMargin}</FormulaTooltip>
                </dt>
                <dd>{formatTorque(recommendation.result.minHoldingMarginKgfcm)}</dd>
              </div>
              <div>
                <dt className="definition-label">
                  <span>余裕率</span>
                  <FormulaTooltip>{recommendationHelp.marginRatio}</FormulaTooltip>
                </dt>
                <dd>{formatNumber(recommendation.result.minHoldingMarginRatio, 2)} 倍</dd>
              </div>
              <div>
                <dt className="definition-label">
                  <span>最大操作力</span>
                  <FormulaTooltip>{recommendationHelp.maxForce}</FormulaTooltip>
                </dt>
                <dd>{formatForce(maxForce, forceUnit)}</dd>
              </div>
            </dl>
            <strong>{recommendation.reason}</strong>
          </article>
        );
      })}
    </div>
  );
}
