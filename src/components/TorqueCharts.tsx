import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForceUnit, SimulationResult } from "../types";
import { formatNumber, kgfcmToNm, nToKgf } from "../utils/units";
import { FormulaTooltip } from "./FormulaTooltip";

interface TorqueChartsProps {
  result: SimulationResult;
  forceUnit: ForceUnit;
  currentAngleDeg: number;
}

function torqueTooltipFormatter(value: unknown, name: unknown): [string, string] {
  if (typeof value !== "number") {
    return [String(value), String(name)];
  }

  return [`${formatNumber(value, 2)} N·m`, String(name)];
}

function forceTooltipFormatter(forceLabel: string) {
  return (value: unknown, name: unknown): [string, string] => {
    if (typeof value !== "number") {
      return [String(value), String(name)];
    }

    return [`${formatNumber(value, forceLabel === "kgf" ? 2 : 1)} ${forceLabel}`, String(name)];
  };
}

const chartHelp = {
  torque: "赤線は必要トルク、緑線はヒンジ規格下限です。必要トルク = |重量×9.80665×回転後X距離| ÷ ヒンジ個数 × 安全率。",
  margin: "保持余裕 = ヒンジ規格下限 - 必要トルク。0を下回る角度は保持不足として赤く表示します。",
  force: "操作力 = 操作トルク N·m ÷ (操作点距離 mm ÷ 1000)。30N/50Nの目安線も表示します。",
};

export function TorqueCharts({ result, forceUnit, currentAngleDeg }: TorqueChartsProps) {
  const forceLabel = forceUnit === "kgf" ? "kgf" : "N";
  const currentAngleLine = (
    <ReferenceLine x={currentAngleDeg} stroke="#20262e" strokeWidth={2} strokeDasharray="4 4" />
  );
  const forceValue = (value: number | null) => {
    if (value === null) {
      return null;
    }
    return forceUnit === "kgf" ? nToKgf(value) : value;
  };

  const torqueData = result.points.map((point) => ({
    angleDeg: point.angleDeg,
    required: kgfcmToNm(point.requiredTorqueKgfcm),
    hingeMin: point.hingeMinKgfcm === null ? null : kgfcmToNm(point.hingeMinKgfcm),
    hingeMax: point.hingeMaxKgfcm === null ? null : kgfcmToNm(point.hingeMaxKgfcm),
    openNominal: point.hingeOpenNominalKgfcm === null ? null : kgfcmToNm(point.hingeOpenNominalKgfcm),
    closeNominal: point.hingeCloseNominalKgfcm === null ? null : kgfcmToNm(point.hingeCloseNominalKgfcm),
  }));

  const marginData = result.points.map((point) => ({
    angleDeg: point.angleDeg,
    margin: point.holdingMarginKgfcm === null ? null : kgfcmToNm(point.holdingMarginKgfcm),
    positiveMargin: point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm >= 0 ? kgfcmToNm(point.holdingMarginKgfcm) : 0,
    negativeMargin: point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm < 0 ? kgfcmToNm(point.holdingMarginKgfcm) : 0,
  }));

  const forceData = result.points.map((point) => ({
    angleDeg: point.angleDeg,
    openForce: forceValue(point.openForceN),
    closeForce: forceValue(point.closeForceN),
  }));

  return (
    <div className="chart-grid">
      <article className="chart-card wide-chart">
        <h3 className="chart-title-with-help">
          <span>対象物モーメント vs ヒンジトルク規格（標準±15%）</span>
          <FormulaTooltip>{chartHelp.torque}</FormulaTooltip>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={torqueData} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde4df" />
            <XAxis dataKey="angleDeg" type="number" domain={["dataMin", "dataMax"]} tickLine={false} unit="°" />
            <YAxis tickLine={false} unit=" N·m" width={70} />
            <Tooltip formatter={torqueTooltipFormatter} labelFormatter={(label) => `${label}°`} />
            <Legend />
            {result.holdableRanges.map((range) => (
              <ReferenceArea key={`${range.start}-${range.end}-ok`} x1={range.start} x2={range.end} fill="#dff5e9" fillOpacity={0.55} />
            ))}
            {result.deficitRanges.map((range) => (
              <ReferenceArea key={`${range.start}-${range.end}-ng`} x1={range.start} x2={range.end} fill="#fde2de" fillOpacity={0.62} />
            ))}
            {currentAngleLine}
            <Line type="monotone" dataKey="required" name="必要トルク" stroke="#c2413d" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="hingeMin" name="規格下限 -15%" stroke="#0f8b65" strokeWidth={2.7} dot={false} />
            <Line type="monotone" dataKey="openNominal" name="開標準" stroke="#2563eb" strokeWidth={2.3} dot={false} />
            <Line type="monotone" dataKey="closeNominal" name="閉標準" stroke="#7c5c2e" strokeWidth={2.3} dot={false} />
            <Line type="monotone" dataKey="hingeMax" name="規格上限 +15%" stroke="#64748b" strokeWidth={1.8} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </article>

      <article className="chart-card">
        <h3 className="chart-title-with-help">
          <span>保持余裕トルク</span>
          <FormulaTooltip>{chartHelp.margin}</FormulaTooltip>
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={marginData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde4df" />
            <XAxis dataKey="angleDeg" type="number" domain={["dataMin", "dataMax"]} tickLine={false} unit="°" />
            <YAxis tickLine={false} width={64} unit=" N·m" />
            <Tooltip formatter={torqueTooltipFormatter} labelFormatter={(label) => `${label}°`} />
            <ReferenceLine y={0} stroke="#394150" strokeWidth={1.5} />
            {currentAngleLine}
            <Area type="monotone" dataKey="positiveMargin" name="正の余裕" stroke="#0f8b65" fill="#0f8b65" fillOpacity={0.22} />
            <Area type="monotone" dataKey="negativeMargin" name="不足" stroke="#c2413d" fill="#c2413d" fillOpacity={0.24} />
            <Line type="monotone" dataKey="margin" name="保持余裕" stroke="#20262e" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </article>

      <article className="chart-card">
        <h3 className="chart-title-with-help">
          <span>操作力カーブ</span>
          <FormulaTooltip>{chartHelp.force}</FormulaTooltip>
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={forceData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde4df" />
            <XAxis dataKey="angleDeg" type="number" domain={["dataMin", "dataMax"]} tickLine={false} unit="°" />
            <YAxis tickLine={false} width={58} unit={` ${forceLabel}`} />
            <Tooltip formatter={forceTooltipFormatter(forceLabel)} labelFormatter={(label) => `${label}°`} />
            <ReferenceLine y={0} stroke="#394150" strokeWidth={1.4} />
            <ReferenceLine y={forceUnit === "kgf" ? nToKgf(30) : 30} stroke="#b7791f" strokeDasharray="5 5" />
            <ReferenceLine y={forceUnit === "kgf" ? nToKgf(50) : 50} stroke="#c2413d" strokeDasharray="5 5" />
            {currentAngleLine}
            <Legend />
            <Line type="monotone" dataKey="openForce" name="開操作力" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="closeForce" name="閉操作力" stroke="#0f8b65" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
