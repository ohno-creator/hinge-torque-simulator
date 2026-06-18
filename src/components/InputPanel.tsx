import { useEffect, useState } from "react";
import { Box, ChevronRight, ClipboardPen, Database, Ruler, SlidersHorizontal, Upload } from "lucide-react";
import type { ApplicationType, HingeProduct, SimulationInput } from "../types";
import { FormulaTooltip } from "./FormulaTooltip";

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

const parameterHelp = {
  applicationType: "推奨ヒンジ候補の用途適合に使います。トルク計算式そのものには直接入りません。",
  weightKg: "荷重 = 重量 kg × 9.80665 m/s²。対象物モーメントの元になる値です。",
  hingeCount: "ヒンジ1個あたりの必要トルク = 全体モーメント ÷ ヒンジ個数 × 安全率。",
  objectWidthMm: "3D表示と問い合わせ条件に使います。現在の保持トルク計算では回転モーメントに直接入りません。",
  objectHeightMm: "2D/3D図のヒンジから先端までの長さです。操作点距離の上限にも使います。",
  objectDepthMm: "2D/3D図の厚み表現に使います。現在の保持トルク計算では回転モーメントに直接入りません。",
  safetyFactor: "必要トルク = |対象物モーメント| × 安全率。取付ばらつきや実荷重を見込む倍率です。",
  cgXmm: "回転後の水平距離 X' = 重心X × cos(合成角度) - 重心Y × sin(合成角度)。モーメントアームになります。",
  cgYmm: "回転後の水平距離 X' に -重心Y × sin(合成角度) として効きます。",
  initialAngleDeg: "合成角度 = 初期角度 + 現在角度。重心位置を回転させる基準角です。",
  angleStepDeg: "グラフと判定点を何度刻みで計算するかを決めます。小さいほど細かく確認できます。",
  angleStartDeg: "計算する角度範囲の開始値です。現在角度スライダーの下限にもなります。",
  angleEndDeg: "計算する角度範囲の終了値です。現在角度スライダーの上限にもなります。",
  currentAngleDeg: "2D/3D図、現在値サマリー、グラフ上の縦線に使う角度です。合成角度 = 初期角度 + 現在角度。",
  handleDistanceMm: "操作力 = 操作トルク N·m ÷ (操作点距離 mm ÷ 1000)。距離が長いほど必要な手元力は小さくなります。",
  forceUnit: "操作力の表示単位です。内部計算はNで行い、必要に応じてkgfへ換算します。",
  selectedProductCode: "選択したヒンジのトルクカーブを角度ごとに参照し、規格下限・標準・上限を判定に使います。",
  torqueCsv: "CSVのトルク値はN·mとして読み込みます。内部ではkgf·cmへ換算し、標準±15%の規格線を作ります。",
};

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
  help,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
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
    <div className="field">
      <span className="field-label-row">
        <span>{label}</span>
        {help ? <FormulaTooltip>{help}</FormulaTooltip> : null}
      </span>
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
    </div>
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
        <div className="field">
          <span className="field-label-row">
            <span>対象物の種類</span>
            <FormulaTooltip>{parameterHelp.applicationType}</FormulaTooltip>
          </span>
          <select
            aria-label="対象物の種類"
            value={input.applicationType}
            onChange={(event) => onChange({ applicationType: event.target.value as ApplicationType })}
          >
            {applicationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-grid two">
          <NumberField label="重量" unit="kg" min={0} step={0.1} value={input.weightKg} help={parameterHelp.weightKg} onChange={(weightKg) => onChange({ weightKg })} />
          <NumberField label="ヒンジ個数" unit="個" min={1} step={1} value={input.hingeCount} help={parameterHelp.hingeCount} onChange={(hingeCount) => onChange({ hingeCount })} />
          <NumberField label="幅" unit="mm" min={1} value={input.objectWidthMm} help={parameterHelp.objectWidthMm} onChange={(objectWidthMm) => onChange({ objectWidthMm })} />
          <NumberField label="高さ" unit="mm" min={1} value={input.objectHeightMm} help={parameterHelp.objectHeightMm} onChange={(objectHeightMm) => onChange({ objectHeightMm })} />
          <NumberField label="奥行き" unit="mm" min={1} value={input.objectDepthMm} help={parameterHelp.objectDepthMm} onChange={(objectDepthMm) => onChange({ objectDepthMm })} />
          <NumberField label="安全率" unit="倍" min={1} step={0.05} value={input.safetyFactor} help={parameterHelp.safetyFactor} onChange={(safetyFactor) => onChange({ safetyFactor })} />
        </div>
      </div>

      <div className="input-section">
        <div className="section-label">
          <Ruler size={16} />
          <h3>重心・角度</h3>
        </div>
        <div className="field-grid two">
          <NumberField label="重心X距離" unit="mm" step={1} value={input.cgXmm} help={parameterHelp.cgXmm} onChange={(cgXmm) => onChange({ cgXmm })} />
          <NumberField label="重心Y距離" unit="mm" step={1} value={input.cgYmm} help={parameterHelp.cgYmm} onChange={(cgYmm) => onChange({ cgYmm })} />
          <NumberField label="初期角度" unit="deg" step={1} value={input.initialAngleDeg} help={parameterHelp.initialAngleDeg} onChange={(initialAngleDeg) => onChange({ initialAngleDeg })} />
          <NumberField label="角度刻み" unit="deg" min={1} step={1} value={input.angleStepDeg} help={parameterHelp.angleStepDeg} onChange={(angleStepDeg) => onChange({ angleStepDeg })} />
          <NumberField label="可動開始" unit="deg" step={1} value={input.angleStartDeg} help={parameterHelp.angleStartDeg} onChange={(angleStartDeg) => onChange({ angleStartDeg })} />
          <NumberField label="可動終了" unit="deg" step={1} value={input.angleEndDeg} help={parameterHelp.angleEndDeg} onChange={(angleEndDeg) => onChange({ angleEndDeg })} />
        </div>
        <div className="field range-field">
          <span className="field-label-row">
            <span>現在角度</span>
            <FormulaTooltip>{parameterHelp.currentAngleDeg}</FormulaTooltip>
          </span>
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
              help={parameterHelp.currentAngleDeg}
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
          <NumberField
            label="操作点距離"
            unit="mm"
            min={0}
            max={input.objectHeightMm}
            value={input.handleDistanceMm}
            help={parameterHelp.handleDistanceMm}
            onChange={(handleDistanceMm) => onChange({ handleDistanceMm })}
          />
          <div className="field">
            <span className="field-label-row">
              <span>操作力単位</span>
              <FormulaTooltip>{parameterHelp.forceUnit}</FormulaTooltip>
            </span>
            <select
              aria-label="操作力単位"
              value={input.forceUnit}
              onChange={(event) => onChange({ forceUnit: event.target.value as "N" | "kgf" })}
            >
              <option value="N">N</option>
              <option value="kgf">kgf</option>
            </select>
          </div>
        </div>
        <div className="field">
          <span className="field-label-row">
            <span>ヒンジ型式</span>
            <FormulaTooltip>{parameterHelp.selectedProductCode}</FormulaTooltip>
          </span>
          <select
            aria-label="ヒンジ型式"
            value={input.selectedProductCode}
            onChange={(event) => onChange({ selectedProductCode: event.target.value })}
          >
            {products.map((product) => (
              <option key={product.productCode} value={product.productCode}>
                {product.productCode} / {product.productName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="input-section csv-section">
        <div className="section-label">
          <Database size={16} />
          <h3>トルクCSV（N·m）</h3>
          <FormulaTooltip>{parameterHelp.torqueCsv}</FormulaTooltip>
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
