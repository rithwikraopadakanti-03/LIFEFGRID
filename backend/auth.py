import hashlib
import os
import json
import base64
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "lifegrid_secret_key_hackathon_2026")

def hash_password(password: str) -> str:
    """Hashes password with SHA-256 for standard authentication."""
    return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a basic base64 encoded JWT-style JSON token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": int(expire.timestamp())})
    token_bytes = json.dumps(to_encode).encode()
    return base64.urlsafe_b64encode(token_bytes).decode()

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes token safely."""
    try:
        decoded_bytes = base64.urlsafe_b64decode(token.encode())
        data = json.loads(decoded_bytes.decode())
        if data.get("exp") and datetime.utcnow().timestamp() > data["exp"]:
            return None
        return data
    except Exception:
        return None
