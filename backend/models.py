from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    phone = Column(String)
    role = Column(String, default="CITIZEN")  # CITIZEN, EMERGENCY_TEAM
    team_department = Column(String, nullable=True)  # POLICE, FIRE, AMBULANCE, DISASTER_RESPONSE, HOSPITAL, MUNICIPALITY
    address = Column(String, nullable=True)
    emergency_contacts = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String)  # Flood, Fire, Accident, Medical Emergency, Building Collapse, Gas Leak, Power Failure, Water Issue
    description = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String)
    urgency = Column(String, default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    
    # Enhanced Dispatch State Machine
    status = Column(String, default="SUBMITTED")  # SUBMITTED, AI_VERIFIED, TEAM_ASSIGNED, EN_ROUTE, ARRIVED, RESOLVED
    eta_seconds = Column(Integer, default=480)  # Countdown timer in seconds
    
    photo_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    audio_recording_url = Column(String, nullable=True)
    voice_transcript = Column(Text, nullable=True)
    voice_audio_url = Column(String, nullable=True)
    reporter_name = Column(String, default="Anonymous Citizen")
    reporter_phone = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # AI Verification & Explainable AI fields
    is_verified = Column(Boolean, default=False)
    is_fake = Column(Boolean, default=False)
    is_duplicate = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.85)
    severity_score = Column(Integer, default=7)  # 1 to 10
    risk_score = Column(Float, default=8.5)
    department_assigned = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    recommended_actions = Column(JSON, default=list)
    explainable_reasoning = Column(JSON, default=list)
    assigned_resources = Column(JSON, default=dict)
    weather_at_report = Column(JSON, default=dict)
    predictive_alerts = Column(JSON, default=list)
    
    # Dispatch Assignment details
    assigned_team_name = Column(String, nullable=True)
    assigned_team_department = Column(String, nullable=True)
    accepted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    timeline = relationship("TimelineEvent", back_populates="incident", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="incident", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    sender_name = Column(String)
    sender_role = Column(String)  # Citizen, Fire Captain, ALS Paramedic, Police Dispatch, Hospital ER
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="chat_messages")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    agent_name = Column(String)
    action = Column(String)
    details = Column(Text)
    status_change = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="timeline")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)  # Hospital, Shelter, Ambulance, Police, FireStation, Volunteer
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String)
    contact_number = Column(String)
    capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=20)
    status = Column(String, default="AVAILABLE")  # AVAILABLE, BUSY, FULL, IN_TRANSIT
    details = Column(JSON, default=dict)
    last_updated = Column(DateTime, default=datetime.utcnow)


class WeatherMetric(Base):
    __tablename__ = "weather_metrics"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, default="District Metro Zone")
    latitude = Column(Float)
    longitude = Column(Float)
    temperature_c = Column(Float)
    humidity_pct = Column(Float)
    rainfall_mm = Column(Float)
    wind_speed_kmh = Column(Float)
    flood_probability = Column(Float)
    heat_index_c = Column(Float)
    storm_alert_level = Column(String, default="LOW")
    forecast_summary = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)
    district_name = Column(String)
    disease_name = Column(String)
    active_cases = Column(Integer)
    new_cases_24h = Column(Integer)
    hospital_bed_occupancy_pct = Column(Float)
    medicine_stock_pct = Column(Float)
    outbreak_risk_level = Column(String)
    recovery_rate_pct = Column(Float)
    emergency_cases = Column(Integer)
    ai_medical_advice = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class WaterMetric(Base):
    __tablename__ = "water_metrics"

    id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String)
    ph_level = Column(Float)
    turbidity_ntu = Column(Float)
    dissolved_oxygen_mg_l = Column(Float)
    contamination_risk = Column(String)
    water_level_meters = Column(Float)
    threshold_capacity_pct = Column(Float)
    inspection_recommended = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class InfrastructureMetric(Base):
    __tablename__ = "infrastructure_metrics"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String)
    road_closures_count = Column(Integer, default=0)
    power_outage_pct = Column(Float, default=0.0)
    bridge_integrity_score = Column(Float, default=95.0)
    traffic_congestion = Column(String, default="NORMAL")
    safe_evacuation_routes = Column(JSON, default=list)
    timestamp = Column(DateTime, default=datetime.utcnow)


