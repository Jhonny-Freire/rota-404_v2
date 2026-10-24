from dataclasses import dataclass

from app.models import Model


@dataclass(frozen=True)
class User(Model):
    id: str
    display_name: str
    avatar_id: str | None
    age_range_id: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class Avatar(Model):
    id: str
    slug: str
    name: str
    sprite_key: str
    order_index: int
