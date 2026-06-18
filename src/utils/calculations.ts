import type { AngleRange, HingeProduct, HoldStatus, SimulationInput, SimulationPoint, SimulationResult } from "../types";
import { degToRad, GRAVITY, kgfcmToNm, NM_TO_KGF_CM } from "./units";
import { getHoldingTorques } from "./torqueCurve";

function createAngleSeries(startDeg: number, endDeg: number, stepDeg: number): number[] {
  const safeStep = Math.max(1, Math.abs(stepDeg || 1));
  const direction = endDeg >= startDeg ? 1 : -1;
  const points: number[] = [];
  let current = startDeg;

  for (let guard = 0; guard < 1000; guard += 1) {
    points.push(Number(current.toFixed(6)));
    const next = current + safeStep * direction;
    if ((direction > 0 && next >= endDeg) || (direction < 0 && next <= endDeg)) {
      break;
    }
    current = next;
  }

  if (points[points.length - 1] !== endDeg) {
    points.push(endDeg);
  }

  return points;
}

function buildRanges(points: SimulationPoint[], predicate: (point: SimulationPoint) => boolean): AngleRange[] {
  const ranges: AngleRange[] = [];
  let activeStart: number | null = null;
  let previousAngle: number | null = null;

  points.forEach((point) => {
    if (predicate(point)) {
      if (activeStart === null) {
        activeStart = point.angleDeg;
      }
      previousAngle = point.angleDeg;
      return;
    }

    if (activeStart !== null && previousAngle !== null) {
      ranges.push({ start: activeStart, end: previousAngle });
    }
    activeStart = null;
    previousAngle = null;
  });

  if (activeStart !== null && previousAngle !== null) {
    ranges.push({ start: activeStart, end: previousAngle });
  }

  return ranges;
}

function operationLabel(maxForceN: number | null): string {
  if (maxForceN === null) {
    return "判定外";
  }
  if (maxForceN <= 10) {
    return "軽い";
  }
  if (maxForceN <= 30) {
    return "標準";
  }
  if (maxForceN <= 50) {
    return "やや重い";
  }
  return "重い・要確認";
}

