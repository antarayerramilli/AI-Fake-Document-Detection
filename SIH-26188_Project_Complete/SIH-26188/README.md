# SIH26188 - SSB Document Verification System

AI-powered border document screening for Nepal, Bhutan, and Indian documents.
Built for Smart India Hackathon 2024.

## Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend runs at `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

### 3. Generate Demo Documents
```bash
python generate_sih26188_documents.py
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/screen` | Main screening endpoint |
| GET | `/api/report?path=<file>` | Download PDF report |
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/recent` | Recent screenings |

## Document Types Supported

- `nepal_citizenship` — Nepalese Citizenship Certificate
- `bhutan_cid` — Bhutanese Citizen Identity Card
- `indian_epic` — Indian Voter ID (EPIC)
- `indian_passport` — Indian Passport
- `foreign_passport` — Foreign Passport + Indian Visa

## Architecture

```
Frontend (React) → Flask API → Modules:
  ├── OCR Engine (Tesseract + EasyOCR)
  ├── Validator (Rules per country)
  ├── Tamper Detector (ELA + Metadata)
  ├── Face Matcher (DeepFace)
  └── Risk Scorer (0-100 weighted)
```

## Demo Script (7 Minutes)

1. Upload valid Nepal Citizenship → GREEN
2. Upload fake district "88" Nepal doc → RED
3. Upload expired Indian Passport → RED
4. Upload passport + mismatched selfie → RED
5. Show Dashboard stats

## Team

Built in 36 hours for SIH26188 — SSB Border Document Verification.
