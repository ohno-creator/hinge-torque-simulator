import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { ForceUnit, HoldStatus, Recommendation } from "../types";
import { formatForce, formatNumber } from "../utils/units";

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
                <dt>最小余裕</dt>
                <dd>{formatNumber(recommendation.result.minHoldingMarginKgfcm, 1)} kgf·cm</dd>
              </div>
              <div>
                <dt>余裕率</dt>
                <dd>{formatNumber(recommendation.result.minHoldingMarginRatio, 2)} 倍</dd>
              </div>
              <div>
                <dt>最大操作力</dt>
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
