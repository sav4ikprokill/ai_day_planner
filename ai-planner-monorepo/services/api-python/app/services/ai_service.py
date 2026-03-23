from __future__ import annotations

import json
from datetime import datetime

import httpx


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
You are a task extraction assistant for an AI planner.
Return ONLY a valid JSON object.
Do not wrap the response in markdown.
Do not include explanations.

Current local datetime: {now_iso}

Extract a task from the following user text:
{text}

Return JSON with exactly these keys:
- title: string, required
- description: string or null
- priority: integer, where 1=low, 2=medium, 3=high
- due_date: ISO 8601 datetime string or null

Rules:
- Infer priority from urgency words if possible, otherwise use 1.
- Infer due_date from relative dates like tomorrow, tonight, next Monday if possible.
- If date or time is unclear, use null.
- title must be short, clear, and actionable.
- description may contain extra useful details, otherwise null.
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
