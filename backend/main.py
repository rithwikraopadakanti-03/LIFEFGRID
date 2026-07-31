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

    # Dispatch OmniDimension Realtime Conversational Voice Agent call
    background_tasks.add_task(
        omnidimension_service.dispatch_omnidimension_call,
        "+918121985059",
        "en",
        {"incident_id": sos_inc.id, "urgency": "CRITICAL", "reporter": "Rithwik Rao"}
    )

    # Also trigger Twilio PSTN backup
    background_tasks.add_task(
        twilio_service.make_emergency_call,
        "+918121985059",
        "Emergency SOS Alert! LifeGrid AI OmniDimension Agent has logged your emergency. Response teams dispatched."
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


@app.get("/api/weather")
def get_weather(db: Session = Depends(get_db)):
    weather = db.query(models.WeatherMetric).first()
    if not weather:
        return {}
    return {"metric": weather, "analysis": weather_agent.analyze(weather.__dict__)}


@app.get("/api/health-metrics")
def get_health_metrics(db: Session = Depends(get_db)):
    items = db.query(models.HealthMetric).all()
    return {"metrics": items, "analysis": health_agent.analyze([i.__dict__ for i in items])}


@app.get("/api/digital-twin")
def get_digital_twin(db: Session = Depends(get_db)):
    return db.query(models.DigitalTwinZone).all()


@app.post("/api/voice/process-speech", response_model=schemas.VoiceProcessResponse)
async def process_voice_speech(payload: schemas.VoiceProcessRequest, db: Session = Depends(get_db)):
    result = await gemini_service.process_citizen_voice_call(
        language=payload.language,
        user_speech=payload.user_speech,
        incident_context=payload.incident_context
    )
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
            "active_incidents": active,
            "avg_response_time_minutes": 6.2,
            "system_accuracy_pct": 97.2,
            "available_icu_beds": 36,
            "available_shelter_capacity": 1740,
            "active_volunteers": 45
        },
        "category_distribution": category_counts,
        "department_response_metrics": [
            {"department": "Health / Ambulance", "avg_dispatch_min": 4.8, "satisfaction": 96},
            {"department": "Fire & Rescue", "avg_dispatch_min": 5.5, "satisfaction": 97},
            {"department": "Police Patrol", "avg_dispatch_min": 6.8, "satisfaction": 93},
            {"department": "Disaster Response Force", "avg_dispatch_min": 7.2, "satisfaction": 98}
        ]
    }
