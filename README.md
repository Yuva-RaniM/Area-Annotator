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
