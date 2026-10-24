from dataclasses import dataclass
from typing import Any, Self

from app.models import Model

PLANET_TYPES = ("lesson", "lab")


@dataclass(frozen=True)
class AgeRange(Model):
    id: str
    name: str
    slug: str
    min_age: int
    max_age: int | None
    description: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class Galaxy(Model):
    id: str
    age_range_id: str
    name: str
    slug: str
    description: str | None
    order_index: int
    sprite_key: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class PlanetarySystem(Model):
    id: str
    galaxy_id: str
    name: str
    slug: str
    description: str | None
    order_index: int
    sprite_key: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class Planet(Model):
    id: str
    planetary_system_id: str
    type: str
    name: str
    slug: str
    description: str | None
    sprite_key: str | None
    order_index: int
    created_at: str
    updated_at: str

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> Self:
        # O banco guarda o tipo do planeta na coluna "kind"; a API o expõe como "type".
        if row.get("type") is None and "kind" in row:
            row = {**row, "type": row["kind"]}
        return super().from_row(row)
