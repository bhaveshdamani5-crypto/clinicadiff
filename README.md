# Clinica-Diff

AI-powered clinical intelligence platform: symptom triage, multimodal diagnosis, prescription OCR, medicine scanner, adherence coaching, and real-time doctor copilot.

## Stack

- **Frontend** — Next.js (`frontend/`)
- **Backend** — Node.js + Express + Socket.io (`backend/`)
- **AI engine** — Flask + Groq (`ai-model/`)
- **Database** — MongoDB

## Setup

### 1. Environment

Create `ai-model/.env` and `backend/.env` (do not commit these):

```env
# ai-model/.env
GROQ_API_KEY=your_groq_api_key

# backend/.env
MONGODB_URI=mongodb://127.0.0.1:27017/clinicadiff
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 2. Install & run

```bash
# AI engine (port 5001)
cd ai-model
pip install -r requirements.txt
python app.py

# Backend (port 5000)
cd backend
npm install
npm start

# Frontend (port 3000)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — register as patient or doctor, select a doctor on the patient dashboard, then use the clinical features.

## Features

- Universal Symptom Analyzer (Groq, 8–12 conditions)
- Voice symptom intake
- Multimodal photo + symptom diagnosis
- Prescription OCR + layman medicine guide
- AR medicine scanner
- Adherence coach with doctor notifications
- Doctor AI Copilot live brief
