import type { HingeProduct, HoldStatus, Recommendation, SimulationInput } from "../types";
import { computeSimulation } from "./calculations";

function forcePenalty(maxForceN: number | null): number {
  if (maxForceN === null) {
    return 25;
  }
  if (maxForceN <= 30) {
    return 0;
  }
  if (maxForceN <= 50) {
    return 10;
  }
  return 28;
}

export function recommendProducts(input: SimulationInput, products: HingeProduct[]): Recommendation[] {
  return products
    .map((product) => {
      const result = computeSimulation(input, product);
      const angleCovered =
        input.angleStartDeg >= product.angleRangeDeg[0] && input.angleEndDeg <= product.angleRangeDeg[1];
      const appMatch = product.recommendedApplications.includes(input.applicationType);
      const maxForceN = Math.max(result.maxOpenForceN ?? 0, result.maxCloseForceN ?? 0);
      const marginRatio = result.minHoldingMarginRatio ?? 0;

      let score = 100;
      if (!angleCovered) {
        score -= 60;
      }
      if (result.overallStatus === "ng") {
        score -= 45;
      } else if (result.overallStatus === "check") {
        score -= 16;
      }

      if (marginRatio > 2.4) {
        score -= 10;
      } else if (marginRatio >= 1.15 && marginRatio <= 2.0) {
        score += 8;
      }

      score -= forcePenalty(maxForceN);
      if (appMatch) {
        score += 10;
      }

      let status: HoldStatus = result.overallStatus;
      if (!angleCovered) {
        status = "ng";
      }

      const reason =
        status === "ok"
          ? "保持余裕と操作力のバランスが良好"
          : status === "check"
            ? "保持可能だが余裕が小さい角度あり"
            : angleCovered
              ? "保持不足の角度あり"
              : "可動角度範囲が不足";

      return {
        product,
        result,
        score,
        status,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);
}
