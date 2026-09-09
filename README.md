# Area Annotator — Intelligent PDF Floor Plan Measurement System
Area Annotator is a web-based architectural PDF measurement and takeoff application that allows users to upload floor plans, detect enclosed spaces, calculate areas, edit boundaries, calibrate drawing scale, and save measurements for later use.

## Key Features

- Upload and view architectural PDF floor plans
- Multi-page PDF support
- Zoom, pan, and page navigation
- One Click enclosed-space detection
- Automatic polygon boundary generation
- Area calculation
- Drawing scale detection and manual calibration
- Manual boundary editing
- Draw Area fallback
- Multiple measurements
- Undo / Redo
- Save and reopen drawings
- Persistent annotations
- AI-assisted room/architectural context interpretation

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- PDF.js

### Backend
- Node.js
- Express
- TypeScript
- Multer

### Database & Storage
- Firebase Firestore
- Firebase Storage
- Local fallback for development

### AI
- Google Gemini API

### Testing
- Vitest

## Application Workflow

```text
Upload PDF
    ↓
View Floor Plan
    ↓
One Click
    ↓
Click Inside Room
    ↓
Detect Enclosed Space
    ↓
Generate Boundary
    ↓
Calculate Area
    ↓
Edit if Required
    ↓
Save Drawing
    ↓
Reopen & Restore

## Local Development

### Install dependencies

```bash
npm install
```

Copy `.env.example` to `.env` and add the required API and Firebase values.

### Start the application

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API server runs on `http://localhost:3001`.

### Build and test

```bash
npm run build
npm test
```

## Live Deployment

The repository includes a `render.yaml` configuration for deploying the frontend and Express API as one Render web service.

1. Create a new Render Blueprint from this GitHub repository.
2. Set `GEMINI_API_KEY` in the Render dashboard.
3. Add the Firebase environment variables if cloud storage and Firestore sync are enabled.
4. Deploy the service and open the generated Render URL.

Render uses `npm ci && npm run build` to build the application and `npm run server` to serve the API and production frontend.
