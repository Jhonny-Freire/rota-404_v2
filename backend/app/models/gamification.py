from dataclasses import dataclass, field
from typing import Any, Self

from app.models import Model

PROGRESS_STATES = ("locked", "available", "in_progress", "completed")
ACHIEVEMENT_RARITIES = ("comum", "rara", "lenda")
RANKING_SCOPES = ("galaxy", "planetary_system")


@dataclass(frozen=True)
class ProgressEntry(Model):
    planet_id: str
    status: str
    started_at: str | None
    completed_at: str | None


@dataclass(frozen=True)
class Score(Model):
    id: str
    user_id: str
    lab_id: str
    points: int
    created_at: str


@dataclass(frozen=True)
class Achievement(Model):
    id: str
    slug: str
    name: str
    description: str | None
    sprite_key: str | None
    rarity: str


@dataclass(frozen=True)
class UserAchievement(Model):
    achievement_id: str
    unlocked_at: str


@dataclass(frozen=True)
class RankingEntry(Model):
    position: int
    user_id: str
    display_name: str
    avatar_slug: str | None
    points: int


@dataclass(frozen=True)
class Ranking(Model):
    scope: str
    scope_id: str
    entries: list[RankingEntry] = field(default_factory=list)

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> Self:
        return cls(
            scope=row.get("scope"),
            scope_id=row.get("scope_id"),
            entries=[RankingEntry.from_row(entry) for entry in row.get("entries") or []],
        )
