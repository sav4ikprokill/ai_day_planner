from dataclasses import dataclass
from datetime import datetime, timedelta
import re


@dataclass
class ParsedTaskCommand:
    title: str
    category: str
    scheduled_at: datetime | None


CATEGORY_KEYWORDS = {
    "sport": ["тренировка", "спорт", "зал", "кардио", "пробежка"],
    "reading": ["чтение", "читать", "книга"],
    "prayer": ["молитва", "помолиться"],
    "study": ["учеба", "учёба", "занятие", "уроки", "подготовка"],
    "work": ["работа", "созвон", "задача", "проект"],
}


TIME_OF_DAY_MAP = {
    "утром": 9,
    "днем": 14,
    "днём": 14,
    "вечером": 19,
    "ночью": 22,
}


def detect_category(text: str) -> str:
    """Определяет категорию задачи по ключевым словам."""
    lowered = text.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return category

    return "general"


def detect_title(text: str, category: str) -> str:
    """
    Пытается построить title.
    Пока используем простой подход:
    убираем служебные глаголы в начале строки.
    """
    cleaned = text.strip()

    prefixes = [
        "добавь",
        "добавить",
        "запланируй",
        "запланировать",
        "создай",
        "создать",
        "напомни",
        "напомнить",
    ]

    lowered = cleaned.lower()
    for prefix in prefixes:
        if lowered.startswith(prefix + " "):
            cleaned = cleaned[len(prefix):].strip()
            break

    if cleaned:
        return cleaned[:255]

    return category


def detect_datetime(text: str) -> datetime | None:
    """
    Извлекает дату и время из простых шаблонов:
    - завтра
    - сегодня
    - в HH:MM
    - утром / вечером / днем / ночью
    """
    lowered = text.lower()
    now = datetime.now()

    base_date = now.date()

    if "завтра" in lowered:
        base_date = (now + timedelta(days=1)).date()
    elif "сегодня" in lowered:
        base_date = now.date()

    explicit_time_match = re.search(r"\b(?:в\s*)?(\d{1,2}):(\d{2})\b", lowered)
    if explicit_time_match:
        hour = int(explicit_time_match.group(1))
        minute = int(explicit_time_match.group(2))

        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return datetime.combine(
                base_date,
                datetime.min.time(),
            ).replace(hour=hour, minute=minute)

    for phrase, hour in TIME_OF_DAY_MAP.items():
        if phrase in lowered:
            return datetime.combine(
                base_date,
                datetime.min.time(),
            ).replace(hour=hour, minute=0)

    return None


def parse_task_command(text: str) -> ParsedTaskCommand:
    """Разбирает текстовую команду в структуру задачи."""
    category = detect_category(text)
    title = detect_title(text, category)
    scheduled_at = detect_datetime(text)

    return ParsedTaskCommand(
        title=title,
        category=category,
        scheduled_at=scheduled_at,
    )