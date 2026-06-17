import { Box, ChevronRight, ClipboardPen, Database, Ruler, SlidersHorizontal, Upload } from "lucide-react";
import type { ApplicationType, HingeProduct, SimulationInput } from "../types";

interface InputPanelProps {
  input: SimulationInput;
  products: HingeProduct[];
  csvText: string;
  onCsvTextChange: (value: string) => void;
  onApplyCsv: () => void;
  onChange: (patch: Partial<SimulationInput>) => void;
}

const applicationOptions: Array<{ value: ApplicationType; label: string }> = [
  { value: "lid", label: "蓋" },
  { value: "monitor", label: "モニター" },
  { value: "panel", label: "操作パネル" },
  { value: "cover", label: "カバー" },
  { value: "other", label: "その他" },
];

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-unit">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <em>{unit}</em>
      </div>
    </label>
  );
}

export function InputPanel({ input, products, csvText, onCsvTextChange, onApplyCsv, onChange }: InputPanelProps) {
  return (
    <aside className="panel input-panel">
      <div className="panel-title">
        <SlidersHorizontal size={18} />
        <h2>条件入力</h2>
      </div>

      <div className="segmented" role="tablist" aria-label="入力モード">
        <button type="button" className="active">
          <Ruler size={16} />
          <span>2D入力</span>
        </button>
        <button type="button">
          <Box size={16} />
          <span>3D確認</span>
        </button>
      </div>

      <div className="input-section">
        <div className="section-label">
          <ClipboardPen size={16} />
          <h3>対象物</h3>
        </div>
        <label className="field">
          <span>対象物の種類</span>
          <select
            value={input.applicationType}
            onChange={(event) => onChange({ applicationType: event.target.value as ApplicationType })}
          >
            {applicationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field-grid two">
          <NumberField label="重量" unit="kg" min={0} step={0.1} value={input.weightKg} onChange={(weightKg) => onChange({ weightKg })} />
          <NumberField label="ヒンジ個数" unit="個" min={1} step={1} value={input.hingeCount} onChange={(hingeCount) => onChange({ hingeCount })} />
          <NumberField label="幅" unit="mm" min={1} value={input.objectWidthMm} onChange={(objectWidthMm) => onChange({ objectWidthMm })} />
          <NumberField label="高さ" unit="mm" min={1} value={input.objectHeightMm} onChange={(objectHeightMm) => onChange({ objectHeightMm })} />
          <NumberField label="奥行き" unit="mm" min={1} value={input.objectDepthMm} onChange={(objectDepthMm) => onChange({ objectDepthMm })} />
          <NumberField label="安全率" unit="倍" min={1} step={0.05} value={input.safetyFactor} onChange={(safetyFactor) => onChange({ safetyFactor })} />
        </div>
      </div>

      <div className="input-section">
        <div className="section-label">
          <Ruler size={16} />
          <h3>重心・角度</h3>
        </div>
        <div className="field-grid two">
          <NumberField label="重心X距離" unit="mm" step={1} value={input.cgXmm} onChange={(cgXmm) => onChange({ cgXmm })} />
          <NumberField label="重心Y距離" unit="mm" step={1} value={input.cgYmm} onChange={(cgYmm) => onChange({ cgYmm })} />
          <NumberField label="初期角度" unit="deg" step={1} value={input.initialAngleDeg} onChange={(initialAngleDeg) => onChange({ initialAngleDeg })} />
          <NumberField label="角度刻み" unit="deg" min={1} step={1} value={input.angleStepDeg} onChange={(angleStepDeg) => onChange({ angleStepDeg })} />
          <NumberField label="可動開始" unit="deg" step={1} value={input.angleStartDeg} onChange={(angleStartDeg) => onChange({ angleStartDeg })} />
          <NumberField label="可動終了" unit="deg" step={1} value={input.angleEndDeg} onChange={(angleEndDeg) => onChange({ angleEndDeg })} />
        </div>
        <label className="field range-field">
          <span>現在角度</span>
          <input
            type="range"
            value={input.currentAngleDeg}
            min={Math.min(input.angleStartDeg, input.angleEndDeg)}
            max={Math.max(input.angleStartDeg, input.angleEndDeg)}
            step={input.angleStepDeg}
            onChange={(event) => onChange({ currentAngleDeg: Number(event.target.value) })}
          />
          <strong>{input.currentAngleDeg.toFixed(0)}°</strong>
        </label>
      </div>

      <div className="input-section">
        <div className="section-label">
          <ChevronRight size={16} />
          <h3>操作・ヒンジ</h3>
        </div>
        <div className="field-grid two">
          <NumberField label="操作点距離" unit="mm" min={1} value={input.handleDistanceMm} onChange={(handleDistanceMm) => onChange({ handleDistanceMm })} />
          <label className="field">
            <span>操作力単位</span>
            <select value={input.forceUnit} onChange={(event) => onChange({ forceUnit: event.target.value as "N" | "kgf" })}>
              <option value="N">N</option>
              <option value="kgf">kgf</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>ヒンジ型式</span>
          <select
            value={input.selectedProductCode}
            onChange={(event) => onChange({ selectedProductCode: event.target.value })}
          >
            {products.map((product) => (
              <option key={product.productCode} value={product.productCode}>
                {product.productCode} / {product.productName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="input-section csv-section">
        <div className="section-label">
          <Database size={16} />
          <h3>トルクCSV</h3>
        </div>
        <textarea value={csvText} onChange={(event) => onCsvTextChange(event.target.value)} spellCheck={false} />
        <button type="button" className="primary-button" onClick={onApplyCsv}>
          <Upload size={16} />
          <span>CSV反映</span>
        </button>
      </div>
    </aside>
  );
}
