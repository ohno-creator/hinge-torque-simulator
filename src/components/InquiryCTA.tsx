import { useMemo, useState } from "react";
import { Clipboard, Send } from "lucide-react";
import type { Recommendation, SimulationInput, SimulationResult } from "../types";
import { formatTorque, kgfcmToNm } from "../utils/units";

interface InquiryCTAProps {
  input: SimulationInput;
  result: SimulationResult;
  recommendations: Recommendation[];
}

const applicationLabels = {
  lid: "蓋",
  monitor: "モニター",
  panel: "操作パネル",
  cover: "カバー",
  other: "その他",
};

export function InquiryCTA({ input, result, recommendations }: InquiryCTAProps) {
  const [copied, setCopied] = useState(false);
  const recommended = recommendations[0]?.product.productName ?? "-";
  const payload = useMemo(
    () => ({
      application: applicationLabels[input.applicationType],
      weightKg: input.weightKg,
      hingeCount: input.hingeCount,
      cgXmm: input.cgXmm,
      cgYmm: input.cgYmm,
      angleStartDeg: input.angleStartDeg,
      angleEndDeg: input.angleEndDeg,
      handleDistanceMm: input.handleDistanceMm,
      maxRequiredTorqueNm: Number(kgfcmToNm(result.maxRequiredTorqueKgfcm).toFixed(3)),
      minHoldingMarginNm: result.minHoldingMarginKgfcm === null ? null : Number(kgfcmToNm(result.minHoldingMarginKgfcm).toFixed(3)),
      maxOpenForceN: result.maxOpenForceN === null ? null : Number(result.maxOpenForceN.toFixed(1)),
      maxCloseForceN: result.maxCloseForceN === null ? null : Number(result.maxCloseForceN.toFixed(1)),
      recommendedProduct: recommended,
    }),
    [input, recommended, result],
  );

  const payloadText = JSON.stringify(payload, null, 2);

  async function copyPayload() {
    await navigator.clipboard.writeText(payloadText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="inquiry-box">
      <div className="inquiry-highlight">
        <Send size={18} />
        <div>
          <strong>この条件でヒンジ選定を相談する</strong>
          <span>
            最大必要トルク {formatTorque(result.maxRequiredTorqueKgfcm)} / hinge、候補 {recommended}
          </span>
        </div>
      </div>
      <textarea readOnly value={payloadText} spellCheck={false} />
      <button type="button" className="primary-button" onClick={copyPayload}>
        <Clipboard size={16} />
        <span>{copied ? "コピー済み" : "条件をコピー"}</span>
      </button>
    </div>
  );
}
