from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    role: Optional[str] = "CITIZEN"  # CITIZEN, EMERGENCY_TEAM
    team_department: Optional[str] = None  # POLICE, FIRE, AMBULANCE, DISASTER_RESPONSE, HOSPITAL, MUNICIPALITY
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str
    role: str
    team_department: Optional[str]
    address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ChatMessageCreate(BaseModel):
    message: str
    sender_name: Optional[str] = "User"
    sender_role: Optional[str] = "Citizen"

class ChatMessageResponse(BaseModel):
    id: int
    incident_id: int
    sender_name: str
    sender_role: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    title: str
    category: str
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = "Detected Location"
    urgency: Optional[str] = "HIGH"
    photo_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    voice_audio_url: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous Citizen"
    reporter_phone: Optional[str] = None

class IncidentStatusUpdate(BaseModel):
    status: str  # SUBMITTED, AI_VERIFIED, TEAM_ASSIGNED, EN_ROUTE, ARRIVED, RESOLVED
    assigned_team_name: Optional[str] = None
    assigned_team_department: Optional[str] = None
    eta_seconds: Optional[int] = 480

class IncidentVerifyRequest(BaseModel):
    title: str
    category: str
    description: str
    photo_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    latitude: float
    longitude: float

class TimelineEventSchema(BaseModel):
    id: int
    agent_name: str
    action: str
    details: str
    status_change: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: int
    title: str
    category: str
    description: str
    latitude: float
    longitude: float
    address: Optional[str]
    urgency: str
    status: str
    eta_seconds: Optional[int] = 480
    photo_url: Optional[str]
    voice_transcript: Optional[str]
    reporter_name: Optional[str]
    reporter_phone: Optional[str]
    user_id: Optional[int]
    is_verified: bool
    is_fake: bool
    is_duplicate: bool
    confidence_score: float
    severity_score: int
    ai_summary: Optional[str]
    recommended_actions: List[str]
    assigned_resources: Dict[str, Any]
    assigned_team_name: Optional[str]
    assigned_team_department: Optional[str]
    created_at: datetime
    updated_at: datetime
    timeline: List[TimelineEventSchema] = []
    chat_messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class ResourceSchema(BaseModel):
    id: int
    name: str
    type: str
    latitude: float
    longitude: float
    address: str
    contact_number: str
    capacity: int
    current_occupancy: int
    status: str
    details: Dict[str, Any]
    last_updated: datetime

    class Config:
        from_attributes = True

class AgentStatusSchema(BaseModel):
    agent_name: str
    role: str
    status: str
    last_thought: str
    confidence: float
    metrics_analyzed: int
    recommendation: str

class VoiceProcessRequest(BaseModel):
    phone: Optional[str] = "+919876543210"
    language: str = "en"
    user_speech: str
    incident_context: Optional[Dict[str, Any]] = None

class VoiceProcessResponse(BaseModel):
    ai_speech_text: str
    audio_synthesis_prompt: str
    extracted_injuries: bool
    extracted_injured_count: int
    extracted_elderly_or_children: bool
    summary: str
    recommended_shelter: Optional[str] = None
    recommended_hospital: Optional[str] = None
    eta_minutes: int = 8