class DigitalTwinZone(Base):
    __tablename__ = "digital_twin_zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String, unique=True, index=True)
    name = Column(String)
    population = Column(Integer)
    hospitals_count = Column(Integer)
    schools_count = Column(Integer)
    power_grid_status = Column(String, default="STABLE")
    water_supply_status = Column(String, default="NORMAL")
    overall_health_score = Column(Float, default=88.5)
    risk_level = Column(String, default="LOW")
    latitude = Column(Float)
    longitude = Column(Float)
    polygon_coordinates = Column(JSON, nullable=True)
    last_synced = Column(DateTime, default=datetime.utcnow)


class VoiceCallLog(Base):
    __tablename__ = "voice_call_logs"

    id = Column(Integer, primary_key=True, index=True)
    citizen_phone = Column(String)
    language = Column(String, default="en")
    call_type = Column(String, default="OUTBOUND")
    transcript = Column(Text)
    ai_response = Column(Text)
    structured_extracted_data = Column(JSON, default=dict)
    summary = Column(Text)
    duration_seconds = Column(Integer, default=45)
    created_at = Column(DateTime, default=datetime.utcnow)


class DispatchProvider(Base):
    __tablename__ = "dispatch_providers"

    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String, index=True)  # "Government 108", "Apollo Emergency", "Fortis ALS", "Hospital Fleet", "Blinkit Rapid Ambulance"
    provider_category = Column(String)  # GOVERNMENT, PRIVATE, HOSPITAL, DEMO_FLEET, VOLUNTEER
    vehicle_id = Column(String, unique=True, index=True)  # "AP-09-AM-1082"
    vehicle_type = Column(String)  # Ambulance, Police, FireTender, RescueBoat, VolunteerUnit
    is_als = Column(Boolean, default=True)  # Advanced Life Support
    is_bls = Column(Boolean, default=True)  # Basic Life Support
    has_icu = Column(Boolean, default=False)
    driver_name = Column(String, default="Senior Paramedic Chief")
    contact_number = Column(String, default="108")
    current_lat = Column(Float)
    current_lon = Column(Float)
    availability_status = Column(String, default="AVAILABLE")  # AVAILABLE, DISPATCHED, EN_ROUTE, ARRIVED, BUSY
    current_speed_kmh = Column(Float, default=0.0)
    rating_score = Column(Float, default=4.9)
    last_updated = Column(DateTime, default=datetime.utcnow)


class DispatchRecommendation(Base):
    __tablename__ = "dispatch_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    provider_id = Column(Integer, ForeignKey("dispatch_providers.id"), nullable=True)
    provider_name = Column(String)
    vehicle_id = Column(String)
    driver_name = Column(String)
    contact_number = Column(String)
    vehicle_type = Column(String)
    
    # Decision Matrix
    priority_level = Column(String, default="CRITICAL")  # CRITICAL, URGENT, ROUTINE
    required_services = Column(JSON, default=list)
    distance_km = Column(Float)
    eta_minutes = Column(Integer)
    traffic_level = Column(String, default="MODERATE")
    best_route_name = Column(String, default="NH65 Express Corridor")
    confidence_score = Column(Float, default=0.97)  # 0.97 = 97%
    
    # Explainable AI Explanation ("WHY")
    recommendation_reason = Column(Text)
    detailed_justification = Column(JSON, default=list)
    comparison_matrix = Column(JSON, default=list)
    
    # Live Status Progression: SUBMITTED -> AI_VERIFIED -> DISPATCHER_SEARCHING -> BEST_RESOURCE_FOUND -> PROVIDER_ASSIGNED -> VEHICLE_DISPATCHED -> VEHICLE_EN_ROUTE -> VEHICLE_ARRIVED -> PATIENT_TRANSPORTED -> INCIDENT_CLOSED
    status = Column(String, default="BEST_RESOURCE_FOUND")
    current_lat = Column(Float, nullable=True)
    current_lon = Column(Float, nullable=True)
    current_speed_kmh = Column(Float, default=0.0)
    dispatched_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
