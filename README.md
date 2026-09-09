# Area Annotator — Intelligent PDF Floor Plan Measurement System

An enterprise-grade architectural PDF measurement and takeoff web application built with **React**, **TypeScript**, **Tailwind CSS**, **PDF.js**, **Express**, **Firebase Firestore & Storage**, and **Google Gemini AI**.

> [!NOTE]
> **Confidentiality Notice:**
> The application does not include confidential assessment drawings. All architectural drawings are loaded dynamically by the user/evaluator through the user interface or API.

---

## 1. Project Overview & Primary Workflow

Area Annotator is designed for architects, estimators, and construction professionals performing quantity takeoffs directly on digital blueprints:

```
UPLOAD PDF
   ↓
VIEW FLOOR PLAN
   ↓
ONE CLICK
   ↓
CLICK INSIDE ROOM
   ↓
DETECT ACTUAL ENCLOSED SPACE
   ↓
GENERATE ACTUAL BOUNDARY
   ↓
CALCULATE AREA
   ↓
HIGHLIGHT SPACE
   ↓
EDIT IF REQUIRED
   ↓
SAVE TO CLOUD / DATABASE
   ↓
REOPEN AT ANY TIME
   ↓
RESTORE EXACT ANNOTATIONS
```

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **PDF Engine**: PDF.js (v4.10) with decoupled Canvas and SVG Annotation Overlay
- **Backend API**: Node.js, Express, TypeScript, Multer
- **Persistence**: Firebase Firestore & Firebase Storage with automatic local filesystem/database fallback
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) via official `@google/generative-ai` SDK
- **Testing**: Vitest for unit & geometry testing

---

## 3. Core Architectural Principles

### 3.1. Lossless Normalized Coordinate System
Screen pixels change continuously when zooming, panning, or resizing browser windows.
To guarantee mathematical precision:

$$\text{normalizedX} = \frac{\text{pdfX}}{\text{pageWidth}} \quad \in [0, 1]$$
$$\text{normalizedY} = \frac{\text{pdfY}}{\text{pageHeight}} \quad \in [0, 1]$$

When rendering:
$$\text{screenX} = \text{normalizedX} \times \text{renderedPageWidth}$$
$$\text{screenY} = \text{normalizedY} \times \text{renderedPageHeight}$$

All annotations stored in Firestore or backend databases use normalized coordinates. Annotations remain permanently aligned across any zoom factor (40% to 400%), window resize, or devicePixelRatio.

### 3.2. Real Space Detection Pipeline (No Fake Data)
1. **Level 1 — PDF Native Data**: Extracts text glyphs, font matrices, coordinates, and vector drawing operators (`constructPath`, `lineTo`, `rect`).
2. **Level 2 — Architectural Wall Mask**: Isolates wall strokes and applies morphological closing to bridge door-swing gaps.
3. **Level 3 — Computer Vision & Geometry**:
   - Seeded BFS flood fill on free interior floor space.
   - External perimeter tracing via Moore-Neighbor algorithm.
   - Contour vertex reduction via Ramer-Douglas-Peucker (RDP) algorithm into clean architectural polygons.
   - Spatial hit-testing via Jordan curve ray-casting Point-In-Polygon (PIP).
4. **Level 4 — Gemini AI**:
   - Semantic room classification and label enhancement.
   - Strictly isolated on the backend server (`GEMINI_API_KEY` is never sent to the browser).
   - Gemini never fabricates coordinates or guesses areas when deterministic geometry exists.

### 3.3. Deterministic Area Calculation
Areas are calculated using the **Shoelace Formula (Gauss's Area Formula)**:

$$A_{\text{pixels}} = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$

With calibrated scale:
$$A_{\text{m}^2} = \frac{A_{\text{pixels}}}{(\text{pixelsPerMeter})^2}$$

Priority order:
1. Explicit area printed in PDF text (e.g. `28.5 m²`, `150 SF`)
2. Geometry + known scale (calibrated or auto-detected)
3. Dimension-derived
4. Unavailable (never fabricated)

---

## 4. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
# Server Port
PORT=3001
NODE_ENV=development

# Google Gemini API Key (SERVER-SIDE ONLY)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Client Configuration (Optional for cloud sync)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 5. Installation & Running

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Quick Start (Full-Stack Mode)
```bash
# Install dependencies
npm install

# Run frontend (Vite :5173) and backend (Express :3001) concurrently
npm run dev
```

Open your browser at `http://localhost:5173`.

### Running Server Independently
```bash
npm run server
```

### Running Frontend Independently
```bash
npm run dev:client
```

### Building for Production
```bash
npm run build
```

---

## 6. Running Tests

The test suite validates coordinates, ray-casting point-in-polygon, Shoelace formula, RDP simplification, undo/redo history, and wall mask detection:

```bash
npm run test
```

Test Results:
- `tests/coordinates.test.ts` (5 tests passed)
- `tests/geometry.test.ts` (9 tests passed)
- `tests/rdp.test.ts` (1 test passed)
- `tests/areaCalculation.test.ts` (4 tests passed)
- `tests/undoRedo.test.ts` (2 tests passed)
- `tests/spaceDetection.test.ts` (2 tests passed)

---

## 7. Interactive Features & Workflows

1. **Upload Architectural PDF**: Click `Upload PDF` or drag-and-drop a multi-page blueprint.
2. **One Click Detection**: Click `ONE CLICK` in the toolbar, then click anywhere inside an enclosed room. The system highlights the exact detected boundary, extracts the room label, and calculates the area.
3. **Edit Boundary**: Select any space and click `Edit Boundary`. Draggable anchor points appear on all vertices. Click on an edge to insert points, or right-click to remove points. The area recalculates in real-time.
4. **Draw Area Fallback**: When automatic detection is unavailable for un-enclosed spaces, use `Draw Area` to manually trace boundaries.
5. **Calibrate Scale**: Click `Calibrate`, select Point A and Point B along a known dimension line, enter the real-world distance (e.g. `5.0 m`), and apply. All measurements instantly update.
6. **Save Drawing**: Click `Save`, enter drawing name and description. Stored in Firestore and Firebase Storage (or backend database).
7. **Reopen & Restore**: Open `Saved Drawings`, click `Open` on any saved plan. The PDF, sheet page, scale, and all polygon annotations are restored with sub-pixel alignment.
8. **Undo / Redo**: Real history stack for adding, editing, renaming, and deleting measurements.

---

## 8. Security & Secret Management

- `GEMINI_API_KEY` is loaded strictly in Node.js server memory and never injected into client-side Vite bundles.
- All PDF uploads are sanitized and validated against MIME type and size limits.
- Client `.env` files are excluded in `.gitignore`.
