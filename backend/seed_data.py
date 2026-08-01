import os
import logging
from sqlalchemy.orm import Session
from datetime import datetime
from database import engine, SessionLocal, Base, DB_PATH
from models import (
    User, Incident, TimelineEvent, Resource, WeatherMetric,
    HealthMetric, WaterMetric, InfrastructureMetric, DigitalTwinZone, VoiceCallLog, AlertNotification, ChatMessage
)
import auth

logger = logging.getLogger("lifegrid.seed")

def seed_database(db: Session):
    # Recreate tables safely
    Base.metadata.create_all(bind=engine)

    logger.info("Updating LifeGrid EOC emergency dataset & lifelines...")

    # Clear old resources and re-seed authentic lifelines
    db.query(Resource).delete()
    db.commit()

    if db.query(User).count() == 0:
        # Seed Users if missing
        users = [
            User(
                email="citizen@lifegrid.ai",
                password_hash=auth.hash_password("password123"),
                full_name="Rithwik Rao",
                phone="+91 8121985059",
                role="CITIZEN",
                address="Flat 402, Riverbank Apartments, Ward 11",
                emergency_contacts=[{"name": "Sujata Rao", "relation": "Family", "phone": "+91 8121985059"}]
            ),
            User(
                email="fire@lifegrid.ai",
                password_hash=auth.hash_password("password123"),
                full_name="Capt. Vikram Singh",
                phone="+91 94400 10101",
                role="EMERGENCY_TEAM",
                team_department="FIRE",
                address="District Main Fire Station HQ"
            ),
            User(
                email="police@lifegrid.ai",
                password_hash=auth.hash_password("password123"),
                full_name="Inspector Rajesh Varma",
                phone="+91 94400 10000",
                role="EMERGENCY_TEAM",
                team_department="POLICE",
                address="Central Police Commissionerate"
            ),
            User(
                email="ambulance@lifegrid.ai",
                password_hash=auth.hash_password("password123"),
                full_name="Dr. Anita Reddy (ALS Lead)",
                phone="+91 94400 10808",
                role="EMERGENCY_TEAM",
                team_department="AMBULANCE",
                address="ALS Unit 108 Fleet Base"
            ),
            User(
                email="hospital@lifegrid.ai",
                password_hash=auth.hash_password("password123"),
                full_name="Dr. Suresh Kumar (ER Director)",
                phone="+91 866 2471001",
                role="EMERGENCY_TEAM",
                team_department="HOSPITAL",
                address="District Government Hospital ER"
            ),
            User(
                email="disaster@lifegrid.ai",
                password_hash=auth.hash_password("password123"),
                full_name="Cmdr. Arjun Rao",
                phone="+91 94400 99999",
                role="EMERGENCY_TEAM",
                team_department="DISASTER_RESPONSE",
                address="Disaster Rescue Battalion Base"
            )
        ]
        db.add_all(users)
        db.commit()

    # 1. Seed Users
    users = [
        User(
            email="citizen@lifegrid.ai",
            password_hash=auth.hash_password("password123"),
            full_name="Rithwik Rao",
            phone="+91 98765 43210",
            role="CITIZEN",
            address="Flat 402, Riverbank Apartments, Ward 11",
            emergency_contacts=[{"name": "Sujata Rao", "relation": "Family", "phone": "+91 98765 43211"}]
        ),
        User(
            email="fire@lifegrid.ai",
            password_hash=auth.hash_password("password123"),
            full_name="Capt. Vikram Singh",
            phone="+91 94400 10101",
            role="EMERGENCY_TEAM",
            team_department="FIRE",
            address="District Main Fire Station HQ"
        ),
        User(
            email="police@lifegrid.ai",
            password_hash=auth.hash_password("password123"),
            full_name="Inspector Rajesh Varma",
            phone="+91 94400 10000",
            role="EMERGENCY_TEAM",
            team_department="POLICE",
            address="Central Police Commissionerate"
        ),
        User(
            email="ambulance@lifegrid.ai",
            password_hash=auth.hash_password("password123"),
            full_name="Dr. Anita Reddy (ALS Lead)",
            phone="+91 94400 10808",
            role="EMERGENCY_TEAM",
            team_department="AMBULANCE",
            address="ALS Unit 108 Fleet Base"
        ),
        User(
            email="hospital@lifegrid.ai",
            password_hash=auth.hash_password("password123"),
            full_name="Dr. K. Srinivas (ER Chief)",
            phone="+91 94400 88888",
            role="EMERGENCY_TEAM",
            team_department="HOSPITAL",
            address="District General Hospital Trauma ER"
        ),
        User(
            email="drf@lifegrid.ai",
            password_hash=auth.hash_password("password123"),
            full_name="Cmdr. Arjun Rao",
            phone="+91 94400 99999",
            role="EMERGENCY_TEAM",
            team_department="DISASTER_RESPONSE",
            address="Disaster Rescue Battalion Base"
        )
    ]
    db.add_all(users)
    db.commit()

    # 2. Authentic Emergency Lifelines
    resources = [
      Resource(
        name="National Emergency Response System (112)",
        type="Helpline",
        latitude=16.5100,
        longitude=80.6480,
        address="All-in-One National SOS Emergency Command",
        contact_number="112",
        capacity=1000,
        current_occupancy=120,
        status="AVAILABLE",
        details={"service": "Police, Fire, Ambulance Unified SOS Dispatch"}
      ),
      Resource(
        name="ALS Medical Emergency & Ambulance Service (108)",
        type="Ambulance",
        latitude=16.5080,
        longitude=80.6490,
        address="24/7 District ALS Rapid Ambulance Fleet Base",
        contact_number="108",
        capacity=50,
        current_occupancy=14,
        status="AVAILABLE",
        details={"type": "Advanced Life Support & Paramedic ICU", "oxygen": True}
      ),
      Resource(
        name="District Main Fire & Rescue Department (101)",
        type="FireStation",
        latitude=16.5040,
        longitude=80.6580,
        address="Main Headquarters Fire Tender & Hazmat Station",
        contact_number="101",
        capacity=40,
        current_occupancy=8,
        status="AVAILABLE",
        details={"fire_tenders": 8, "water_cannons": 4, "boat_rescue_units": 4}
      ),
      Resource(
        name="Police Control Room & Patrol Force (100)",
        type="Police",
        latitude=16.5120,
        longitude=80.6460,
        address="Central Police Commissionerate Control Room",
        contact_number="100",
        capacity=200,
        current_occupancy=35,
        status="AVAILABLE",
        details={"patrol_units": 24, "rapid_action_force": True}
      ),
      Resource(
        name="NHAI Express Highway Helpline (1033)",
        type="HighwaySafety",
        latitude=16.5200,
        longitude=80.6400,
        address="National Highway Authority Incident Patrol Unit",
        contact_number="1033",
        capacity=30,
        current_occupancy=5,
        status="AVAILABLE",
        details={"highway_cranes": 4, "road_trauma_units": 2}
      ),
      Resource(
        name="State Disaster Response Force (NDRF / SDRF - 1078)",
        type="DisasterRescue",
        latitude=16.5020,
        longitude=80.6540,
        address="Flood & Earthquake Heavy Rescue Battalion",
        contact_number="1078",
        capacity=150,
        current_occupancy=20,
        status="AVAILABLE",
        details={"inflatable_boats": 12, "de-watering_pumps": 18}
      ),
      Resource(
        name="District Government Multi-Specialty Hospital ER",
        type="Hospital",
        latitude=16.5140,
        longitude=80.6520,
        address="Trauma ER & Critical ICU Care Center",
        contact_number="+91 866 2471001",
        capacity=450,
        current_occupancy=310,
        status="AVAILABLE",
        details={"icu_beds_free": 28, "ventilators_free": 16, "trauma_surgeons": 12}
      )
    ]
    db.add_all(resources)

    # 3. Weather
    weather = WeatherMetric(
        location_name="Krishna River Basin Metro Zone",
        latitude=16.5062,
        longitude=80.6480,
        temperature_c=31.5,
        humidity_pct=89.0,
        rainfall_mm=78.5,
        wind_speed_kmh=42.0,
        flood_probability=82.5,
        heat_index_c=38.2,
        storm_alert_level="SEVERE",
        forecast_summary="Heavy downpour associated with coastal depression. Flash flood warning active."
    )
    db.add(weather)

    # 4. Health Metrics
    health_items = [
        HealthMetric(
            district_name="Central Metro Zone",
            disease_name="Dengue Fever",
            active_cases=142,
            new_cases_24h=18,
            hospital_bed_occupancy_pct=74.5,
            medicine_stock_pct=88.0,
            outbreak_risk_level="MODERATE",
            recovery_rate_pct=92.4,
            emergency_cases=12,
            ai_medical_advice="Deploy fogging vehicles in Sectors 2 & 4."
        )
    ]
    db.add_all(health_items)

    # 5. Water Metrics
    water_items = [
        WaterMetric(
            station_name="Krishna River Intake Station A1",
            ph_level=7.2,
            turbidity_ntu=18.4,
            dissolved_oxygen_mg_l=6.1,
            contamination_risk="UNHEALTHY",
            water_level_meters=14.8,
            threshold_capacity_pct=92.0,
            inspection_recommended=True
        )
    ]
    db.add_all(water_items)

    # 6. Infrastructure
    infra_items = [
        InfrastructureMetric(
            zone_name="Sector 1 & Riverbank Corridor",
            road_closures_count=3,
            power_outage_pct=28.5,
            bridge_integrity_score=88.0,
            traffic_congestion="HEAVY",
            safe_evacuation_routes=["Bypass Highway B-4"]
        )
    ]
    db.add_all(infra_items)

    # 7. Digital Twin Zones
    zones = [
        DigitalTwinZone(
            zone_code="ZONE-01-CENTRAL",
            name="Central Riverbank & Commercial District",
            population=145000,
            hospitals_count=2,
            schools_count=14,
            power_grid_status="PARTIAL_OUTAGE",
            water_supply_status="CONTAMINATED",
            overall_health_score=72.4,
            risk_level="HIGH",
            latitude=16.5100,
            longitude=80.6480
        )
    ]
    db.add_all(zones)

    # 8. Sample Active Incident with Chat Messages & Timeline
    inc1 = Incident(
        title="Severe Waterlog & Flash Flood Inundation",
        category="Flood",
        description="Water level risen to 3 feet near Sector 2 Underpass. 4 families trapped on rooftop.",
        latitude=16.5095,
        longitude=80.6455,
        address="Sector 2 Underpass Road, Ward 11",
        urgency="CRITICAL",
        status="EN_ROUTE",
        eta_seconds=420,
        photo_url="https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=800&auto=format&fit=crop",
        voice_transcript="पानी बहुत तेजी से बढ़ रहा है! हम छत पर हैं!",
        reporter_name="Rithwik Rao (Citizen)",
        reporter_phone="+91 98765 43210",
        user_id=1,
        is_verified=True,
        is_fake=False,
        is_duplicate=False,
        confidence_score=0.96,
        severity_score=9,
        ai_summary="Flash flood rooftop trapped families verified via voice and photo telemetry.",
        recommended_actions=["Dispatch ALS Ambulance Unit 108-A1", "Deploy Fire Boat Team"],
        assigned_resources={
            "ambulance": "ALS Rapid Ambulance Unit 108-A1",
            "hospital": "District General Government Hospital",
            "shelter": "Central High School Flood Relief Shelter #1"
        },
        assigned_team_name="ALS Rapid Unit 108-A1",
        assigned_team_department="AMBULANCE"
    )

    db.add(inc1)
    db.commit()
    db.refresh(inc1)

    c1 = ChatMessage(
        incident_id=inc1.id,
        sender_name="Dr. Anita Reddy",
        sender_role="ALS Paramedic Lead",
        message="ALS Ambulance 108-A1 is en route to Sector 2 Underpass. ETA 7 minutes. Please stay on rooftop!"
    )
    c2 = ChatMessage(
        incident_id=inc1.id,
        sender_name="Rithwik Rao",
        sender_role="Citizen",
        message="Thank you! We are on the roof, 4 adults and 2 children."
    )
    db.add_all([c1, c2])

    t1 = TimelineEvent(
        incident_id=inc1.id,
        agent_name="Citizen Voice Agent",
        action="Distress Call Received",
        details="Extracted coordinates (16.5095, 80.6455) & 6 stranded individuals.",
        status_change="SUBMITTED"
    )
    t2 = TimelineEvent(
        incident_id=inc1.id,
        agent_name="Emergency Coordinator Agent",
        action="Dispatched Rescue Team",
        details="Matched nearest ALS Ambulance & Shelter. Crew marked EN_ROUTE.",
        status_change="EN_ROUTE"
    )
    db.add_all([t1, t2])

    db.commit()
    logger.info("Successfully seeded database with users, incidents, and chat messages.")
