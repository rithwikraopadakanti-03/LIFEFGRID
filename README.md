# 🛡️ LifeGrid AI

> **Autonomous Community Intelligence & Emergency Response Operating System**  
> *"One Platform. One Community. Instant AI Triage. More Lives Saved."*

[![Live Vercel Frontend](https://img.shields.io/badge/Frontend-Vercel%20Live-000000?style=for-the-badge&logo=vercel)](https://lifegrid.vercel.app)
[![Live Render Backend](https://img.shields.io/badge/Backend-Render%20Cloud-46E3B7?style=for-the-badge&logo=render)](https://lifefgrid.onrender.com/docs)
![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?style=for-the-badge&logo=fastapi)
![React 19](https://img.shields.io/badge/React%2019-Vite-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4%20Glass-38B2AC?style=for-the-badge&logo=tailwind-css)
![OmniDimension AI](https://img.shields.io/badge/Voice%20AI-OmniDimension%20PSTN-7C3AED?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/LLM-Google%20Gemini%20Flash-4285F4?style=for-the-badge&logo=google)

---

## 📖 Executive Overview

**LifeGrid AI** is a next-generation, AI-orchestrated Emergency Operations System designed to bridge the gap between distressed citizens and emergency responder crews (Ambulance, Fire, Police, NDRF). 

Instead of relying on fragmented phone calls and manual dispatcher routing, **LifeGrid AI** deploys an integrated multi-agent intelligence network:
- **Instant 1-Tap Red SOS Panic Dispatch**: Automatically captures live GPS coordinates, identifies nearest available fleets, and dispatches responders within milliseconds.
- **Conversational Voice AI Triage (`omnidim.io`)**: Dispatches real-time, low-latency conversational Voice AI phone calls to citizens' mobile phones in **English, Telugu (తెలుగు), Hindi (हिंदी), Tamil (தமிழ்), and Kannada (ಕನ್ನಡ)**.
- **Interactive Proximity Ambulance Tracking Map**: Displays real-time Haversine distance calculations (*e.g., "1.8 km away"*), live citizen markers 📍, responder vehicle markers 🚑, and route vector trajectories.
- **Role-Based Command Centers**: Dedicated portals tailored for Citizens, Dispatchers, Ambulance Personnel, Fire Commanders, and Police Control Rooms.

---

## ✨ Key Features & Capability Matrix

| Feature Module | Technology / Engine | Description |
| :--- | :--- | :--- |
| 🆘 **1-Tap SOS Emergency** | FastAPI + Haversine Engine | Instant crisis signal lock with live GPS coordinates, auto-generating incident tickets with 99% confidence ratings. |
| 🗣️ **Conversational Voice AI** | OmniDimension AI + Twilio | Real-time Indian regional telephony dispatch (+91) with interactive voice triage and PSTN failover. |
| 🗺️ **Proximity GIS Map** | Leaflet GIS + OpenStreetMap | Live location tracking, ambulance-to-citizen distance calculation, and flood/fire risk heatmaps. |
| 🤖 **7 Domain AI Agents** | Google Gemini API + Rules Engine | Multi-agent collaboration across Weather Telemetry, Medical Triage, Infrastructure Risk, and Resource Optimization. |
| 💬 **Live Responder Chat** | React Real-Time Drawer | Instant bi-directional communication between citizens in distress and assigned responder crews. |
| 👤 **User Profile & Media** | Base64 Image Processing | Custom registration with profile photo avatar storage, phone verification, and role-based access control. |
| 📊 **EOC Executive Analytics** | Chart.js Telemetry | Department SLA tracking, response time analytics, category distributions, and immutable audit logs. |

---

## 🏗️ Multi-Agent Architecture & Flow

```
                     ┌────────────────────────────────────────────────────────┐
                     │            LifeGrid AI Web Gateway                     │
                     │          (Vercel Production Distribution)             │
                     └───────────┬────────────────────────────────┬───────────┘
                                 │                                │
                                 ▼                                ▼
                  ┌─────────────────────────────┐  ┌─────────────────────────────┐
                  │       Citizen Portal        │  │   Emergency Operations      │
                  ├─────────────────────────────┤  ├─────────────────────────────┤
                  │ • 1-Tap SOS Panic Button    │  │ • Role Access Control       │
                  │ • Live Distance & ETA Map   │  │   (Citizen, Dispatch, EOC)  │
                  │ • Voice AI Triage Guide     │  │ • Resource State Machine    │
                  │ • Direct Responder Chat     │  │   (En Route/Arrived/Closed) │
                  └──────────────┬──────────────┘  └──────────────┬──────────────┘
                                 │                                │
                                 └────────────────┬───────────────┘
                                                  │ REST APIs / JWT Security
                                                  ▼
                                 ┌────────────────────────────────┐
                                 │   FastAPI Engine (Render Cloud) │
                                 └───────────────┬────────────────┘
                                                 │
                  ┌──────────────────────────────┼──────────────────────────────┐
                  │                              │                              │
                  ▼                              ▼                              ▼
     ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
     │  Google Gemini Engine  │    │  OmniDimension Voice   │    │  Twilio PSTN Gateway   │
     │  Multi-Agent Triage    │    │  Indian Regional (+91) │    │  High-Availability     │
     └────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

---

## 🛠️ Project Structure

```
LifeGridAI/
├── backend/
├── main.py                   # FastAPI Application & API Route Controllers
├── models.py                 # SQLAlchemy Database Models (User, Incident, Resource, Timeline)
├── schemas.py                # Pydantic Request/Response Validation Schemas
├── database.py               # SQLite / PostgreSQL Connection Setup
├── gemini_service.py         # Google Gemini AI Multi-Agent Triage Service
├── omnidimension_service.py  # OmniDimension Voice AI Telephony Integration
├── twilio_service.py         # Twilio Backup PSTN Calling Service
├── requirements.txt          # Backend Python Dependencies
└── render.yaml               # Render Cloud Blueprint Deployment Specification
├── frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Navigation, User Profile Avatar, & Status Controls
│   │   ├── CitizenPortal.jsx       # Citizen SOS Button, Status Stepper & Ambulance Map
│   │   ├── DispatcherPanel.jsx     # Emergency Dispatch Command & Fleet Control
│   │   ├── AICopilot.jsx           # LifeGrid AI Floating Assistant Drawer
│   │   ├── LiveMap.jsx             # Interactive GIS EOC Heatmap & Incident Layers
│   │   ├── AuthModal.jsx           # Registration, Base64 Photo Upload, & Login Modal
│   │   ├── UserProfileModal.jsx    # User Account Details & Profile Photo Display
│   │   └── VoiceAiModal.jsx        # In-Browser Voice Dispatcher Assistant Screen
│   ├── App.jsx                     # Core Application State Management & Routing
│   ├── main.jsx                    # Vite Root Entrypoint & Leaflet CSS Imports
│   └── index.css                   # Glassmorphic White & Turquoise Design Tokens
├── package.json                    # Frontend Node Dependencies
└── vite.config.js                  # Vite Build & Development Server Configuration
```

---

## ⚡ Local Development Setup

### 1. Backend (FastAPI)

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- 🔗 **Interactive API Documentation**: `http://127.0.0.1:8000/docs`

### 2. Frontend (React + Vite)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- 🌐 **Web Application**: `http://localhost:3000`

---

## 🔑 Environment Configuration

Create a `.env` file inside `/backend`:

```env
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
OMNIDIMENSION_API_KEY=your_omnidimension_api_key
OMNIDIMENSION_AGENT_ID=230404
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+18052629069
JWT_SECRET_KEY=lifegrid_secret_key_hackathon_2026
```

---

## 🚀 Deployment

- **Frontend**: Automatically deployed on **Vercel** (`main` branch commits trigger build via `vite build`).
- **Backend**: Hosted on **Render** (Singapore datacenter, running `uvicorn main:app --host 0.0.0.0 --port $PORT`).

---

## 📜 Presentation & Demo Script

For hackathon presentation guidelines, feature walkthroughs, and judge Q&A pitch scripts, refer to:
- 📄 [Presentation Script Artifact](presentation_script.md)

---

## 📄 License

Distributed under the **MIT License**. Built for National AI Hackathon 2026.