export function computeSimulation(input: SimulationInput, product: HingeProduct): SimulationResult {
  const hingeCount = Math.max(1, input.hingeCount);
  const handleDistanceM = Math.max(input.handleDistanceMm / 1000, 0.001);
  const x0m = input.cgXmm / 1000;
  const y0m = input.cgYmm / 1000;

  const points = createAngleSeries(input.angleStartDeg, input.angleEndDeg, input.angleStepDeg).map((angleDeg) => {
    const totalAngleRad = degToRad(input.initialAngleDeg + angleDeg);
    const cgXm = x0m * Math.cos(totalAngleRad) - y0m * Math.sin(totalAngleRad);
    const signedLoadMomentNm = input.weightKg * GRAVITY * cgXm;
    const signedLoadMomentKgfcm = (signedLoadMomentNm / hingeCount) * NM_TO_KGF_CM;
    const requiredTorqueKgfcm = Math.abs(signedLoadMomentKgfcm) * input.safetyFactor;
    const hingeTorque = getHoldingTorques(product, angleDeg);
    const holdingMarginKgfcm = hingeTorque.min === null ? null : hingeTorque.min - requiredTorqueKgfcm;
    const holdingMarginRatio =
      hingeTorque.min === null ? null : requiredTorqueKgfcm < 0.001 ? Infinity : hingeTorque.min / requiredTorqueKgfcm;
    const openOperationTorqueKgfcm =
      hingeTorque.openNominal === null ? null : hingeTorque.openNominal - signedLoadMomentKgfcm;
    const closeOperationTorqueKgfcm =
      hingeTorque.closeNominal === null ? null : hingeTorque.closeNominal + signedLoadMomentKgfcm;
    const openForceN =
      openOperationTorqueKgfcm === null ? null : kgfcmToNm(openOperationTorqueKgfcm) / handleDistanceM;
    const closeForceN =
      closeOperationTorqueKgfcm === null ? null : kgfcmToNm(closeOperationTorqueKgfcm) / handleDistanceM;

    let status: HoldStatus = "ok";
    if (holdingMarginKgfcm === null || holdingMarginKgfcm < 0) {
      status = "ng";
    } else if ((holdingMarginRatio ?? 0) < 1.1) {
      status = "check";
    }

    return {
      angleDeg,
      signedLoadMomentKgfcm,
      requiredTorqueKgfcm,
      hingeMinKgfcm: hingeTorque.min,
      hingeNominalKgfcm: hingeTorque.nominal,
      hingeMaxKgfcm: hingeTorque.max,
      hingeOpenMinKgfcm: hingeTorque.openMin,
      hingeOpenNominalKgfcm: hingeTorque.openNominal,
      hingeOpenMaxKgfcm: hingeTorque.openMax,
      hingeCloseMinKgfcm: hingeTorque.closeMin,
      hingeCloseNominalKgfcm: hingeTorque.closeNominal,
      hingeCloseMaxKgfcm: hingeTorque.closeMax,
      holdingMarginKgfcm,
      holdingMarginRatio,
      openOperationTorqueKgfcm,
      closeOperationTorqueKgfcm,
      openForceN,
      closeForceN,
      status,
    };
  });

  const maxRequiredTorqueKgfcm = Math.max(...points.map((point) => point.requiredTorqueKgfcm));
  const margins = points.filter((point) => point.holdingMarginKgfcm !== null);
  const minMarginPoint = margins.reduce<SimulationPoint | null>((lowest, point) => {
    if (!lowest || (point.holdingMarginKgfcm ?? Infinity) < (lowest.holdingMarginKgfcm ?? Infinity)) {
      return point;
    }
    return lowest;
  }, null);
  const openForces = points.flatMap((point) => (point.openForceN === null ? [] : [Math.abs(point.openForceN)]));
  const closeForces = points.flatMap((point) => (point.closeForceN === null ? [] : [Math.abs(point.closeForceN)]));
  const maxOpenForceN = openForces.length ? Math.max(...openForces) : null;
  const maxCloseForceN = closeForces.length ? Math.max(...closeForces) : null;
  const maxForceN =
    maxOpenForceN === null && maxCloseForceN === null ? null : Math.max(maxOpenForceN ?? 0, maxCloseForceN ?? 0);

  const deficitRanges = buildRanges(points, (point) => point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm < 0);
  const cautionRanges = buildRanges(
    points,
    (point) => point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm >= 0 && (point.holdingMarginRatio ?? 0) < 1.1,
  );
  const holdableRanges = buildRanges(points, (point) => point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm >= 0);
  const selfMotionRanges = buildRanges(
    points,
    (point) => (point.openForceN !== null && point.openForceN < 0) || (point.closeForceN !== null && point.closeForceN < 0),
  );

  let overallStatus: HoldStatus = "ok";
  if (deficitRanges.length > 0 || margins.length !== points.length) {
    overallStatus = "ng";
  } else if (cautionRanges.length > 0) {
    overallStatus = "check";
  }

  return {
    points,
    maxRequiredTorqueKgfcm,
    minHoldingMarginKgfcm: minMarginPoint?.holdingMarginKgfcm ?? null,
    minHoldingMarginAngleDeg: minMarginPoint?.angleDeg ?? null,
    minHoldingMarginRatio: minMarginPoint?.holdingMarginRatio ?? null,
    maxOpenForceN,
    maxCloseForceN,
    holdableRanges,
    cautionRanges,
    deficitRanges,
    selfMotionRanges,
    operationLabel: operationLabel(maxForceN),
    overallStatus,
  };
}

export function findPointAtAngle(points: SimulationPoint[], angleDeg: number): SimulationPoint {
  return points.reduce((nearest, point) => {
    return Math.abs(point.angleDeg - angleDeg) < Math.abs(nearest.angleDeg - angleDeg) ? point : nearest;
  }, points[0]);
}

export function formatRanges(ranges: AngleRange[]): string {
  if (ranges.length === 0) {
    return "該当なし";
  }

  return ranges.map((range) => `${range.start.toFixed(0)}〜${range.end.toFixed(0)}°`).join("、");
}
