import hmac
import hashlib
from urllib.parse import unquote
from jose import JWTError, jwt
from app.core.config import settings


def validate_telegram_data(init_data: str, bot_token: str) -> dict:
    """Validate Telegram WebApp initData with HMAC-SHA-256."""
    data_check_string = "\n".join(
        f"{k}={v}"
        for k, v in sorted(
            (param.split("=", 1) for param in init_data.split("&") if param.split("=", 1)[0] != "hash")
        )
    )

    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode(),
        hashlib.sha256
    ).digest()

    expected_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    received_hash = dict(param.split("=", 1) for param in init_data.split("&")).get("hash", "")

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("Invalid Telegram initData hash")

    parsed = {}
    for param in init_data.split("&"):
        if "=" in param:
            key, value = param.split("=", 1)
            if key == "user":
                import json
                parsed["user"] = json.loads(unquote(value))
            else:
                parsed[key] = unquote(value)

    user = parsed.get("user", {})
    return {
        "id": int(user.get("id", 0)),
        "username": user.get("username"),
        "first_name": user.get("first_name"),
        "email": user.get("email"),
    }


def create_access_token(subject: str | int) -> str:
    """Create JWT token for a given subject (user_id)."""
    to_encode = {"sub": str(subject)}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(token: str) -> str | None:
    """Verify JWT token and return subject (user_id)."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload.get("sub")
    except JWTError:
        return None