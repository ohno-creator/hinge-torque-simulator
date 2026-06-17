import type { HingeProduct, TorqueCurvePoint } from "../types";

type TorqueKey = keyof Omit<TorqueCurvePoint, "angleDeg">;

export function sortCurve(curve: TorqueCurvePoint[]): TorqueCurvePoint[] {
  return [...curve].sort((a, b) => a.angleDeg - b.angleDeg);
}

export function interpolateTorque(
  curve: TorqueCurvePoint[],
  angleDeg: number,
  key: TorqueKey,
): number | null {
  const sorted = sortCurve(curve);
  if (sorted.length === 0) {
    return null;
  }

  if (angleDeg < sorted[0].angleDeg || angleDeg > sorted[sorted.length - 1].angleDeg) {
    return null;
  }

  const exact = sorted.find((point) => point.angleDeg === angleDeg);
  if (exact) {
    return exact[key];
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = sorted[index];
    const end = sorted[index + 1];
    if (angleDeg >= start.angleDeg && angleDeg <= end.angleDeg) {
      const ratio = (angleDeg - start.angleDeg) / (end.angleDeg - start.angleDeg);
      return start[key] + (end[key] - start[key]) * ratio;
    }
  }

  return null;
}

export function getHoldingTorques(product: HingeProduct, angleDeg: number) {
  const openMin = interpolateTorque(product.curve, angleDeg, "openTorqueMin");
  const openNominal = interpolateTorque(product.curve, angleDeg, "openTorqueNominal");
  const openMax = interpolateTorque(product.curve, angleDeg, "openTorqueMax");
  const closeMin = interpolateTorque(product.curve, angleDeg, "closeTorqueMin");
  const closeNominal = interpolateTorque(product.curve, angleDeg, "closeTorqueNominal");
  const closeMax = interpolateTorque(product.curve, angleDeg, "closeTorqueMax");

  if (
    openMin === null ||
    openNominal === null ||
    openMax === null ||
    closeMin === null ||
    closeNominal === null ||
    closeMax === null
  ) {
    return {
      min: null,
      nominal: null,
      max: null,
      openNominal: null,
      closeNominal: null,
    };
  }

  return {
    min: Math.min(openMin, closeMin),
    nominal: (openNominal + closeNominal) / 2,
    max: Math.max(openMax, closeMax),
    openNominal,
    closeNominal,
  };
}

export function parseTorqueCsv(csvText: string): TorqueCurvePoint[] {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  const dataRows = rows[0]?.toLowerCase().includes("angle") ? rows.slice(1) : rows;
  return dataRows
    .map((row) => row.split(",").map((cell) => Number(cell.trim())))
    .filter((values) => values.length >= 7 && values.every((value) => Number.isFinite(value)))
    .map(([angleDeg, openTorqueMin, openTorqueNominal, openTorqueMax, closeTorqueMin, closeTorqueNominal, closeTorqueMax]) => ({
      angleDeg,
      openTorqueMin,
      openTorqueNominal,
      openTorqueMax,
      closeTorqueMin,
      closeTorqueNominal,
      closeTorqueMax,
    }));
}

export function createCustomProduct(curve: TorqueCurvePoint[]): HingeProduct {
  const sorted = sortCurve(curve);
  const start = sorted[0]?.angleDeg ?? 0;
  const end = sorted[sorted.length - 1]?.angleDeg ?? 90;

  return {
    productCode: "CUSTOM",
    productName: "CSV入力ヒンジ",
    hingeType: "free_stop",
    angleRangeDeg: [start, end],
    torqueUnit: "kgfcm",
    recommendedApplications: ["lid", "monitor", "panel", "cover", "other"],
    note: "CSVで入力されたトルクカーブ",
    curve: sorted,
  };
}
