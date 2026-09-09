import React from 'react';
import {
  HelpCircle,
  Crosshair,
  Ruler,
  Maximize2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export const SettingsHelpView: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto text-slate-100 select-none">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">System Guide & Documentation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Understanding the One Click detection pipeline, coordinate system, scale calibration, and AI integration
          </p>
        </div>

        {/* Section 1: One Click Space Detection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">How One Click Room Detection Works</h2>
              <p className="text-xs text-slate-400">Multi-layered deterministic computer vision and geometry</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              When you click <strong>ONE CLICK</strong> and click inside a room, the system does not use predefined or fake room templates. Instead, it processes the architectural drawing through an automated geometry pipeline:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 pl-2">
              <li>
                <strong className="text-slate-200">Coordinate Normalization:</strong> The mouse click is translated from viewport coordinates to normalized page coordinates <code className="text-brand-400">[0.0, 1.0]</code> relative to the PDF dimensions.
              </li>
              <li>
                <strong className="text-slate-200">Morphological Wall Mask:</strong> High-contrast architectural structural lines and walls are isolated, and a morphological closing filter bridges common drafting breaks like door swings and archways.
              </li>
              <li>
                <strong className="text-slate-200">BFS Flood Fill:</strong> Starting from your click point, free floor space expands outward until meeting wall boundaries. If an opening spills into the infinite page margin, it is detected as un-enclosed.
              </li>
              <li>
                <strong className="text-slate-200">Moore-Neighbor Contour Tracing:</strong> The exact perimeter boundary pixels of the enclosed room are traced sequentially.
              </li>
              <li>
                <strong className="text-slate-200">Ramer-Douglas-Peucker (RDP) Simplification:</strong> Hundreds of stair-stepped pixel edges are mathematically reduced into clean, straight architectural polygon vertices.
              </li>
              <li>
                <strong className="text-slate-200">Semantic Text & Area Association:</strong> The system searches for room labels (e.g., <em>Living Room, Master Bedroom, Office</em>) and explicit printed square meter annotations whose centroids lie inside the detected boundary.
              </li>
            </ol>
          </div>
        </div>

        {/* Section 2: Scale & Calibration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Scale Calibration & Accurate Area Calculation</h2>
              <p className="text-xs text-slate-400">Transforming pixel coordinates to real-world metric or imperial measurements</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Areas are calculated using the <strong>Shoelace Formula (Gauss&apos;s Area Formula)</strong> over the closed polygon vertices:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg font-mono text-center text-brand-300 text-[11px] border border-slate-800">
              Area = 0.5 × |∑ (x_i × y_{`{i+1}`} - x_{`{i+1}`} × y_i)|
            </div>
            <p>
              To convert this geometric area to real-world square meters (<code className="text-brand-400">m²</code>) or square feet (<code className="text-brand-400">sq ft</code>):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>
                <strong>Auto-Detection:</strong> The engine automatically parses printed scale text (e.g. <em>1:100, 1:50</em>) from drawing title blocks.
              </li>
              <li>
                <strong>Two-Point Calibration:</strong> Click <strong>Calibrate</strong>, click point A and point B along a dimension line with known length (e.g. 5.0m), and specify the distance. The system computes exact <code className="text-amber-400">pixelsPerMeter</code> and immediately updates all page takeoffs.
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Coordinate System */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Lossless Normalized Coordinate System</h2>
              <p className="text-xs text-slate-400">Zero drift during zooming, panning, or resizing</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              Browser screen pixels change whenever the user zooms, pans, or resizes the browser window.
              To ensure mathematical precision:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg font-mono text-slate-400 text-[11px] border border-slate-800">
              normalizedX = pdfX / pageWidth<br />
              normalizedY = pdfY / pageHeight<br />
              screenX = normalizedX × renderedPageWidth<br />
              screenY = normalizedY × renderedPageHeight
            </div>
            <p className="text-slate-400">
              All stored polygons in Firestore and backend databases are 100% normalized. When reopened on any screen size or resolution, annotations align with sub-pixel precision.
            </p>
          </div>
        </div>

        {/* Section 4: AI & Security */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Google Gemini AI Server Integration & Security</h2>
              <p className="text-xs text-slate-400">Semantic interpretation with strict server-side key isolation</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              In accordance with architectural SaaS engineering standards:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>
                The <code className="text-purple-400">GEMINI_API_KEY</code> is kept strictly on the Node.js backend server and is <strong>never exposed to client browser code</strong>.
              </li>
              <li>
                Gemini is used solely for semantic enrichment: cleaning OCR fragments and classifying architectural spaces.
              </li>
              <li>
                <strong>Gemini NEVER fabricates geometry or guesses areas.</strong> Geometry is always deterministic.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
