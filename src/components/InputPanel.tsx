import { useEffect, useState } from "react";
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

function normalizeNumberText(value: string): string {
  return value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[．，]/g, ".")
    .replace(/[−ー－]/g, "-")
    .replace(/,/g, ".");
}

function isIncompleteNumber(value: string): boolean {
  return value === "" || value === "-" || value === "." || value === "-.";
}

function clampNumber(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) {
    next = Math.max(min, next);
  }
  if (max !== undefined) {
    next = Math.min(max, next);
  }
  return next;
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
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
  const [textValue, setTextValue] = useState(String(value));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setTextValue(String(value));
    }
  }, [isEditing, value]);

  function commitText(nextText: string) {
    const normalized = normalizeNumberText(nextText.trim());
    const parsed = Number(normalized);

    if (isIncompleteNumber(normalized) || !Number.isFinite(parsed)) {
      setTextValue(String(value));
      return;
    }

    const clamped = clampNumber(parsed, min, max);
    onChange(clamped);
    setTextValue(String(clamped));
  }

  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-unit">
        <input
          type="text"
          inputMode="decimal"
          value={textValue}
          aria-label={`${label} (${unit})`}
          onFocus={() => setIsEditing(true)}
          onBlur={(event) => {
            setIsEditing(false);
            commitText(event.currentTarget.value);
          }}
          onChange={(event) => {
            const nextText = normalizeNumberText(event.target.value);
            setTextValue(nextText);

            if (isIncompleteNumber(nextText)) {
              return;
            }

            const parsed = Number(nextText);
            if (Number.isFinite(parsed)) {
              onChange(parsed);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setTextValue(String(value));
              event.currentTarget.blur();
            }
          }}
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
        <div className="field range-field">
          <span>現在角度</span>
          <div className="range-input-row">
            <input
              type="range"
              value={input.currentAngleDeg}
              min={Math.min(input.angleStartDeg, input.angleEndDeg)}
              max={Math.max(input.angleStartDeg, input.angleEndDeg)}
              step={input.angleStepDeg}
              aria-label="現在角度スライダー"
              onChange={(event) => onChange({ currentAngleDeg: Number(event.target.value) })}
            />
            <NumberField
              label="角度入力"
              unit="deg"
              step={input.angleStepDeg}
              min={Math.min(input.angleStartDeg, input.angleEndDeg)}
              max={Math.max(input.angleStartDeg, input.angleEndDeg)}
              value={input.currentAngleDeg}
              onChange={(currentAngleDeg) => onChange({ currentAngleDeg })}
            />
          </div>
        </div>
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
