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


WEEKDAY_MAP = {
    "понедельник": 0,
    "вторник": 1,
    "среду": 2,
    "среда": 2,
    "четверг": 3,
    "пятницу": 4,
    "пятница": 4,
    "субботу": 5,
    "суббота": 5,
    "воскресенье": 6,
    "воскресеньӗ": 6,
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


def _next_weekday(base: datetime, weekday: int) -> datetime:
    delta_days = (weekday - base.weekday()) % 7
    if delta_days == 0:
        delta_days = 7
    return base + timedelta(days=delta_days)


def detect_datetime(text: str) -> datetime | None:
    """
    Извлекает дату и время из простых шаблонов:
    - завтра
    - послезавтра
    - сегодня
    - через N часов
    - в HH:MM
    - утром / вечером / днем / ночью
    - в N вечера / утра / дня
    - в понедельник / во вторник / ...
    - на следующей неделе
    """
    lowered = text.lower()
    now = datetime.now()

    if "через " in lowered:
        hours_match = re.search(r"через\s+(\d+)\s+час", lowered)
        if hours_match:
            return now + timedelta(hours=int(hours_match.group(1)))

    base_date = now.date()

    if "послезавтра" in lowered:
        base_date = (now + timedelta(days=2)).date()
    elif "завтра" in lowered:
        base_date = (now + timedelta(days=1)).date()
    elif "сегодня" in lowered:
        base_date = now.date()
    elif "на следующей неделе" in lowered:
        return datetime.combine(
            (now + timedelta(days=7)).date(),
            datetime.min.time(),
        ).replace(hour=9, minute=0)
    else:
        weekday_match = re.search(
            r"\b(?:в|во)\s+(понедельник|вторник|среду|среда|четверг|пятницу|пятница|субботу|суббота|воскресенье)\b",
            lowered,
        )
        if weekday_match:
            next_date = _next_weekday(now, WEEKDAY_MAP[weekday_match.group(1)])
            base_date = next_date.date()

    explicit_time_match = re.search(r"\b(?:в\s*)?(\d{1,2}):(\d{2})\b", lowered)
    if explicit_time_match:
        hour = int(explicit_time_match.group(1))
        minute = int(explicit_time_match.group(2))

        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return datetime.combine(
                base_date,
                datetime.min.time(),
            ).replace(hour=hour, minute=minute)

    named_hour_match = re.search(r"\bв\s+(\d{1,2})\s+(вечера|утра|дня)\b", lowered)
    if named_hour_match:
        hour = int(named_hour_match.group(1))
        period = named_hour_match.group(2)

        if period == "вечера" and 1 <= hour <= 11:
            hour += 12
        elif period == "дня" and 1 <= hour <= 11:
            hour += 12

        if 0 <= hour <= 23:
            return datetime.combine(
                base_date,
                datetime.min.time(),
            ).replace(hour=hour, minute=0)

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
