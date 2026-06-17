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
import { nToKgf } from "../utils/units";

interface TorqueChartsProps {
  result: SimulationResult;
  forceUnit: ForceUnit;
}

function tooltipFormatter(value: unknown, name: unknown): [string, string] {
  if (typeof value !== "number") {
    return [String(value), String(name)];
  }

  return [value.toFixed(1), String(name)];
}

export function TorqueCharts({ result, forceUnit }: TorqueChartsProps) {
  const forceLabel = forceUnit === "kgf" ? "kgf" : "N";
  const forceValue = (value: number | null) => {
    if (value === null) {
      return null;
    }
    return forceUnit === "kgf" ? nToKgf(value) : value;
  };

  const torqueData = result.points.map((point) => ({
    angleDeg: point.angleDeg,
    required: point.requiredTorqueKgfcm,
    hingeMin: point.hingeMinKgfcm,
    hingeNominal: point.hingeNominalKgfcm,
    hingeMax: point.hingeMaxKgfcm,
  }));

  const marginData = result.points.map((point) => ({
    angleDeg: point.angleDeg,
    margin: point.holdingMarginKgfcm,
    positiveMargin: point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm >= 0 ? point.holdingMarginKgfcm : 0,
    negativeMargin: point.holdingMarginKgfcm !== null && point.holdingMarginKgfcm < 0 ? point.holdingMarginKgfcm : 0,
  }));

  const forceData = result.points.map((point) => ({
    angleDeg: point.angleDeg,
    openForce: forceValue(point.openForceN),
    closeForce: forceValue(point.closeForceN),
  }));

  return (
    <div className="chart-grid">
      <article className="chart-card wide-chart">
        <h3>対象物モーメント vs ヒンジトルク</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={torqueData} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde4df" />
            <XAxis dataKey="angleDeg" type="number" domain={["dataMin", "dataMax"]} tickLine={false} unit="°" />
            <YAxis tickLine={false} unit=" kgf·cm" width={74} />
            <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => `${label}°`} />
            <Legend />
            {result.holdableRanges.map((range) => (
              <ReferenceArea key={`${range.start}-${range.end}-ok`} x1={range.start} x2={range.end} fill="#dff5e9" fillOpacity={0.55} />
            ))}
            {result.deficitRanges.map((range) => (
              <ReferenceArea key={`${range.start}-${range.end}-ng`} x1={range.start} x2={range.end} fill="#fde2de" fillOpacity={0.62} />
            ))}
            <Line type="monotone" dataKey="required" name="必要トルク" stroke="#c2413d" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="hingeMin" name="ヒンジ最小" stroke="#0f8b65" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="hingeNominal" name="ヒンジ標準" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="hingeMax" name="ヒンジ最大" stroke="#7c5c2e" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </article>

      <article className="chart-card">
        <h3>保持余裕トルク</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={marginData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde4df" />
            <XAxis dataKey="angleDeg" type="number" domain={["dataMin", "dataMax"]} tickLine={false} unit="°" />
            <YAxis tickLine={false} width={58} />
            <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => `${label}°`} />
            <ReferenceLine y={0} stroke="#394150" strokeWidth={1.5} />
            <Area type="monotone" dataKey="positiveMargin" name="正の余裕" stroke="#0f8b65" fill="#0f8b65" fillOpacity={0.22} />
            <Area type="monotone" dataKey="negativeMargin" name="不足" stroke="#c2413d" fill="#c2413d" fillOpacity={0.24} />
            <Line type="monotone" dataKey="margin" name="保持余裕" stroke="#20262e" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </article>

      <article className="chart-card">
        <h3>操作力カーブ</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={forceData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde4df" />
            <XAxis dataKey="angleDeg" type="number" domain={["dataMin", "dataMax"]} tickLine={false} unit="°" />
            <YAxis tickLine={false} width={58} unit={` ${forceLabel}`} />
            <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => `${label}°`} />
            <ReferenceLine y={0} stroke="#394150" strokeWidth={1.4} />
            <ReferenceLine y={forceUnit === "kgf" ? nToKgf(30) : 30} stroke="#b7791f" strokeDasharray="5 5" />
            <ReferenceLine y={forceUnit === "kgf" ? nToKgf(50) : 50} stroke="#c2413d" strokeDasharray="5 5" />
            <Legend />
            <Line type="monotone" dataKey="openForce" name="開操作力" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="closeForce" name="閉操作力" stroke="#0f8b65" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
