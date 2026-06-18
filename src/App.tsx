import { lazy, Suspense, useMemo, useState } from "react";
import { BarChart3, Box, FileText, Gauge, Mail, Target } from "lucide-react";
import { hingeProducts } from "./data/hingeProducts";
import { computeSimulation, findPointAtAngle } from "./utils/calculations";
import { createCustomProduct, parseTorqueCsv } from "./utils/torqueCurve";
import { recommendProducts } from "./utils/productSelector";
import { clamp } from "./utils/units";
import type { HingeProduct, SimulationInput } from "./types";
import { InputPanel } from "./components/InputPanel";
import { ResultSummary } from "./components/ResultSummary";
import { Object2DViewer } from "./components/Object2DViewer";
import { ProductRecommendations } from "./components/ProductRecommendations";
import { InquiryCTA } from "./components/InquiryCTA";
import { SeoFaq } from "./components/SeoFaq";

const TorqueCharts = lazy(() => import("./components/TorqueCharts").then((module) => ({ default: module.TorqueCharts })));
const Object3DViewer = lazy(() => import("./components/Object3DViewer").then((module) => ({ default: module.Object3DViewer })));

const defaultInput: SimulationInput = {
  applicationType: "panel",
  weightKg: 1.2,
  objectWidthMm: 420,
  objectHeightMm: 280,
  objectDepthMm: 80,
  hingeCount: 2,
  safetyFactor: 1.3,
  cgXmm: 95,
  cgYmm: 35,
  initialAngleDeg: 0,
  angleStartDeg: 0,
  angleEndDeg: 120,
  angleStepDeg: 5,
  handleDistanceMm: 210,
  forceUnit: "N",
  selectedProductCode: "FS-B14",
  currentAngleDeg: 60,
};

const sampleCsv = `angleDeg,openTorqueMin,openTorqueNominal,openTorqueMax,closeTorqueMin,closeTorqueNominal,closeTorqueMax
0,0.917,1.079,1.241,0.834,0.981,1.128
30,1.000,1.177,1.354,0.900,1.059,1.218
60,1.100,1.294,1.488,0.983,1.157,1.331
90,0.959,1.128,1.297,0.875,1.030,1.184
120,0.900,1.059,1.218,0.817,0.961,1.105`;

function App() {
  const [input, setInput] = useState<SimulationInput>(defaultInput);
  const [csvText, setCsvText] = useState(sampleCsv);
  const [customProduct, setCustomProduct] = useState<HingeProduct | null>(null);

  const products = useMemo(() => (customProduct ? [customProduct, ...hingeProducts] : hingeProducts), [customProduct]);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.productCode === input.selectedProductCode) ?? products[0];
  }, [input.selectedProductCode, products]);

  const result = useMemo(() => computeSimulation(input, selectedProduct), [input, selectedProduct]);
  const currentPoint = useMemo(() => findPointAtAngle(result.points, input.currentAngleDeg), [input.currentAngleDeg, result.points]);
  const recommendations = useMemo(() => recommendProducts(input, products), [input, products]);

  function updateInput(patch: Partial<SimulationInput>) {
    setInput((previous) => {
      const next = { ...previous, ...patch };
      const angleMin = Math.min(next.angleStartDeg, next.angleEndDeg);
      const angleMax = Math.max(next.angleStartDeg, next.angleEndDeg);
      const objectHeightMm = Math.max(1, next.objectHeightMm);
      return {
        ...next,
        objectHeightMm,
        hingeCount: Math.max(1, Math.round(next.hingeCount)),
        angleStepDeg: Math.max(1, next.angleStepDeg),
        currentAngleDeg: clamp(next.currentAngleDeg, angleMin, angleMax),
        handleDistanceMm: clamp(next.handleDistanceMm, 0, objectHeightMm),
      };
    });
  }

  function applyCsvCurve() {
    const curve = parseTorqueCsv(csvText);
    if (curve.length < 2) {
      return;
    }

    const nextProduct = createCustomProduct(curve);
    setCustomProduct(nextProduct);
    updateInput({
      selectedProductCode: nextProduct.productCode,
      angleStartDeg: nextProduct.angleRangeDeg[0],
      angleEndDeg: nextProduct.angleRangeDeg[1],
      currentAngleDeg: nextProduct.angleRangeDeg[0],
    });
  }

  return (
    <div className="app">
      <div className="app-screen">
        <header className="app-header">
          <div>
            <p className="eyebrow">HINGE TORQUE SIMULATOR</p>
            <h1>ヒンジ トルク計算・保持力シミュレーター</h1>
            <p className="lead">重量、重心、可動角度から、必要トルク・保持余裕・操作力を同時に確認できます。</p>
          </div>
          <div className={`status-pill status-${result.overallStatus}`}>
            <Gauge size={18} />
            <span>{result.overallStatus === "ok" ? "保持可能" : result.overallStatus === "check" ? "余裕小" : "保持不足"}</span>
          </div>
        </header>

        <main className="workspace">
          <InputPanel
            input={input}
            products={products}
            csvText={csvText}
            onCsvTextChange={setCsvText}
            onApplyCsv={applyCsvCurve}
            onChange={updateInput}
          />

          <section className="main-stack" aria-label="計算結果">
            <ResultSummary input={input} product={selectedProduct} result={result} currentPoint={currentPoint} />

            <section className="visual-grid">
              <div className="panel visual-panel">
                <div className="panel-title">
                  <Target size={18} />
                  <h2>2D保持確認</h2>
                </div>
                <Object2DViewer
                  input={input}
                  currentPoint={currentPoint}
                  product={selectedProduct}
                  onHandleDistanceChange={(handleDistanceMm) => updateInput({ handleDistanceMm })}
                />
              </div>
              <div className="panel visual-panel">
                <div className="panel-title">
                  <Box size={18} />
                  <h2>3D確認</h2>
                </div>
                <Suspense fallback={<div className="loader-panel">3Dビューを読み込み中</div>}>
                  <Object3DViewer input={input} currentPoint={currentPoint} />
                </Suspense>
              </div>
            </section>

            <section className="panel">
              <div className="panel-title">
                <BarChart3 size={18} />
                <h2>トルク・余裕・操作力</h2>
              </div>
              <Suspense fallback={<div className="loader-panel">グラフを読み込み中</div>}>
                <TorqueCharts result={result} forceUnit={input.forceUnit} currentAngleDeg={input.currentAngleDeg} />
              </Suspense>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <div className="panel-title">
                  <FileText size={18} />
                  <h2>推奨ヒンジ候補</h2>
                </div>
                <ProductRecommendations recommendations={recommendations} forceUnit={input.forceUnit} />
              </div>
              <div className="panel">
                <div className="panel-title">
                  <Mail size={18} />
                  <h2>問い合わせ条件</h2>
                </div>
                <InquiryCTA input={input} result={result} recommendations={recommendations} />
              </div>
            </section>
          </section>
        </main>
      </div>

      <SeoFaq />
    </div>
  );
}

export default App;
