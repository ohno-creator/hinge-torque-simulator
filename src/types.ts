export type ApplicationType = "lid" | "monitor" | "panel" | "cover" | "other";

export type ForceUnit = "N" | "kgf";

export type HoldStatus = "ok" | "check" | "ng";

export interface SimulationInput {
  applicationType: ApplicationType;
  weightKg: number;
  objectWidthMm: number;
  objectHeightMm: number;
  objectDepthMm: number;
  hingeCount: number;
  safetyFactor: number;
  cgXmm: number;
  cgYmm: number;
  initialAngleDeg: number;
  angleStartDeg: number;
  angleEndDeg: number;
  angleStepDeg: number;
  handleDistanceMm: number;
  forceUnit: ForceUnit;
  selectedProductCode: string;
  currentAngleDeg: number;
}

export interface TorqueCurvePoint {
  angleDeg: number;
  openTorqueMin: number;
  openTorqueNominal: number;
  openTorqueMax: number;
  closeTorqueMin: number;
  closeTorqueNominal: number;
  closeTorqueMax: number;
}

export interface HingeProduct {
  productCode: string;
  productName: string;
  hingeType: "free_stop" | "greaseless" | "detent";
  angleRangeDeg: [number, number];
  torqueUnit: "kgfcm";
  torqueToleranceRatio?: number;
  recommendedApplications: ApplicationType[];
  note: string;
  curve: TorqueCurvePoint[];
}

export interface SimulationPoint {
  angleDeg: number;
  signedLoadMomentKgfcm: number;
  requiredTorqueKgfcm: number;
  hingeMinKgfcm: number | null;
  hingeNominalKgfcm: number | null;
  hingeMaxKgfcm: number | null;
  hingeOpenMinKgfcm: number | null;
  hingeOpenNominalKgfcm: number | null;
  hingeOpenMaxKgfcm: number | null;
  hingeCloseMinKgfcm: number | null;
  hingeCloseNominalKgfcm: number | null;
  hingeCloseMaxKgfcm: number | null;
  holdingMarginKgfcm: number | null;
  holdingMarginRatio: number | null;
  openOperationTorqueKgfcm: number | null;
  closeOperationTorqueKgfcm: number | null;
  openForceN: number | null;
  closeForceN: number | null;
  status: HoldStatus;
}

export interface AngleRange {
  start: number;
  end: number;
}

export interface SimulationResult {
  points: SimulationPoint[];
  maxRequiredTorqueKgfcm: number;
  minHoldingMarginKgfcm: number | null;
  minHoldingMarginAngleDeg: number | null;
  minHoldingMarginRatio: number | null;
  maxOpenForceN: number | null;
  maxCloseForceN: number | null;
  holdableRanges: AngleRange[];
  cautionRanges: AngleRange[];
  deficitRanges: AngleRange[];
  selfMotionRanges: AngleRange[];
  operationLabel: string;
  overallStatus: HoldStatus;
}

export interface Recommendation {
  product: HingeProduct;
  result: SimulationResult;
  score: number;
  status: HoldStatus;
  reason: string;
}
