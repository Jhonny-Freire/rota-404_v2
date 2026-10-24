from dataclasses import dataclass

from app.models import Model


@dataclass(frozen=True)
class User(Model):
    """Dados públicos da conta. password_hash e token_hash ficam só nas linhas cruas do repositório."""

    id: str
    nickname: str | None
    display_name: str
    age: int | None
    age_range_id: str | None
    avatar_key: str | None
    knowledge_level: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class Avatar(Model):
    id: str
    slug: str
    name: str
    sprite_key: str
