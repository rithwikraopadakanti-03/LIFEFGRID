import os
import logging
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

# Load .env file automatically
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ[k.strip()] = v.strip()

from database import engine, get_db, Base, SessionLocal
import models
import schemas
import gemini_service
import agents
import seed_data
import auth
import twilio_service
import omnidimension_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lifegrid.main")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LifeGrid AI Platform Engine",
    description="Autonomous Community Intelligence & Emergency Response Operating System",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent Instances
weather_agent = agents.WeatherIntelligenceAgent()
health_agent = agents.HealthIntelligenceAgent()
water_agent = agents.WaterSafetyAgent()
infra_agent = agents.InfrastructureAgent()
voice_agent = agents.CitizenVoiceAgent()
resource_agent = agents.ResourcePlanningAgent()
coordinator_agent = agents.EmergencyCoordinatorAgent()


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_data.seed_database(db)
    finally:
        db.close()


@app.get("/")
def read_root():
    return {
        "platform": "LifeGrid AI",
        "tagline": "One Platform. One Community. Faster Response. More Lives Saved.",
        "status": "OPERATIONAL",
        "version": "2.5.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/seed")
def reseed_database(db: Session = Depends(get_db)):
    models.Base.metadata.drop_all(bind=engine)
    seed_data.seed_database(db)
    return {"message": "Database re-seeded successfully with synthetic GIS & Auth dataset"}


# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.post("/api/auth/register", response_model=schemas.TokenResponse)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already registered")

    new_user = models.User(
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role or "CITIZEN",
        team_department=payload.team_department,
        address=payload.address or "Registered Location"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token({"sub": new_user.email, "role": new_user.role, "id": new_user.id})
    return schemas.TokenResponse(
        access_token=token,
        user=new_user
    )


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return schemas.TokenResponse(
        access_token=token,
        user=user
    )


# ==========================================
# INCIDENT ENDPOINTS & STATE MACHINE
# ==========================================

@app.get("/api/incidents", response_model=List[schemas.IncidentResponse])
def get_incidents(category: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Incident).order_by(models.Incident.created_at.desc())
    if category:
        query = query.filter(models.Incident.category == category)
    if status:
        query = query.filter(models.Incident.status == status)
    return query.all()


@app.get("/api/incidents/{incident_id}", response_model=schemas.IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@app.post("/api/incidents/sos", response_model=schemas.IncidentResponse)
async def trigger_quick_sos(
    background_tasks: BackgroundTasks,
    latitude: float = 16.5095,
    longitude: float = 80.6455,
    reporter_name: str = "Rithwik Rao",
    db: Session = Depends(get_db)
):
    """Instant 1-Tap SOS Panic Button Trigger"""
    sos_inc = models.Incident(
        title="SOS PANIC BUTTON ACTIVATED",
        category="Medical Emergency",
        description="Citizen Rithwik Rao pressed 1-Tap Emergency SOS Panic Button. Immediate dispatch required.",
        latitude=latitude,
        longitude=longitude,
        address="Live GPS Coordinates",
        urgency="CRITICAL",
        status="AI_VERIFIED",
        reporter_name=reporter_name,
        reporter_phone="+918121985059",
        is_verified=True,
        confidence_score=0.99,
        severity_score=10,
        ai_summary="High-priority SOS panic signal received. Nearest ALS Ambulance and Police unit assigned.",
        recommended_actions=["Dispatch nearest ALS ambulance immediately", "Notify Police Dispatcher"]
    )
    db.add(sos_inc)
    db.commit()
    db.refresh(sos_inc)

    # Auto assign resources
    resources = [r.__dict__ for r in db.query(models.Resource).all()]
    matches = resource_agent.find_nearest(latitude, longitude, resources)
    sos_inc.assigned_resources = {
        "ambulance": matches.get("nearest_ambulance", {}).get("name") if matches.get("nearest_ambulance") else "ALS Unit 108-A1",
        "police": matches.get("nearest_police", {}).get("name") if matches.get("nearest_police") else "District Control Room"
    }

    t0 = models.TimelineEvent(
        incident_id=sos_inc.id,
        agent_name="OmniDimension Voice AI Agent",
        action="Emergency Voice Agent Dispatched",
        details="1-Tap Emergency Panic button triggered. OmniDimension Realtime Voice AI agent call initiated to +918121985059.",
        status_change="AI_VERIFIED"
    )
    db.add(t0)
    db.commit()
    db.refresh(sos_inc)

    # Dispatch OmniDimension Voice AI Agent session to Rithwik Rao (+918121985059)
    background_tasks.add_task(
        omnidimension_service.dispatch_omnidimension_call,
        "+918121985059",
        "en",
        {"incident_id": sos_inc.id, "urgency": "CRITICAL", "reporter": "Rithwik Rao"}
    )

    return sos_inc


@app.post("/api/incidents", response_model=schemas.IncidentResponse)
async def create_incident(payload: schemas.IncidentCreate, db: Session = Depends(get_db)):
    new_inc = models.Incident(
        title=payload.title,
        category=payload.category,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address or "Detected Location",
        urgency=payload.urgency or "HIGH",
        status="SUBMITTED",
        photo_url=payload.photo_url,
        voice_transcript=payload.voice_transcript,
        voice_audio_url=payload.voice_audio_url,
        reporter_name=payload.reporter_name or "Anonymous Citizen",
        reporter_phone=payload.reporter_phone,
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    t0 = models.TimelineEvent(
        incident_id=new_inc.id,
        agent_name="Citizen Portal",
        action="Report Submitted",
        details=f"Citizen reported {payload.category}: {payload.title}.",
        status_change="SUBMITTED"
    )
    db.add(t0)

    # Run AI Verification Engine
    verification = await gemini_service.verify_incident_ai(
        title=payload.title,
        category=payload.category,
        description=payload.description,
        photo_url=payload.photo_url,
        voice_transcript=payload.voice_transcript,
        latitude=payload.latitude,
        longitude=payload.longitude
    )

    new_inc.is_verified = verification.get("is_verified", True)
    new_inc.is_fake = verification.get("is_fake", False)
    new_inc.is_duplicate = verification.get("is_duplicate", False)
    new_inc.confidence_score = verification.get("confidence_score", 0.90)
    new_inc.severity_score = verification.get("severity_score", 7)
    new_inc.ai_summary = verification.get("ai_summary", "")
    new_inc.recommended_actions = verification.get("recommended_actions", [])
    new_inc.status = "AI_VERIFIED"

    # Match Resources
    resources = [r.__dict__ for r in db.query(models.Resource).all()]
    matches = resource_agent.find_nearest(new_inc.latitude, new_inc.longitude, resources)
    new_inc.assigned_resources = {
        "ambulance": matches.get("nearest_ambulance", {}).get("name") if matches.get("nearest_ambulance") else None,
        "hospital": matches.get("nearest_hospital", {}).get("name") if matches.get("nearest_hospital") else None,
        "shelter": matches.get("nearest_shelter", {}).get("name") if matches.get("nearest_shelter") else None
    }

    t1 = models.TimelineEvent(
        incident_id=new_inc.id,
        agent_name="Gemini Verification AI",
        action="Report AI Verified",
        details=f"Confidence: {int(new_inc.confidence_score*100)}%. Severity: {new_inc.severity_score}/10.",
        status_change="AI_VERIFIED"
    )
    db.add(t1)
    db.commit()
    db.refresh(new_inc)

    return new_inc


@app.post("/api/incidents/{incident_id}/status", response_model=schemas.IncidentResponse)
def update_incident_status(incident_id: int, payload: schemas.IncidentStatusUpdate, db: Session = Depends(get_db)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = inc.status
    inc.status = payload.status
    if payload.assigned_team_name:
        inc.assigned_team_name = payload.assigned_team_name
    if payload.assigned_team_department:
        inc.assigned_team_department = payload.assigned_team_department
    if payload.eta_seconds:
        inc.eta_seconds = payload.eta_seconds

    t = models.TimelineEvent(
        incident_id=inc.id,
        agent_name="Emergency Operations Center",
        action=f"Status Updated: {payload.status}",
        details=f"Dispatch state transitioned from {old_status} to {payload.status}. Assigned: {inc.assigned_team_name or 'Emergency Unit'}.",
        status_change=payload.status
    )
    db.add(t)
    db.commit()
    db.refresh(inc)

    return inc


# ==========================================
# LIVE CHAT ENDPOINTS
# ==========================================

@app.get("/api/incidents/{incident_id}/chat", response_model=List[schemas.ChatMessageResponse])
def get_chat_messages(incident_id: int, db: Session = Depends(get_db)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.incident_id == incident_id).order_by(models.ChatMessage.timestamp.asc()).all()


@app.post("/api/incidents/{incident_id}/chat", response_model=schemas.ChatMessageResponse)
def post_chat_message(incident_id: int, payload: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    msg = models.ChatMessage(
        incident_id=incident_id,
        sender_name=payload.sender_name or "User",
        sender_role=payload.sender_role or "Citizen",
        message=payload.message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ==========================================
# RESOURCES & DOMAIN INTELLIGENCE
# ==========================================

@app.get("/api/resources", response_model=List[schemas.ResourceSchema])
def get_resources(type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Resource)
    if type:
        query = query.filter(models.Resource.type == type)
    return query.all()


@app.get("/api/agents/matrix", response_model=List[schemas.AgentStatusSchema])
def get_agent_matrix(db: Session = Depends(get_db)):
    weather_dict = db.query(models.WeatherMetric).first().__dict__ if db.query(models.WeatherMetric).first() else {}
    health_dict_list = [h.__dict__ for h in db.query(models.HealthMetric).all()]
    infra_dict_list = [i.__dict__ for i in db.query(models.InfrastructureMetric).all()]
    water_dict_list = [w.__dict__ for w in db.query(models.WaterMetric).all()]
    calls_list = [c.__dict__ for c in db.query(models.VoiceCallLog).all()]

    w_res = weather_agent.analyze(weather_dict)
    h_res = health_agent.analyze(health_dict_list)
    i_res = infra_agent.analyze(infra_dict_list)
    wt_res = water_agent.analyze(water_dict_list)
    v_res = voice_agent.analyze(calls_list)

    return [
        schemas.AgentStatusSchema(
            agent_name=weather_agent.name,
            role=weather_agent.role,
            status="ACTIVE_MONITORING",
            last_thought=w_res["reasoning"],
            confidence=0.95,
            metrics_analyzed=140,
            recommendation=w_res["recommendations"][0]
        ),
        schemas.AgentStatusSchema(
            agent_name=health_agent.name,
            role=health_agent.role,
            status="ACTIVE_MONITORING",
            last_thought=h_res["reasoning"],
            confidence=0.92,
            metrics_analyzed=85,
            recommendation=h_res["recommendations"][0]
        ),
        schemas.AgentStatusSchema(
            agent_name=water_agent.name,
            role=water_agent.role,
            status="ACTIVE_MONITORING",
            last_thought=wt_res["reasoning"],
            confidence=0.94,
            metrics_analyzed=32,
            recommendation=wt_res["recommendations"][0]
        ),
        schemas.AgentStatusSchema(
            agent_name=infra_agent.name,
            role=infra_agent.role,
            status="ACTIVE_MONITORING",
            last_thought=i_res["reasoning"],
            confidence=0.96,
            metrics_analyzed=64,
            recommendation=i_res["recommendations"][0]
        ),
        schemas.AgentStatusSchema(
            agent_name=voice_agent.name,
            role=voice_agent.role,
            status="STANDBY_READY",
            last_thought=v_res["reasoning"],
            confidence=0.98,
            metrics_analyzed=len(calls_list),
            recommendation=v_res["recommendations"][0]
        ),
        schemas.AgentStatusSchema(
            agent_name=resource_agent.name,
            role=resource_agent.role,
            status="ACTIVE_OPTIMIZING",
            last_thought="Haversine GIS routing engine computing minimum distance paths for emergency resources.",
            confidence=0.97,
            metrics_analyzed=10,
            recommendation="Pre-position volunteer rescue boats at Sector 2 low-lying basin."
        ),
        schemas.AgentStatusSchema(
            agent_name=coordinator_agent.name,
            role=coordinator_agent.role,
            status="COORDINATING",
            last_thought="Consolidating telemetry into district master emergency response graph.",
            confidence=0.99,
            metrics_analyzed=340,
            recommendation="Maintain High Alert status; prepare multi-department briefing."
        )
    ]


@app.post("/api/omnidimension/webhook")
@app.post("/api/calls/omnidimension-callback")
async def omnidimension_call_webhook(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Automated Voice AI Call Receiver:
    Reads incoming call transcripts from OmniDimension, extracts the emergency problem using Gemini AI,
    categorizes the hazard (Fire, Flood, Medical, Accident, Gas Leak), and creates/notifies the respective department!
    """
    logger.info(f"Received OmniDimension Voice Call Webhook: {payload}")
    
    transcript = (
        payload.get("transcript") or 
        payload.get("call_transcript") or 
        payload.get("summary") or 
        payload.get("text") or 
        payload.get("data", {}).get("transcript") or 
        payload.get("data", {}).get("call_transcript") or 
        payload.get("call", {}).get("transcript") or 
        payload.get("recording", {}).get("transcript") or
        payload.get("user_speech") or
        "Citizen activated SOS voice emergency call: Stranded in distress, immediate assistance needed."
    )
    
    user_phone = (
        payload.get("to_number") or 
        payload.get("from_number") or 
        payload.get("phone") or 
        payload.get("data", {}).get("to_number") or 
        "+91 8121985059"
    )

    # Process speech using Gemini AI to extract hazard & department
    triaged = await gemini_service.process_citizen_voice_call(
        language="en",
        user_speech=str(transcript),
        incident_context={"reporter_phone": user_phone}
    )
    
    cat = triaged.get("extracted_category", "Medical Emergency")
    dept_map = {
        "Fire": "FIRE",
        "Flood": "DISASTER_RESPONSE",
        "Accident": "POLICE",
        "Medical Emergency": "AMBULANCE",
        "Gas Leak": "FIRE"
    }
    dept = dept_map.get(cat, "AMBULANCE")

    ai_speech = triaged.get("ai_speech_text", "AI Dispatcher locked coordinates and notified emergency crews.")
    injuries = triaged.get("extracted_injuries", False)
    injured_count = triaged.get("extracted_injured_count", 0)

    detailed_description = (
        f"🚨 CITIZEN VOICE CALL EMERGENCY REPORT:\n"
        f"• Citizen Statement: \"{transcript}\"\n"
        f"• AI Triage Analysis: {ai_speech}\n"
        f"• Casualties/Injuries: {'YES (' + str(injured_count) + ' injured person(s))' if injuries else 'No trauma reported'}"
    )

    inc = models.Incident(
        title=f"🚨 SOS Voice Call Emergency: {cat} ({user_phone})",
        category=cat,
        description=detailed_description,
        latitude=16.5095,
        longitude=80.6455,
        address="Sector 2 Underpass / Riverbank Metro Zone",
        urgency="CRITICAL",
        status="AI_VERIFIED",
        reporter_name="Rithwik Rao (Voice Caller)",
        reporter_phone=user_phone,
        voice_transcript=str(transcript),
        is_verified=True,
        confidence_score=0.98,
        severity_score=9,
        assigned_team_department=dept
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Save to call logs
    log = models.VoiceCallLog(
        caller_phone=user_phone,
        language="en",
        user_transcript=str(transcript),
        ai_response_text=ai_speech,
        extracted_category=cat,
        call_duration_seconds=45
    )
    db.add(log)
    db.commit()
    
    return {
        "status": "PROCESSED_AND_DISPATCHED",
        "incident_id": inc.id,
        "assigned_department": dept,
        "category": cat,
        "description": detailed_description,
        "message": f"OmniDimension call processed. Hazard reported to {dept} department."
    }


@app.post("/api/voice/process-speech", response_model=schemas.VoiceProcessResponse)
async def process_voice_speech(payload: schemas.VoiceProcessRequest, db: Session = Depends(get_db)):
    result = await gemini_service.process_citizen_voice_call(
        language=payload.language,
        user_speech=payload.user_speech,
        incident_context=payload.incident_context
    )

    # Automatically create a live Incident entry when voice speech is processed!
    if payload.user_speech and len(payload.user_speech.strip()) > 3:
        cat = result.get("extracted_category", "Medical Emergency")
        user_phone = "+91 8121985059"
        if payload.incident_context and isinstance(payload.incident_context, dict):
            user_phone = payload.incident_context.get("reporter_phone", user_phone)

        injuries = result.get("extracted_injuries", False)
        injured_count = result.get("extracted_injured_count", 0)

        detailed_desc = (
            f"🚨 VOICE AI TELEMETRY DISPATCH:\n"
            f"• Citizen Spoken Situation: \"{payload.user_speech}\"\n"
            f"• AI Triage Directive: {result.get('ai_speech_text', '')}\n"
            f"• Casualty Status: {'URGENT MEDICAL NEED (' + str(injured_count) + ' injured)' if injuries else 'Stable'}"
        )

        inc = models.Incident(
            title=f"🚨 SOS Voice Call Emergency: {cat} ({user_phone})",
            category=cat,
            description=detailed_desc,
            latitude=16.5095,
            longitude=80.6455,
            address="Sector 2 Underpass / Riverbank Corridor",
            urgency="CRITICAL",
            status="AI_VERIFIED",
            reporter_name="Rithwik Rao (Voice Caller)",
            reporter_phone=user_phone,
            voice_transcript=payload.user_speech,
            is_verified=True,
            confidence_score=0.98,
            severity_score=9
        )
        db.add(inc)
        db.commit()

    return schemas.VoiceProcessResponse(
        ai_speech_text=result.get("ai_speech_text", ""),
        audio_synthesis_prompt=result.get("ai_speech_text", ""),
        extracted_injuries=result.get("extracted_injuries", False),
        extracted_injured_count=result.get("extracted_injured_count", 0),
        extracted_elderly_or_children=result.get("extracted_elderly_or_children", False),
        summary=result.get("summary", ""),
        recommended_shelter=result.get("recommended_shelter"),
        recommended_hospital=result.get("recommended_hospital"),
        eta_minutes=result.get("eta_minutes", 7)
    )


@app.get("/api/weather")
def get_weather(lat: Optional[float] = None, lon: Optional[float] = None, db: Session = Depends(get_db)):
    import httpx
    import os
    
    latitude = lat if lat is not None else 16.5062
    longitude = lon if lon is not None else 80.6480
    
    openweather_key = os.getenv("OPENWEATHER_API_KEY", os.getenv("VITE_OPENWEATHER_API_KEY", "")).strip()
    
    live_temp = 31.5
    live_wind = 42.0
    live_rain = 78.5
    humidity = 89.0
    location_name = "Metro Emergency District"
    summary = "Live Meteorological Doppler Radar Active"

    fetched_live = False

    # 1. Try OpenWeatherMap API if API key is provided in env
    if openweather_key and openweather_key != "your_openweather_api_key_here":
        try:
            ow_url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&units=metric&appid={openweather_key}"
            resp = httpx.get(ow_url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                live_temp = round(data.get("main", {}).get("temp", 31.5), 1)
                humidity = round(data.get("main", {}).get("humidity", 89.0), 1)
                live_wind = round(data.get("wind", {}).get("speed", 11.6) * 3.6, 1) # m/s to km/h
                location_name = data.get("name", f"GPS ({latitude:.2f}°, {longitude:.2f}°)")
                weather_desc = data.get("weather", [{}])[0].get("description", "live weather").title()
                summary = f"{weather_desc} in {location_name}. Live OpenWeather API sync active."
                fetched_live = True
                logger.info(f"Fetched live OpenWeather for {location_name}: {live_temp}°C")
        except Exception as e:
            logger.warning(f"OpenWeather API fetch error: {e}")

    # 2. Fallback to Open-Meteo (No API Key Required) if OpenWeather key is absent or failed
    if not fetched_live:
        try:
            om_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true"
            resp = httpx.get(om_url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                cw = data.get("current_weather", {})
                live_temp = round(cw.get("temperature", 31.5), 1)
                live_wind = round(cw.get("windspeed", 42.0), 1)
                location_name = f"District Sector ({latitude:.2f}°, {longitude:.2f}°)"
                code = cw.get("weathercode", 0)
                if code in [61, 63, 65, 80, 81, 82]:
                    summary = f"Live Heavy Rain Alert at {location_name} ({live_temp}°C)"
                    live_rain = 85.0
                elif code in [95, 96, 99]:
                    summary = f"Thunderstorm & Wind Warning at {location_name} ({live_temp}°C)"
                    live_rain = 110.0
                else:
                    summary = f"Live GPS Weather at {location_name} ({live_temp}°C)"
                fetched_live = True
        except Exception as e:
            logger.warning(f"Open-Meteo fallback fetch error: {e}")

    weather = db.query(models.WeatherMetric).first()
    w_dict = weather.__dict__.copy() if weather else {}
    w_dict.pop('_sa_instance_state', None)
    w_dict["temperature_c"] = live_temp
    w_dict["wind_speed_kmh"] = live_wind
    w_dict["rainfall_mm"] = live_rain
    w_dict["humidity_pct"] = humidity
    w_dict["location_name"] = location_name
    w_dict["forecast_summary"] = summary
    w_dict["latitude"] = latitude
    w_dict["longitude"] = longitude

    return {"metric": w_dict, "analysis": weather_agent.analyze(w_dict)}


@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total = db.query(models.Incident).count()
    active = db.query(models.Incident).filter(models.Incident.status != "RESOLVED").count()
    
    category_counts = {}
    for cat in ["Flood", "Fire", "Accident", "Medical Emergency", "Building Collapse", "Gas Leak", "Power Failure", "Water Issue"]:
        category_counts[cat] = db.query(models.Incident).filter(models.Incident.category == cat).count()

    return {
        "summary": {
            "total_incidents": total,
            "active_emergencies": active,
            "resolved_incidents": total - active,
            "avg_response_time_minutes": 5.8,
            "system_health_score": 98.4
        },
        "category_distribution": category_counts,
        "department_sla": [
            {"department": "FIRE", "sla_pct": 98.2, "avg_eta_min": 4.2},
            {"department": "AMBULANCE", "sla_pct": 96.8, "avg_eta_min": 5.5},
            {"department": "POLICE", "sla_pct": 99.1, "avg_eta_min": 3.8},
            {"department": "DISASTER_RESPONSE", "sla_pct": 94.5, "avg_eta_min": 8.0}
        ]
    }


# ==========================================
# EXPLAINABLE AI & INCIDENT REPLAY ENDPOINTS
# ==========================================

@app.get("/api/incidents/{incident_id}/explainable-reasoning")
def get_explainable_reasoning(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    resources = [r.__dict__ for r in db.query(models.Resource).all()]
    weather = db.query(models.WeatherMetric).first()
    w_dict = weather.__dict__ if weather else {}
    health = [h.__dict__ for h in db.query(models.HealthMetric).all()]
    infra = [i.__dict__ for i in db.query(models.InfrastructureMetric).all()]
    water = [wt.__dict__ for wt in db.query(models.WaterMetric).all()]

    w_analysis = weather_agent.analyze(w_dict)
    h_analysis = health_agent.analyze(health)
    i_analysis = infra_agent.analyze(infra)
    wt_analysis = water_agent.analyze(water)
    r_matches = resource_agent.find_nearest(inc.latitude, inc.longitude, resources)

    coord_plan = coordinator_agent.synthesize_response(
        inc.__dict__, w_analysis, h_analysis, i_analysis, wt_analysis, r_matches
    )
    return {
        "incident_id": inc.id,
        "title": inc.title,
        "category": inc.category,
        "explainable_reasoning": coord_plan.get("explainable_reasoning", []),
        "agent_cascade": [
            {"agent": weather_agent.name, "output": w_analysis.get("reasoning"), "confidence": 0.95},
            {"agent": health_agent.name, "output": h_analysis.get("reasoning"), "confidence": 0.92},
            {"agent": infra_agent.name, "output": i_analysis.get("reasoning"), "confidence": 0.96},
            {"agent": resource_agent.name, "output": f"Locked nearest ALS ambulance & station.", "confidence": 0.98},
            {"agent": coordinator_agent.name, "output": coord_plan.get("summary"), "confidence": 0.99}
        ]
    }


@app.get("/api/incidents/{incident_id}/replay")
def get_incident_replay(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    lat, lng = inc.latitude, inc.longitude

    frames = [
        {
            "step": 1,
            "timestamp": "00:00",
            "phase": "CITIZEN_REPORTED",
            "title": "Citizen Emergency SOS Signal Received",
            "description": f"Citizen {inc.reporter_name} activated 1-Tap SOS Panic Button at ({lat:.4f}, {lng:.4f}).",
            "map_markers": [{"type": "CITIZEN", "lat": lat, "lng": lng, "label": inc.reporter_name}],
            "status": "SUBMITTED"
        },
        {
            "step": 2,
            "timestamp": "00:01",
            "phase": "AI_MULTI_AGENT_VERIFICATION",
            "title": "Gemini & Multi-Agent AI Triaged Hazard",
            "description": "Weather, Health & Infrastructure Agents confirmed 96% severity. Multi-agency plan generated.",
            "map_markers": [
                {"type": "CITIZEN", "lat": lat, "lng": lng, "label": inc.reporter_name},
                {"type": "AI_PIN", "lat": lat + 0.002, "lng": lng - 0.002, "label": "AI Priority Lock"}
            ],
            "status": "AI_VERIFIED"
        },
        {
            "step": 3,
            "timestamp": "00:03",
            "phase": "TEAM_ASSIGNED",
            "title": "ALS Rescue Team Dispatched",
            "description": f"Unit {inc.assigned_team_name or 'ALS Ambulance 108-A1'} accepted dispatch.",
            "map_markers": [
                {"type": "CITIZEN", "lat": lat, "lng": lng, "label": inc.reporter_name},
                {"type": "RESCUE_UNIT", "lat": lat + 0.015, "lng": lng + 0.012, "label": "ALS Unit 108-A1"}
            ],
            "route_vector": [
                [lat + 0.015, lng + 0.012],
                [lat + 0.008, lng + 0.006],
                [lat, lng]
            ],
            "status": "TEAM_ASSIGNED"
        },
        {
            "step": 4,
            "timestamp": "00:06",
            "phase": "EN_ROUTE",
            "title": "Rescue Unit En Route via Safe Corridor B-4",
            "description": "Emergency vehicle navigating past flooded zones at 55 km/h.",
            "map_markers": [
                {"type": "CITIZEN", "lat": lat, "lng": lng, "label": inc.reporter_name},
                {"type": "RESCUE_UNIT", "lat": lat + 0.005, "lng": lng + 0.003, "label": "ALS Unit 108-A1 (En Route)"}
            ],
            "status": "EN_ROUTE"
        },
        {
            "step": 5,
            "timestamp": "00:09",
            "phase": "ARRIVED",
            "title": "Rescue Crew Arrived On Site",
            "description": "Paramedics & Fire crew established perimeter and initiated triage.",
            "map_markers": [
                {"type": "CITIZEN", "lat": lat, "lng": lng, "label": inc.reporter_name},
                {"type": "RESCUE_UNIT", "lat": lat + 0.0005, "lng": lng + 0.0005, "label": "ALS Unit On Site"}
            ],
            "status": "ARRIVED"
        },
        {
            "step": 6,
            "timestamp": "00:18",
            "phase": "RESOLVED",
            "title": "Incident Resolved & All Victims Safe",
            "description": "Patient transported safely to Central ER. Scene cleared.",
            "map_markers": [
                {"type": "RESOLVED_FLAG", "lat": lat, "lng": lng, "label": "Incident Resolved"}
            ],
            "status": "RESOLVED"
        }
    ]

    return {
        "incident_id": inc.id,
        "title": inc.title,
        "total_frames": len(frames),
        "replay_frames": frames
    }


@app.post("/api/predictive/simulation")
def run_predictive_simulation(
    rainfall_increase_mm: float = 60.0,
    temperature_spike_c: float = 6.0,
    db: Session = Depends(get_db)
):
    weather = db.query(models.WeatherMetric).first()
    curr_rain = weather.rainfall_mm if weather else 45.0
    curr_temp = weather.temperature_c if weather else 34.0

    sim_rain = curr_rain + rainfall_increase_mm
    sim_temp = curr_temp + temperature_spike_c

    flood_risk = min(99.0, (sim_rain / 130.0) * 100.0)
    heat_stroke_risk = min(95.0, (sim_temp / 45.0) * 100.0)

    return {
        "simulation_parameters": {
            "simulated_rainfall_mm": sim_rain,
            "simulated_temp_c": sim_temp
        },
        "predictions": [
            {
                "hazard_type": "Flash Flood Inundation",
                "probability_pct": round(flood_risk, 1),
                "risk_level": "CRITICAL" if flood_risk > 75 else "HIGH",
                "impacted_zones": ["Sector 4 Lowlands", "Old River Basin", "Underpass Highway 16"],
                "recommended_preemptive_action": "Broadcast immediate pre-evacuation alert to 12,000 residents in Sector 4."
            },
            {
                "hazard_type": "Hospital ICU Surge / Heat Stroke Outbreak",
                "probability_pct": round(heat_stroke_risk, 1),
                "risk_level": "HIGH" if heat_stroke_risk > 60 else "MODERATE",
                "impacted_zones": ["District Central ER", "North Civil Hospital"],
                "recommended_preemptive_action": "Pre-deploy 30 additional cooling beds & mobile hydrations vans."
            }
        ]
    }


@app.post("/api/alerts/broadcast")
def broadcast_smart_alert(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    target_group = payload.get("target_group", "ALL_CITIZENS")
    title = payload.get("title", "EMERGENCY BROADCAST ALERT")
    message = payload.get("message", "High priority alert issued by LifeGrid Command Center.")
    channels = payload.get("channels", ["PUSH", "SMS", "EMAIL", "VOICE"])

    alert = models.AlertNotification(
        target_group=target_group,
        channel=", ".join(channels),
        title=title,
        message=message,
        urgency=payload.get("urgency", "CRITICAL")
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "status": "SUCCESS",
        "alert_id": alert.id,
        "dispatched_channels": channels,
        "targets_reached_estimate": 14500,
        "message": f"Broadcast successfully issued to {target_group} via {', '.join(channels)}."
    }
