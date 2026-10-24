from dataclasses import dataclass
from typing import Any

from app.models import Model


@dataclass(frozen=True)
class Lesson(Model):
    id: str
    planet_id: str
    title: str
    slug: str
    order_index: int
    content: dict[str, Any] | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class Lab(Model):
    id: str
    planet_id: str
    title: str
    slug: str
    order_index: int
    max_score: int
    config: dict[str, Any] | None
    created_at: str
    updated_at: str
