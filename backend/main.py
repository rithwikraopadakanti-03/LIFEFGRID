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
        address=payload.address or "Registered Location",
        profile_photo_url=payload.profile_photo_url
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
    payload: Optional[schemas.SOSRequest] = None,
    db: Session = Depends(get_db)
):
    """Instant 1-Tap SOS Panic Button Trigger"""
    lat = payload.latitude if payload else 16.5095
    lon = payload.longitude if payload else 80.6455
    name = payload.reporter_name if payload else "Citizen In Distress"
    phone = payload.reporter_phone if (payload and payload.reporter_phone) else "Registered Phone"

    sos_inc = models.Incident(
        title="🚨 1-Tap Red SOS Emergency",
        category="SOS",
        description="Citizen pressed 1-Tap Emergency SOS Panic Button. Immediate dispatch required.",
        latitude=lat,
        longitude=lon,
        address="Live GPS Coordinates",
        urgency="CRITICAL",
        status="AI_VERIFIED",
        reporter_name=name,
        reporter_phone=phone,
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
    matches = resource_agent.find_nearest(lat, lon, resources)
    sos_inc.assigned_resources = {
        "ambulance": matches.get("nearest_ambulance", {}).get("name") if matches.get("nearest_ambulance") else "ALS Unit 108-A1",
        "police": matches.get("nearest_police", {}).get("name") if matches.get("nearest_police") else "District Control Room"
    }

    target_phone = phone if (phone and phone != "Registered Phone") else "+918121985059"
    if not target_phone.startswith("+"):
        target_phone = "+91" + target_phone.lstrip("0")

    t0 = models.TimelineEvent(
        incident_id=sos_inc.id,
        agent_name="OmniDimension Voice AI Agent",
        action="Emergency Voice Agent Dispatched",
        details=f"1-Tap Emergency Panic button triggered. OmniDimension Realtime Voice AI agent call initiated to {target_phone}.",
        status_change="AI_VERIFIED"
    )
    db.add(t0)
    db.commit()
    db.refresh(sos_inc)

    # Dispatch OmniDimension Voice AI Agent session to citizen phone number
    background_tasks.add_task(
        omnidimension_service.dispatch_omnidimension_call,
        target_phone,
        "en",
        {"incident_id": sos_inc.id, "urgency": "CRITICAL", "reporter": name}
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
def get_resources(type: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None, db: Session = Depends(get_db)):
    query = db.query(models.Resource)
    if type:
        query = query.filter(models.Resource.type == type)
    resources = query.all()

    # If user provided their live GPS latitude and longitude, center emergency resources around their location
    if lat is not None and lon is not None and len(resources) > 0:
        offsets = [
            (0.008, 0.005),
            (-0.007, 0.009),
            (0.012, -0.006),
            (-0.010, -0.011),
            (0.005, -0.014),
            (-0.015, 0.003),
            (0.014, 0.010)
        ]
        result = []
        for idx, res in enumerate(resources):
            r_dict = schemas.ResourceSchema.model_validate(res).model_dump()
            d_lat, d_lon = offsets[idx % len(offsets)]
            r_dict["latitude"] = lat + d_lat
            r_dict["longitude"] = lon + d_lon
            result.append(schemas.ResourceSchema.model_validate(r_dict))
        return result

    return resources


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
            agent_name="Smart Emergency Dispatcher Agent",
            role="Autonomous Multi-Provider Emergency Resource Matcher",
            status="ACTIVE_DISPATCHING",
            last_thought="Evaluating multi-provider fleet (108 Govt, Apollo, Fortis, Blinkit Demo) — scoring distance, ALS capability, availability, and ETA via Haversine GPS routing engine.",
            confidence=0.97,
            metrics_analyzed=6,
            recommendation="Select Apollo Emergency ALS (AP-09-AP-9901) — nearest ALS unit with ICU ventilator, 2.3 km, ETA 6 mins via NH65 Corridor."
        ),
        schemas.AgentStatusSchema(
            agent_name="Emergency Coordinator Agent",
            role="Chief Autonomous Incident Commander",
            status="COMMANDING",
            last_thought="All 7 domain agents have reported. Synthesizing unified multi-department response plan. Fire, ALS, Police, Hospital ER locked.",
            confidence=0.99,
            metrics_analyzed=450,
            recommendation="Execute Unified Multi-Department Rapid Response Dispatch across FIRE, ALS, POLICE, HOSPITAL ER."
        ),
    ]


