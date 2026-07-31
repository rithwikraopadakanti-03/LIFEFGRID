# 🛡️ LifeGrid AI

> **Autonomous Community Intelligence & Emergency Response Operating System**  
> *"One Platform. One Community. Faster Response. More Lives Saved."*

![LifeGrid AI](https://img.shields.io/badge/Status-Hackathon%20Champion%20Ready-emerald?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%20API-4285F4?style=for-the-badge&logo=google)

---

## 📖 Executive Summary

**LifeGrid AI** transitions emergency management from reactive response to proactive prediction, automated verification, smart resource matching, and AI-driven multi-department coordination.

Instead of showing raw data or waiting for manual verification, 7 specialized domain AI agents collaborate, process multi-lingual citizen calls, analyze satellite/doppler weather telemetry, calculate localized risk heatmaps, and dispatch nearest emergency teams (Fire, Ambulance, Police, NDRF).

---

## ✨ Key Features

- 📱 **Dual Portal System**: Mobile-first Citizen Portal & Department-specific Emergency Operations Center.
- 🆘 **1-Tap SOS Panic Button**: Instant high-priority dispatch with live GPS coordinate lock.
- 🤖 **7 Specialized AI Domain Agents**: Weather, Health, Water Safety, Infrastructure, Citizen Voice, Resource Planning, and Emergency Coordinator Agent.
- 🗣️ **Multi-Lingual Voice AI Assistant**: Handles citizen emergency calls in **English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), and Kannada (ಕನ್ನಡ)**.
- 🗺️ **Interactive Leaflet GIS Map**: Animated markers for incidents, hospitals, shelters, fire stations, ambulances, police, and dynamic evacuation route vectors.
- 💬 **Live Responder-Citizen Chat**: Slide-over drawer connecting citizens with assigned crew in real time.
- 🌐 **Community Digital Twin**: Sub-grid power outages, water contamination scores, and population density heatmaps.
- 📊 **Executive Analytics & Audit Timeline**: Department SLA tracking, incident category distributions, and immutable logs.

---

## 🏗️ Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               LifeGrid AI Gateway                      │
                    └───────────┬────────────────────────────────┬───────────┘
                                │                                │
                                ▼                                ▼
                 ┌─────────────────────────────┐  ┌─────────────────────────────┐
                 │       Citizen Portal        │  │   Emergency Team Center     │
                 ├─────────────────────────────┤  ├─────────────────────────────┤
                 │ • Quick SOS Panic Button    │  │ • Department Permission Filter│
                 │ • Weather & Nearby Resources│  │   (Police, Fire, Ambulance) │
                 │ • Live Status Tracker & ETA │  │ • Dispatch Action State     │
                 │ • Direct Crew Chat Drawer   │  │   Machine (En Route/Arrived)│
                 └──────────────┬──────────────┘  └──────────────┬──────────────┘
                                │                                │
                                └────────────────┬───────────────┘
                                                 │ REST APIs / JWT Auth
                                                 ▼
                                ┌────────────────────────────────┐
                                │   FastAPI Multi-Agent Engine   │
                                └────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 🔑 Environment Variables (Optional)

Create `.env` inside `/backend` for live external services:

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
JWT_SECRET_KEY=lifegrid_secret_key_2026
```

---

## ☁️ Deployment Instructions

- **Frontend (Vercel / Netlify)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
- **Backend (Render / Railway / AWS)**:
  - Root directory: `backend`
  - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 📄 License
MIT License. Built for National AI Hackathon 2026.
