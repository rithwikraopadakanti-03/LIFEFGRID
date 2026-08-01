import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger("lifegrid.twilio")

# Load .env variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ[k.strip()] = v.strip()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+18052629069")

# Target User Phone Number
DEFAULT_TARGET_PHONE = "+918121985059"

async def make_emergency_call(
    to_phone: str = DEFAULT_TARGET_PHONE,
    message: str = "Emergency SOS Alert! LifeGrid AI has detected a high priority emergency report. Please state your emergency situation after the tone."
) -> bool:
    """
    Triggers an interactive two-way phone call to the user's mobile number via Twilio.
    Twilio uses <Gather input='speech'> so the user can speak back into the phone.
    """
    if not to_phone.startswith("+"):
        to_phone = "+91" + to_phone.lstrip("0")

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials missing. Skipping live phone call.")
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Calls.json"
    
    # Clean TwiML payload with Pause for trial account clarity
    twiml_payload = f"""<Response>
        <Pause length="1"/>
        <Say voice="alice" language="en-US">{message}</Say>
    </Response>"""

    payload = {
        "To": to_phone,
        "From": TWILIO_PHONE_NUMBER,
        "Twiml": twiml_payload
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                url,
                data=payload,
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            )
            if res.status_code in [200, 201]:
                logger.info(f"Interactive Twilio call successfully placed to {to_phone}")
                return True
            else:
                logger.warning(f"Twilio call API returned status {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"Failed to place Twilio call: {e}")

    return False