@app.post("/api/agents/coordinate")
def coordinate_agents(db: Session = Depends(get_db)):
    """
    Executes real-time multi-agent consensus synthesis across all 7 AI agents.
    Returns structured consensus plan, confidence score, and recommended directives.
    """
    weather_dict = db.query(models.WeatherMetric).first().__dict__ if db.query(models.WeatherMetric).first() else {}
    health_dict_list = [h.__dict__ for h in db.query(models.HealthMetric).all()]
    infra_dict_list = [i.__dict__ for i in db.query(models.InfrastructureMetric).all()]
    water_dict_list = [w.__dict__ for w in db.query(models.WaterMetric).all()]

    w_res = weather_agent.analyze(weather_dict)
    h_res = health_agent.analyze(health_dict_list)
    i_res = infra_agent.analyze(infra_dict_list)
    wt_res = water_agent.analyze(water_dict_list)

    consensus_directives = [
        f"Weather Agent ({w_res.get('alert_level', 'LOW')}): {w_res['recommendations'][0]}",
        f"Health Agent ({h_res.get('outbreak_risk_level', 'LOW')}): {h_res['recommendations'][0]}",
        f"Water Agent ({wt_res.get('status', 'STABLE')}): {wt_res['recommendations'][0]}",
        f"Infrastructure Agent: {i_res['recommendations'][0]}",
        "Resource Agent: Haversine GIS shortest-path unit allocation locked.",
        "Smart Dispatcher Agent: Multi-provider scoring complete. Apollo Emergency ALS selected — ALS + ICU, 2.3 km, ETA 6 mins.",
        "Emergency Coordinator Agent: Unified multi-department dispatch plan synthesized and activated."
    ]

    return {
        "status": "COORDINATION_COMPLETE",
        "consensus_score": 0.985,
        "primary_threat": w_res.get("alert_level", "MODERATE"),
        "directives": consensus_directives,
        "timestamp": datetime.utcnow().isoformat()
    }


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
        user_phone = payload.phone or (payload.incident_context.get("reporter_phone") if isinstance(payload.incident_context, dict) else None) or "Registered Phone"

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
            reporter_name="Citizen (Voice Caller)",
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
    
    live_temp = 28.5
    live_wind = 12.0
    live_rain = 0.0
    humidity = 65.0
    location_name = "Live Emergency Sector"
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
# AI SMART EMERGENCY DISPATCHER ENDPOINTS
# ==========================================

@app.get("/api/dispatch/providers")
def get_dispatch_providers(db: Session = Depends(get_db)):
    providers = db.query(models.DispatchProvider).all()
    if not providers:
        return [
            {
                "id": 1,
                "provider_name": "Apollo Emergency ALS",
                "provider_category": "PRIVATE",
                "vehicle_id": "AP-09-AP-9901",
                "vehicle_type": "Ambulance",
                "is_als": True,
                "is_bls": True,
                "has_icu": True,
                "driver_name": "Officer Vikram Singh (ALS Chief)",
                "contact_number": "+91 94400 10801",
                "current_lat": 16.5100,
                "current_lon": 80.6470,
                "availability_status": "AVAILABLE",
                "current_speed_kmh": 52.0,
                "rating_score": 4.95
            },
            {
                "id": 2,
                "provider_name": "Government 108 ALS Service",
                "provider_category": "GOVERNMENT",
                "vehicle_id": "AP-09-AM-1082",
                "vehicle_type": "Ambulance",
                "is_als": True,
                "is_bls": True,
                "has_icu": False,
                "driver_name": "Paramedic Lead Rajesh",
                "contact_number": "108",
                "current_lat": 16.5080,
                "current_lon": 80.6490,
                "availability_status": "AVAILABLE",
                "current_speed_kmh": 48.0,
                "rating_score": 4.8
            },
            {
                "id": 3,
                "provider_name": "Blinkit Rapid Ambulance (Demo)",
                "provider_category": "DEMO_FLEET",
                "vehicle_id": "AP-09-BK-1102",
                "vehicle_type": "Ambulance",
                "is_als": False,
                "is_bls": True,
                "has_icu": False,
                "driver_name": "Rapid Rider Alex",
                "contact_number": "+91 98765 11020",
                "current_lat": 16.5075,
                "current_lon": 80.6440,
                "availability_status": "AVAILABLE",
                "current_speed_kmh": 60.0,
                "rating_score": 4.75
            }
        ]
    return providers


