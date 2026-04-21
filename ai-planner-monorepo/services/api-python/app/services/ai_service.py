from __future__ import annotations

import json
from datetime import datetime

import httpx

from app.core.prompts import TASK_PARSER_SYSTEM_PROMPT


GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


class AIParseError(ValueError):
    """Ошибка разбора задачи через AI."""


def _build_prompt(text: str) -> str:
    now_iso = datetime.now().isoformat()
    return f"""
{TASK_PARSER_SYSTEM_PROMPT}

Current local datetime: {now_iso}

Extract a task from the following user text:
{text}
""".strip()


def _extract_text_from_response(data: dict) -> str:
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, TypeError) as error:
        raise AIParseError("Gemini returned an unexpected response format") from error


async def parse_task_from_text(text: str, api_key: str) -> dict:
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": _build_prompt(text),
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }

    params = {"key": api_key}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(GEMINI_API_URL, params=params, json=payload)
            response.raise_for_status()
    except httpx.TimeoutException as error:
        raise AIParseError("Gemini request timed out") from error
    except httpx.HTTPStatusError as error:
        raise AIParseError(
            f"Gemini request failed with status {error.response.status_code}",
        ) from error
    except httpx.HTTPError as error:
        raise AIParseError("Gemini request failed") from error

    response_text = _extract_text_from_response(response.json())

    try:
        return json.loads(response_text)
    except json.JSONDecodeError as error:
        raise AIParseError("Gemini returned invalid JSON") from error
