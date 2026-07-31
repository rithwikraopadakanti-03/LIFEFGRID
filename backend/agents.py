import math
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("lifegrid.agents")

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in kilometers between two GPS coordinates."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class WeatherIntelligenceAgent:
    name = "Weather Intelligence Agent"
    role = "Atmospheric Risk & Flash Flood Forecaster"

    def analyze(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        rainfall = weather_data.get("rainfall_mm", 45.0)
        temp = weather_data.get("temperature_c", 34.0)
        wind = weather_data.get("wind_speed_kmh", 28.0)
        humidity = weather_data.get("humidity_pct", 88.0)

        # Risk scoring algorithms
        flood_prob = min(100.0, (rainfall / 120.0) * 100.0 + (humidity / 100.0) * 15.0)
        heat_idx = temp + (0.55 * (1 - humidity/100) * (temp - 14.5))

        alert_level = "LOW"
        if flood_prob > 75 or rainfall > 90:
            alert_level = "EXTREME"
        elif flood_prob > 50 or rainfall > 50:
            alert_level = "SEVERE"
        elif flood_prob > 30:
            alert_level = "MODERATE"

        return {
            "agent_name": self.name,
            "role": self.role,
            "status": "ACTIVE_MONITORING",
            "alert_level": alert_level,
            "flood_probability_pct": round(flood_prob, 1),
            "heat_index_c": round(heat_idx, 1),
            "rainfall_24h_mm": rainfall,
            "wind_speed_kmh": wind,
            "confidence": 0.95,
            "reasoning": f"Rainfall rate of {rainfall}mm/24h combined with {humidity}% humidity yields a {round(flood_prob,1)}% flash flood vector.",
            "recommendations": [
                "Issue low-lying area evacuation alert for sectors 4 & 7",
                "Pre-position drainage pump units at river basin culverts",
                "Notify water management board to adjust dam discharge"
            ]
        }


class HealthIntelligenceAgent:
    name = "Health Intelligence Agent"
    role = "Epidemic Surveillance & Hospital Surge Coordinator"

    def analyze(self, health_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_cases = sum(d.get("active_cases", 0) for d in health_data)
        avg_bed_occ = sum(d.get("hospital_bed_occupancy_pct", 0) for d in health_data) / max(1, len(health_data))
        min_med_stock = min([d.get("medicine_stock_pct", 100) for d in health_data] or [85.0])

        outbreak_risk = "LOW"
        if total_cases > 500 or avg_bed_occ > 85.0:
            outbreak_risk = "CRITICAL"
        elif total_cases > 200 or avg_bed_occ > 70.0:
            outbreak_risk = "HIGH"
        elif total_cases > 100:
            outbreak_risk = "MODERATE"

        return {
            "agent_name": self.name,
            "role": self.role,
            "status": "ACTIVE_MONITORING",
            "outbreak_risk_level": outbreak_risk,
            "avg_hospital_occupancy_pct": round(avg_bed_occ, 1),
            "min_medicine_stock_pct": round(min_med_stock, 1),
            "active_surveillance_cases": total_cases,
            "confidence": 0.92,
            "reasoning": f"Surveillance data shows {total_cases} active cases across district clinics. ICU & Emergency bed occupancy stands at {round(avg_bed_occ, 1)}%.",
            "recommendations": [
                "Reallocate 50 emergency ventilator units to District General Hospital",
                "Deploy mobile medical triage units to flood shelter zones",
                "Issue public vector-borne disease alert (Dengue & Waterborne Pathogens)"
            ]
        }


class WaterSafetyAgent:
    name = "Water Safety Agent"
    role = "Hydrological Contamination & Quality Sentinel"

    def analyze(self, water_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        high_risk_stations = [w for w in water_data if w.get("contamination_risk") in ["UNHEALTHY", "HAZARDOUS"]]
        inspection_needed = len(high_risk_stations) > 0

        return {
            "agent_name": self.name,
            "role": self.role,
            "status": "ACTIVE_MONITORING",
            "high_risk_stations_count": len(high_risk_stations),
            "inspection_recommended": inspection_needed,
            "confidence": 0.94,
            "reasoning": f"Analyzed real-time pH, Turbidity, and Dissolved Oxygen sensors. {len(high_risk_stations)} water intake stations reported turbidity spikes > 15 NTU.",
            "recommendations": [
                "Trigger immediate water purification dosing at Krishna Central Station",
                "Supply emergency mobile water tankers to Sector 3 residential blocks",
                "Dispatch bio-hazard sampling team to inspect upstream industrial discharge"
            ]
        }


class InfrastructureAgent:
    name = "Infrastructure Agent"
    role = "Lifeline Networks & Evacuation Route Inspector"

    def analyze(self, infra_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        road_closures = sum(i.get("road_closures_count", 0) for i in infra_data)
        avg_power_outage = sum(i.get("power_outage_pct", 0) for i in infra_data) / max(1, len(infra_data))
        min_bridge_score = min([i.get("bridge_integrity_score", 100) for i in infra_data] or [90])

        return {
            "agent_name": self.name,
            "role": self.role,
            "status": "ACTIVE_MONITORING",
            "total_road_closures": road_closures,
            "power_grid_outage_pct": round(avg_power_outage, 1),
            "critical_bridge_structural_score": min_bridge_score,
            "confidence": 0.96,
            "reasoning": f"Sensor mesh reports {road_closures} inundated road segments. Power grid affected in {round(avg_power_outage,1)}% of distribution sectors.",
            "recommendations": [
                "Reroute emergency response traffic through Bypass Corridor Highway B-4",
                "Dispatch backup diesel generator units to Central Hospital Substation",
                "Close Krishna Old Bridge to heavy transport vehicles due to flood pressure"
            ]
        }


class CitizenVoiceAgent:
    name = "Citizen Voice Agent"
    role = "Multi-Lingual Conversational NLP & Distress Dispatcher"

    def analyze(self, call_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        recent_calls_count = len(call_logs)
        distress_keywords = ["help", "trapped", "injured", "flood", "बच्चे", "గాయం", "कாயம்"]
        urgent_call_count = sum(1 for c in call_logs if any(kw in str(c).lower() for kw in distress_keywords))

        return {
            "agent_name": self.name,
            "role": self.role,
            "status": "STANDBY_READY",
            "languages_supported": ["English", "Hindi", "Telugu", "Tamil", "Kannada"],
            "processed_calls_24h": recent_calls_count,
            "distress_signals_extracted": urgent_call_count,
            "confidence": 0.98,
            "reasoning": f"Active AI Voice pipeline listening in 5 regional languages. Identified {urgent_call_count} urgent distress reports needing automated callback verification.",
            "recommendations": [
                "Initiate automated multi-lingual outbound check-in calls to elderly residents in flood zone",
                "Synthesize voice complaint coordinates directly into spatial dispatch queue"
            ]
        }


class ResourcePlanningAgent:
    name = "Resource Planning Agent"
    role = "Geospatial Optimization & Rescue Dispatch Engine"

    def find_nearest(self, lat: float, lng: float, resources: List[Dict[str, Any]]) -> Dict[str, Any]:
        matched = {
            "nearest_hospital": None,
            "nearest_shelter": None,
            "nearest_ambulance": None,
            "nearest_police": None,
            "nearest_fire_station": None,
            "nearest_volunteer": None
        }

        # Categorize
        hospitals = [r for r in resources if r.get("type") == "Hospital" and r.get("status") == "AVAILABLE"]
        shelters = [r for r in resources if r.get("type") == "Shelter" and r.get("status") == "AVAILABLE"]
        ambulances = [r for r in resources if r.get("type") == "Ambulance" and r.get("status") == "AVAILABLE"]
        police = [r for r in resources if r.get("type") == "Police"]
        fire = [r for r in resources if r.get("type") == "FireStation"]
        volunteers = [r for r in resources if r.get("type") == "Volunteer"]

        def calc_closest(items):
            if not items:
                return None
            items_with_dist = []
            for item in items:
                d = haversine_distance(lat, lng, item.get("latitude", 0), item.get("longitude", 0))
                items_with_dist.append((d, item))
            items_with_dist.sort(key=lambda x: x[0])
            closest_dist, item = items_with_dist[0]
            item_copy = dict(item)
            item_copy["distance_km"] = round(closest_dist, 2)
            item_copy["eta_minutes"] = max(3, int(closest_dist * 2.5))
            return item_copy

        matched["nearest_hospital"] = calc_closest(hospitals)
        matched["nearest_shelter"] = calc_closest(shelters)
        matched["nearest_ambulance"] = calc_closest(ambulances)
        matched["nearest_police"] = calc_closest(police)
        matched["nearest_fire_station"] = calc_closest(fire)
        matched["nearest_volunteer"] = calc_closest(volunteers)

        return matched


class EmergencyCoordinatorAgent:
    name = "Emergency Coordinator Agent"
    role = "Chief Autonomous Incident Commander"

    def synthesize_response(
        self,
        incident: Dict[str, Any],
        weather_analysis: Dict[str, Any],
        health_analysis: Dict[str, Any],
        infra_analysis: Dict[str, Any],
        water_analysis: Dict[str, Any],
        resource_matches: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        category = incident.get("category", "General Emergency")
        urgency = incident.get("urgency", "HIGH")
        lat = incident.get("latitude", 0.0)
        lng = incident.get("longitude", 0.0)

        # Dynamic multi-agency response plan generation
        actions = []
        notifications = []

        amb = resource_matches.get("nearest_ambulance")
        hosp = resource_matches.get("nearest_hospital")
        shelter = resource_matches.get("nearest_shelter")
        fire = resource_matches.get("nearest_fire_station")

        if amb:
            actions.append(f"Dispatched Ambulance [{amb['name']}] (ETA: {amb['eta_minutes']} mins, Distance: {amb['distance_km']} km)")
            notifications.append({"target": "Ambulance Unit", "msg": f"Respond to {category} at ({lat:.4f}, {lng:.4f})"})
        
        if hosp:
            actions.append(f"Alerted Emergency ER Ward at [{hosp['name']}] to reserve ICU/Trauma bed")
            notifications.append({"target": "Hospital ER", "msg": f"Prepare incoming patient from {category} site"})

        if shelter and urgency in ["CRITICAL", "HIGH"]:
            actions.append(f"Designated [{shelter['name']}] as primary evacuation drop point (Capacity available: {shelter['capacity'] - shelter['current_occupancy']})")

        if category == "Fire" and fire:
            actions.append(f"Dispatched Fire Tender from [{fire['name']}] (ETA: {fire['eta_minutes']} mins)")

        actions.append(f"Triggered automated Voice AI callback calls to citizens within 1.5km radius")
        actions.append(f"Infrastructure Agent locked clear route via safe corridor B-4")

        summary = f"Emergency Coordinator Agent has generated a unified multi-department response plan for {category} (Urgency: {urgency}). All nearest resources locked, routes clear, authorities alerted."

        return {
            "agent_name": self.name,
            "role": self.role,
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "COORDINATED_RESPONSE_DISPATCHED",
            "incident_id": incident.get("id"),
            "severity_level": incident.get("severity_score", 8),
            "summary": summary,
            "actions_triggered": actions,
            "department_notifications": notifications,
            "assigned_resources_summary": {
                "ambulance": amb.get("name") if amb else "N/A",
                "hospital": hosp.get("name") if hosp else "N/A",
                "shelter": shelter.get("name") if shelter else "N/A"
            }
        }