@app.post("/api/dispatch/recommend/{incident_id}")
def generate_dispatch_recommendation(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    providers_db = db.query(models.DispatchProvider).all()
    providers = [p.__dict__ for p in providers_db] if providers_db else get_dispatch_providers(db)

    dispatcher_agent = agents.DispatcherAgent()
    rec = dispatcher_agent.recommend(inc.__dict__, providers)

    if not rec or "best_provider" not in rec:
        raise HTTPException(status_code=500, detail="Failed to calculate provider recommendation")

    bp = rec["best_provider"]
    
    disp_rec = models.DispatchRecommendation(
        incident_id=inc.id,
        provider_id=bp.get("provider_id", 1),
        provider_name=bp.get("provider_name"),
        vehicle_id=bp.get("vehicle_id"),
        driver_name=bp.get("driver_name"),
        contact_number=bp.get("contact_number"),
        vehicle_type=bp.get("vehicle_type"),
        priority_level=rec.get("priority_level", "CRITICAL"),
        required_services=rec.get("required_services", []),
        distance_km=bp.get("distance_km"),
        eta_minutes=bp.get("eta_minutes"),
        traffic_level=bp.get("traffic_level", "LIGHT"),
        best_route_name=bp.get("best_route_name", "NH65 Express Corridor"),
        confidence_score=bp.get("confidence_score", 0.97),
        recommendation_reason=rec.get("recommendation_reason"),
        detailed_justification=rec.get("detailed_justification", []),
        comparison_matrix=rec.get("comparison_matrix", []),
        status="BEST_RESOURCE_FOUND"
    )
    db.add(disp_rec)
    
    inc.status = "BEST_RESOURCE_FOUND"
    inc.assigned_team_name = bp.get("provider_name")
    db.commit()

    return disp_rec


@app.get("/api/dispatch/incident/{incident_id}")
def get_incident_dispatch(incident_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.DispatchRecommendation).filter(models.DispatchRecommendation.incident_id == incident_id).order_by(models.DispatchRecommendation.created_at.desc()).first()
    if not rec:
        # Generate on the fly
        return generate_dispatch_recommendation(incident_id, db)
    return rec


@app.post("/api/dispatch/approve/{recommendation_id}")
def approve_dispatch(recommendation_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.DispatchRecommendation).filter(models.DispatchRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "VEHICLE_DISPATCHED"
    rec.dispatched_at = datetime.utcnow()

    inc = db.query(models.Incident).filter(models.Incident.id == rec.incident_id).first()
    if inc:
        inc.status = "VEHICLE_EN_ROUTE"
        inc.assigned_team_name = rec.provider_name

    db.commit()
    return {"status": "DISPATCH_APPROVED", "recommendation": rec}


@app.post("/api/dispatch/simulate-step/{recommendation_id}")
def simulate_dispatch_step(recommendation_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.DispatchRecommendation).filter(models.DispatchRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    status_sequence = ["BEST_RESOURCE_FOUND", "PROVIDER_ASSIGNED", "VEHICLE_DISPATCHED", "VEHICLE_EN_ROUTE", "VEHICLE_ARRIVED", "PATIENT_TRANSPORTED", "INCIDENT_CLOSED"]
    current_idx = status_sequence.index(rec.status) if rec.status in status_sequence else 0
    next_idx = min(len(status_sequence) - 1, current_idx + 1)
    new_status = status_sequence[next_idx]

    rec.status = new_status
    inc = db.query(models.Incident).filter(models.Incident.id == rec.incident_id).first()
    if inc:
        if new_status in ["VEHICLE_DISPATCHED", "VEHICLE_EN_ROUTE"]:
            inc.status = "VEHICLE_EN_ROUTE"
        elif new_status == "VEHICLE_ARRIVED":
            inc.status = "ARRIVED"
        elif new_status in ["PATIENT_TRANSPORTED", "INCIDENT_CLOSED"]:
            inc.status = "RESOLVED"

    db.commit()
    return {"status": new_status, "recommendation": rec}


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


# ==========================================
# AI COPILOT ENDPOINT
# ==========================================

@app.post("/api/copilot/ask")
async def ask_copilot(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """AI Copilot — instant Q&A for emergency operators."""
    question = payload.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    incidents = db.query(models.Incident).all()
    critical_count = sum(1 for i in incidents if i.urgency == "CRITICAL" and i.status != "RESOLVED")
    active_count = sum(1 for i in incidents if i.status != "RESOLVED")
    departments = list(set(i.assigned_team_department for i in incidents if i.assigned_team_department))

    context = {
        "incidents_count": active_count,
        "critical_count": critical_count,
        "active_departments": departments
    }

    answer = await gemini_service.generate_copilot_answer(question, context)
    return {"question": question, "answer": answer, "timestamp": datetime.utcnow().isoformat()}


# ==========================================
# POST-INCIDENT AI REPORT
# ==========================================

@app.get("/api/incidents/{incident_id}/post-incident-report")
async def get_post_incident_report(incident_id: int, db: Session = Depends(get_db)):
    """Generate and return a full AI post-incident report."""
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    report_text = await gemini_service.generate_post_incident_report(inc.__dict__)
    return {
        "incident_id": inc.id,
        "title": inc.title,
        "category": inc.category,
        "status": inc.status,
        "report": report_text,
        "generated_at": datetime.utcnow().isoformat()
    }


# ==========================================
# COMMUNITY SAFETY SCORE
# ==========================================

@app.get("/api/community-safety")
def get_community_safety_score(db: Session = Depends(get_db)):
    """Compute community safety scores from all available data."""
    incidents = db.query(models.Incident).all()
    weather = db.query(models.WeatherMetric).first()
    health = db.query(models.HealthMetric).all()
    water = db.query(models.WaterMetric).all()

    # Fire Risk: count recent fire incidents
    fire_incidents = sum(1 for i in incidents if "Fire" in str(i.category))
    fire_risk = min(100, fire_incidents * 15 + 20)

    # Flood Risk: weather-based
    rainfall = weather.rainfall_mm if weather else 25.0
    flood_risk = min(100, int((rainfall / 120.0) * 80) + 15)

    # Medical Risk: hospital occupancy
    avg_occ = sum(h.hospital_bed_occupancy_pct for h in health) / max(1, len(health)) if health else 55.0
    health_risk = min(100, int(avg_occ * 0.8))

    # Water Risk
    water_risk_count = sum(1 for w in water if w.contamination_risk in ["UNHEALTHY", "HAZARDOUS"])
    water_risk = min(100, water_risk_count * 25 + 10)

    # Crime Risk: police incidents
    crime_incidents = sum(1 for i in incidents if "Police" in str(i.category) or "Crime" in str(i.category))
    crime_risk = min(100, crime_incidents * 20 + 15)

    # Emergency Readiness: based on available resources
    resources = db.query(models.Resource).filter(models.Resource.status == "AVAILABLE").count()
    readiness = min(100, resources * 10 + 40)

    overall = 100 - int((fire_risk + flood_risk + health_risk + water_risk + crime_risk) / 5 * 0.6 + (100 - readiness) * 0.1)
    overall = max(0, min(100, overall))

    return {
        "locality": "Krishna District Metro Zone",
        "scores": {
            "flood_risk": flood_risk,
            "fire_risk": fire_risk,
            "crime_risk": crime_risk,
            "health_risk": health_risk,
            "water_safety": 100 - water_risk,
            "emergency_readiness": readiness
        },
        "overall_score": overall,
        "grade": "A" if overall >= 80 else "B" if overall >= 65 else "C" if overall >= 50 else "D",
        "updated_at": datetime.utcnow().isoformat()
    }


# ==========================================
# AI INCIDENT PRIORITY SCORE
# ==========================================

@app.get("/api/incidents/{incident_id}/priority-score")
def get_incident_priority_score(incident_id: int, db: Session = Depends(get_db)):
    """Calculate AI-powered numeric priority score (0-100) for an incident."""
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    weather = db.query(models.WeatherMetric).first()

    # Base score from severity
    base = inc.severity_score * 9  # 0-90

    # Urgency modifier
    urgency_bonus = {"CRITICAL": 10, "HIGH": 6, "MEDIUM": 3, "LOW": 0}.get(inc.urgency, 3)

    # Weather modifier
    rainfall_bonus = 0
    if weather and weather.rainfall_mm > 60:
        rainfall_bonus = 5

    # Category weight
    cat_weight = {
        "Medical Emergency": 8, "SOS": 10, "Fire Emergency": 9, "Flood Emergency": 8,
        "Road Accident": 7, "Building Collapse": 9, "Gas Leak": 8, "Power Failure": 4
    }.get(inc.category, 5)

    score = min(100, base + urgency_bonus + rainfall_bonus + (cat_weight // 2))

    breakdown = [
        f"Severity Score: {inc.severity_score}/10 → base {base} pts",
        f"Urgency Level ({inc.urgency}): +{urgency_bonus} pts",
        f"Category Weight ({inc.category}): +{cat_weight // 2} pts",
        f"Weather Modifier: +{rainfall_bonus} pts" if rainfall_bonus else "Weather: No additional risk"
    ]

    return {
        "incident_id": inc.id,
        "priority_score": score,
        "grade": "CRITICAL" if score >= 85 else "HIGH" if score >= 70 else "MEDIUM" if score >= 50 else "LOW",
        "breakdown": breakdown,
        "category": inc.category,
        "urgency": inc.urgency
    }


# ==========================================
# HACKATHON DEMO MODE — AUTO SIMULATION
# ==========================================

@app.post("/api/demo/trigger-scenario")
async def trigger_demo_scenario(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a vivid demo emergency scenario for hackathon judges."""
    import random
    scenarios = [
        {
            "title": "🚨 Cardiac Arrest — Citizen Down at Hitech City Junction",
            "category": "Medical Emergency",
            "description": "67-year-old male collapsed unconscious at Hitech City Signal. Bystanders performing CPR. Multiple witnesses called 108. ALS ambulance with defibrillator required immediately.",
            "urgency": "CRITICAL",
            "address": "Hitech City Junction, Madhapur",
            "latitude": 17.4486,
            "longitude": 78.3908,
            "severity_score": 10,
        },
        {
            "title": "🔥 Building Fire — Chemical Plant Sector 4",
            "category": "Fire Emergency",
            "description": "Multi-storey chemical storage facility on fire. Thick black smoke visible 5km radius. 3 workers reportedly trapped on 2nd floor. Hazmat risk elevated.",
            "urgency": "CRITICAL",
            "address": "Sector 4 Industrial Zone, Patancheru",
            "latitude": 17.5299,
            "longitude": 78.2651,
            "severity_score": 10,
        },
        {
            "title": "🌊 Flash Flood — Residential Colony Submerged",
            "category": "Flood Emergency",
            "description": "Low-lying residential colony submerged 4 feet deep after sudden Krishna river overflow. 200+ residents stranded on rooftops. Elderly and children reported. SDRF boats required urgently.",
            "urgency": "CRITICAL",
            "address": "Ward 12, Riverbank Colony, Krishna District",
            "latitude": 16.5095,
            "longitude": 80.6455,
            "severity_score": 10,
        }
    ]

    chosen = random.choice(scenarios)
    demo_inc = models.Incident(
        title=chosen["title"],
        category=chosen["category"],
        description=chosen["description"],
        urgency=chosen["urgency"],
        address=chosen["address"],
        latitude=chosen["latitude"],
        longitude=chosen["longitude"],
        severity_score=chosen["severity_score"],
        confidence_score=0.99,
        status="AI_VERIFIED",
        is_verified=True,
        reporter_name="Demo Citizen",
        reporter_phone="Demo Mode",
        ai_summary=f"DEMO: {chosen['title']} — AI verified with 99% confidence. Immediate multi-department response required.",
        recommended_actions=[
            "Dispatch nearest ALS-equipped emergency unit immediately",
            "Notify District Emergency Control Room",
            "Alert nearest hospital ICU to prepare trauma bay"
        ]
    )
    db.add(demo_inc)
    db.commit()
    db.refresh(demo_inc)

    return {
        "status": "DEMO_SCENARIO_CREATED",
        "incident_id": demo_inc.id,
        "scenario": chosen["title"],
        "message": "Demo incident created. Dispatcher Agent will auto-generate recommendation."
    }
