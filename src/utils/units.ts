export const GRAVITY = 9.80665;
export const KGF_CM_TO_NM = 0.0980665;
export const NM_TO_KGF_CM = 1 / KGF_CM_TO_NM;

export function kgfcmToNm(value: number): number {
  return value * KGF_CM_TO_NM;
}

export function formatTorque(valueKgfcm: number | null | undefined, digits = 2): string {
  if (valueKgfcm === null || valueKgfcm === undefined) {
    return "-";
  }

  return `${formatNumber(kgfcmToNm(valueKgfcm), digits)} N·m`;
}

export function nToKgf(value: number): number {
  return value / GRAVITY;
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  if (!Number.isFinite(value)) {
    return "∞";
  }

  return value.toLocaleString("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatForce(valueN: number | null | undefined, unit: "N" | "kgf"): string {
  if (valueN === null || valueN === undefined) {
    return "-";
  }

  if (unit === "kgf") {
    return `${formatNumber(nToKgf(valueN), 2)} kgf`;
  }

  return `${formatNumber(valueN, 1)} N`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
