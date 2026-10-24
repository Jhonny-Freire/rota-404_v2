from dataclasses import dataclass, field
from typing import Any, Self

from app.models import Model

PROGRESS_STATES = ("locked", "available", "in_progress", "completed")
ACHIEVEMENT_RARITIES = ("comum", "rara", "lenda", "brutal", "secreta")
RANKING_SCOPES = ("galaxy", "planetary_system")


@dataclass(frozen=True)
class ProgressRow(Model):
    """Linha da tabela user_progress (entity_type "planet", entity_id = id do planeta)."""

    id: str
    user_id: str
    entity_type: str
    entity_id: str
    status: str
    progress_percent: int
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class ProgressEntry(Model):
    """Progresso de um planeta como a API devolve: estado + melhor pontuação (labs)."""

    planet_id: str
    status: str
    best_points: int | None
    updated_at: str | None


@dataclass(frozen=True)
class Score(Model):
    id: str
    user_id: str
    galaxy_id: str
    planetary_system_id: str | None
    lab_id: str | None
    points: int
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class AchievementRow(Model):
    """Linha da tabela achievements: raridade, código e "secreta" ficam em criteria (jsonb)."""

    id: str
    name: str
    slug: str
    description: str | None
    sprite_key: str | None
    criteria: dict[str, Any] | None
    order_index: int


@dataclass(frozen=True)
class Achievement(Model):
    """Conquista como a API devolve."""

    id: str
    slug: str
    code: str | None
    name: str
    description: str | None
    sprite_key: str | None
    rarity: str
    secret: bool
    order_index: int

    @classmethod
    def from_catalog(cls, row: AchievementRow) -> Self:
        criteria = row.criteria or {}
        rarity = criteria.get("rarity")
        return cls(
            id=row.id,
            slug=row.slug,
            code=criteria.get("code"),
            name=row.name,
            description=row.description,
            sprite_key=row.sprite_key,
            rarity=rarity if rarity in ACHIEVEMENT_RARITIES else "comum",
            secret=bool(criteria.get("secret")),
            order_index=row.order_index,
        )


@dataclass(frozen=True)
class UserAchievementRow(Model):
    id: str
    user_id: str
    achievement_id: str
    unlocked_at: str


@dataclass(frozen=True)
class UserAchievement(Model):
    """Conquista desbloqueada pela conta (o slug é o que o frontend usa)."""

    achievement_id: str
    slug: str
    unlocked_at: str


@dataclass(frozen=True)
class RankingEntry(Model):
    position: int
    user_id: str
    display_name: str
    avatar_slug: str | None
    points: int
    completed_labs: int
    achievements: int = 0


@dataclass(frozen=True)
class Ranking(Model):
    scope: str
    scope_id: str
    entries: list[RankingEntry] = field(default_factory=list)
    me: RankingEntry | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> Self:
        me = row.get("me")
        return cls(
            scope=row.get("scope"),
            scope_id=row.get("scope_id"),
            entries=[RankingEntry.from_row(entry) for entry in row.get("entries") or []],
            me=RankingEntry.from_row(me) if me else None,
        )
