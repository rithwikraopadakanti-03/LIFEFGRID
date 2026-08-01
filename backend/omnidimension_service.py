import os
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("lifegrid.omnidimension")

# Load .env variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ[k.strip()] = v.strip()

OMNIDIMENSION_API_KEY = os.getenv("OMNIDIMENSION_API_KEY", "ScsPyhuOsEHBMRHbe1mJ3bme_eo1B_zllDnVo4WbxvI")
OMNIDIMENSION_AGENT_ID = int(os.getenv("OMNIDIMENSION_AGENT_ID", "134874"))

DEFAULT_TARGET_PHONE = "+918121985059"

async def dispatch_omnidimension_call(
    to_phone: str = DEFAULT_TARGET_PHONE,
    language: str = "en",
    incident_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Dispatches a real-time low-latency OmniDimension Conversational Voice AI Agent call to Indian mobile numbers (+91...).
    Overlays LifeGrid AI Emergency Command System Prompt in English, Telugu, Hindi, Tamil, Kannada.
    """
    if not to_phone.startswith("+"):
        to_phone = "+91" + to_phone.lstrip("0")

    url = "https://omnidim.io/api/v1/calls/dispatch"
    
    headers = {
        "Authorization": f"Bearer {OMNIDIMENSION_API_KEY}",
        "Content-Type": "application/json"
    }

    emergency_prompt = """You are LifeGrid AI Emergency Command Center Assistant calling a citizen following an SOS Panic Button trigger.
You must immediately assess their safety, locate their exact position, ask if there are injuries or fire/water hazards, and inform them that emergency services (108 Ambulance / Fire / Police) are on the way.
Be empathetic, calm, concise, and ultra-clear."""

    payload = {
        "agent_id": OMNIDIMENSION_AGENT_ID,
        "to_number": to_phone,
        "prompt": emergency_prompt,
        "first_sentence": "Emergency SOS Alert! LifeGrid AI Emergency Command Center here. We received your emergency signal. What is your emergency situation?",
        "custom_variables": {
            "platform": "LifeGrid AI Emergency OS",
            "citizen_name": "Valued Citizen",
            "system": "Emergency Crisis Response Engine"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code in [200, 201]:
                data = res.json()
                logger.info(f"OmniDimension SOS Voice Call successfully dispatched to {to_phone}: {data}")
                return {
                    "success": True,
                    "request_id": data.get("requestId"),
                    "status": "DISPATCHED",
                    "engine": "LifeGrid AI - OmniDimension Engine"
                }
            else:
                logger.warning(f"OmniDimension API returned status {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"OmniDimension API call error: {e}")

    return {
        "success": False,
        "status": "FAILED",
        "engine": "LifeGrid AI - OmniDimension Engine"
    }
